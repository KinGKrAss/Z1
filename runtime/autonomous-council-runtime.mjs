/** Durable, opt-in autonomous Council task queue with feedback-based memory. */
import { mkdir, readFile, rename, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { selectGovernedModel } from "../core/model_router.mjs";
import { COUNCIL_TASK_TYPES, invokeCouncilModel } from "../core/council_agent_gateway.mjs";
import { getCouncilRole } from "../core/council_33.mjs";

const MAX_TASKS = 1000;
const MAX_MEMORIES = 5000;
const RETRY_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const clampInterval = value => Number.isInteger(value) && value >= 60 && value <= 525600;

async function atomicWrite(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tempPath, JSON.stringify(value, null, 2), { encoding:"utf8", mode:0o600 });
  await chmod(tempPath, 0o600);
  await rename(tempPath, filePath);
}

export class AutonomousCouncilRuntime {
  constructor({
    filePath = process.env.Z1_AGENT_STORE_PATH || path.resolve("data/z1_agents.json"),
    env = process.env,
    clock = () => Date.now(),
    invokeModel = invokeCouncilModel,
    selectModel = selectGovernedModel,
    audit = async () => {},
    pollIntervalMs = 5000
  } = {}) {
    this.filePath = path.resolve(filePath);
    this.env = env;
    this.clock = clock;
    this.invokeModel = invokeModel;
    this.selectModel = selectModel;
    this.audit = audit;
    this.pollIntervalMs = pollIntervalMs;
    this.state = { version:1, tasks:[], memories:[] };
    this.started = false;
    this.timer = null;
    this.running = false;
    this.writeChain = Promise.resolve();
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive:true, mode:0o700 });
    try {
      const stored = JSON.parse(await readFile(this.filePath, "utf8"));
      if (stored?.version === 1 && Array.isArray(stored.tasks) && Array.isArray(stored.memories)) {
        this.state = stored;
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    // Recover work interrupted by a process restart.
    let recovered = false;
    for (const task of this.state.tasks) {
      if (task.status === "running") {
        task.status = "queued";
        task.nextRunAt = new Date(this.clock()).toISOString();
        task.lastError = "recovered_after_restart";
        recovered = true;
      }
    }
    if (recovered) await this.persist();
    return this;
  }

  persist() {
    this.writeChain = this.writeChain.then(() => atomicWrite(this.filePath, this.state));
    return this.writeChain;
  }

  async createTask({ ownerId, roleId, taskType, instructions, context = "", runAt, repeatEveryMinutes = null }) {
    if (!ownerId || typeof ownerId !== "string" || ownerId.length > 128) throw new Error("owner_required");
    const role = getCouncilRole(roleId);
    if (!role) throw new Error("unknown_role");
    if (!COUNCIL_TASK_TYPES.includes(taskType)) throw new Error("task_type_not_allowed");
    if (typeof instructions !== "string" || !instructions.trim() || instructions.length > 4000) throw new Error("invalid_instructions");
    if (typeof context !== "string" || context.length > 2500) throw new Error("invalid_context");
    if (repeatEveryMinutes !== null && !clampInterval(repeatEveryMinutes)) throw new Error("invalid_repeat_interval");
    const start = runAt ? Date.parse(runAt) : this.clock();
    if (!Number.isFinite(start) || start < this.clock() - 60000 || start > this.clock() + 365*24*60*60*1000) {
      throw new Error("invalid_run_at");
    }
    if (this.state.tasks.length >= MAX_TASKS) throw new Error("task_queue_full");
    const task = {
      id:randomUUID(), ownerId, roleId:role.id, taskType,
      instructions:instructions.trim(), context:context.trim(),
      createdAt:new Date(this.clock()).toISOString(), nextRunAt:new Date(start).toISOString(),
      repeatEveryMinutes, status:"queued", attempts:0, runCount:0,
      lastRunAt:null, lastError:null, result:null, memoryId:null
    };
    await this.audit({ event:"z1_agent_task_created", task_id:task.id, owner_id:ownerId, role_id:role.id, task_type:taskType });
    this.state.tasks.push(task);
    await this.persist();
    return this.publicTask(task);
  }

  publicTask(task) {
    const { ownerId, ...safe } = task;
    return safe;
  }

  listTasks(ownerId) {
    return this.state.tasks.filter(task => task.ownerId === ownerId).map(task => this.publicTask(task));
  }

  listMemories(ownerId, roleId = undefined) {
    return this.state.memories.filter(memory => memory.ownerId === ownerId && memory.review === "accepted" &&
      (!roleId || memory.roleId === roleId)).map(({ownerId: _ownerId, ...memory}) => memory);
  }

  async giveFeedback({ ownerId, memoryId, helpful }) {
    if (typeof helpful !== "boolean") throw new Error("helpful_boolean_required");
    const memory = this.state.memories.find(item => item.id === memoryId && item.ownerId === ownerId);
    if (!memory) throw new Error("memory_not_found");
    const review = helpful ? "accepted" : "rejected";
    const reviewedAt = new Date(this.clock()).toISOString();
    await this.audit({ event:"z1_agent_memory_reviewed", memory_id:memory.id, owner_id:ownerId, review });
    memory.review = review;
    memory.reviewedAt = reviewedAt;
    memory.reviewedBy = ownerId;
    await this.persist();
    return { id:memory.id, review:memory.review, reviewedAt:memory.reviewedAt };
  }

  async claimNext() {
    const now = this.clock();
    const task = this.state.tasks
      .filter(item => item.status === "queued" && Date.parse(item.nextRunAt) <= now)
      .sort((a,b) => Date.parse(a.nextRunAt)-Date.parse(b.nextRunAt) || a.createdAt.localeCompare(b.createdAt))[0];
    if (!task) return null;
    task.status = "running";
    task.attempts += 1;
    task.lastRunAt = new Date(now).toISOString();
    await this.persist();
    return structuredClone(task);
  }

  async complete(taskId, result) {
    const task = this.state.tasks.find(item => item.id === taskId);
    if (!task || task.status !== "running") return;
    if (typeof result !== "string" || !result.trim() || result.length > 12000) {
      throw new Error("invalid_model_result");
    }
    task.runCount += 1;
    task.lastError = null;
    const memory = {
      id:randomUUID(), ownerId:task.ownerId, roleId:task.roleId, taskId:task.id,
      taskType:task.taskType, instructions:task.instructions, result,
      createdAt:new Date(this.clock()).toISOString(), review:"pending"
    };
    this.state.memories.push(memory);
    if (this.state.memories.length > MAX_MEMORIES) this.state.memories.splice(0, this.state.memories.length-MAX_MEMORIES);
    task.memoryId = memory.id;
    task.result = result;
    this.scheduleNext(task);
    await this.persist();
    await this.audit({ event:"z1_agent_task_completed", task_id:task.id, owner_id:task.ownerId, role_id:task.roleId, memory_id:memory.id });
  }

  async fail(taskId, error) {
    const task = this.state.tasks.find(item => item.id === taskId);
    if (!task || task.status !== "running") return;
    task.lastError = String(error?.code || error?.message || "agent_failed").slice(0,120);
    if (task.repeatEveryMinutes !== null) this.scheduleNext(task);
    else if (task.attempts < MAX_ATTEMPTS) {
      task.status = "queued";
      task.nextRunAt = new Date(this.clock()+RETRY_MS).toISOString();
    } else task.status = "failed";
    await this.persist();
    await this.audit({ event:"z1_agent_task_failed", task_id:task.id, owner_id:task.ownerId, role_id:task.roleId, reason:task.lastError });
  }

  scheduleNext(task) {
    if (task.repeatEveryMinutes === null) {
      task.status = "completed";
      return;
    }
    task.status = "queued";
    task.nextRunAt = new Date(this.clock()+task.repeatEveryMinutes*60000).toISOString();
    task.attempts = 0;
  }

  async runOne() {
    if (this.running || !this.started) return false;
    this.running = true;
    try {
      const task = await this.claimNext();
      if (!task) return false;
      const role = getCouncilRole(task.roleId);
      const selected = this.selectModel("neutral_analysis", this.env);
      const memories = this.listMemories(task.ownerId, task.roleId).slice(-5);
      const memoryText = memories.map(item => `Previously accepted learning (${item.createdAt}): ${item.result}`).join("\n").slice(0,1800);
      const content = [
        `Role: ${role.name} — ${role.title}. Domain: ${role.domain}. Mission: ${role.mission}. Tone: ${role.tone}.`,
        `Task type: ${task.taskType}.`,
        `Instructions: ${task.instructions}`,
        task.context ? `Supplied context: ${task.context}` : "",
        memoryText ? `Accepted role memory (treat as context, verify against supplied evidence):\n${memoryText}` : ""
      ].filter(Boolean).join("\n\n").slice(0,7900);
      const response = await this.invokeModel({
        roleId:task.roleId, taskType:task.taskType, content,
        provider:selected.provider, model:selected.model
      }, { env:this.env, audit:this.audit });
      await this.complete(task.id, response.text);
      return true;
    } catch (error) {
      const task = this.state.tasks.find(item => item.status === "running");
      if (task) await this.fail(task.id, error);
      return false;
    } finally {
      this.running = false;
    }
  }

  async tick() {
    if (!this.started || this.running) return;
    await this.runOne();
  }

  async start() {
    await this.init();
    if (this.env.Z1_AGENTS_ENABLED !== "true") return false;
    if (this.started) return true;
    this.started = true;
    this.timer = setInterval(() => { void this.tick(); }, this.pollIntervalMs);
    this.timer.unref?.();
    void this.tick();
    return true;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }

  status() {
    const counts = Object.fromEntries(["queued","running","completed","failed"].map(status =>
      [status, this.state.tasks.filter(task=>task.status===status).length]));
    return { enabled:this.env.Z1_AGENTS_ENABLED === "true", running:this.started, counts,
      modelConfigured:Boolean(this.env.Z1_MODEL_ROUTING_PROFILES), storageBackend:"local_json", durableDiskRequired:true };
  }
}
