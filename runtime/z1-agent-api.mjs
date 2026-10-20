/** Authenticated routes for durable autonomous Council tasks. */
import { timingSafeEqual } from "node:crypto";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { AutonomousCouncilRuntime } from "./autonomous-council-runtime.mjs";
import { CollectiveMemoryStore } from "./collective-memory-runtime.mjs";
import { COUNCIL_33, getCouncilRole } from "../core/council_33.mjs";

let runtime;
let memoryStore;
async function getRuntime() {
  if (!runtime) {
    const auditPath = path.resolve(process.env.Z1_AGENT_AUDIT_PATH || "data/z1_agent_audit.jsonl");
    const audit = async event => {
      await mkdir(path.dirname(auditPath), { recursive:true, mode:0o700 });
      await appendFile(auditPath, JSON.stringify({ ...event, timestamp:new Date().toISOString() })+"\n",
        { encoding:"utf8", mode:0o600 });
    };
    memoryStore = await new CollectiveMemoryStore({ audit }).init();
    runtime = await new AutonomousCouncilRuntime({ audit, memoryStore }).init();
  }
  return runtime;
}

function ownerId() {
  const configured = process.env.Z1_AGENT_OWNER_ID?.trim();
  return configured || null;
}
function tokenAccepted(req) {
  const expected = process.env.Z1_MODEL_GATEWAY_TOKEN;
  const actual = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!expected || !actual) return false;
  const a = Buffer.from(expected), b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a,b);
}
function respond(res, json, status, body) {
  json(res,status,body);
  return true;
}
function fail(res, json, status, code) {
  return respond(res,json,status,{ error:code });
}

export async function startAgentRuntime() {
  if (!ownerId()) return false;
  const instance = await getRuntime();
  return instance.start();
}

export async function handleZ1AgentApi(req, res, url, { readJson, json }) {
  const pathname = url.pathname;
  const isAgentRoute = pathname.startsWith("/api/z1/agents");
  const isMemoryRoute = pathname.startsWith("/api/z1/memory");
  const isGoddessRoute = pathname === "/api/goddesses" || pathname === "/api/goddesses/execute";
  if (!isAgentRoute && !isMemoryRoute && !isGoddessRoute) return false;
  if (!process.env.Z1_MODEL_GATEWAY_TOKEN) return fail(res,json,503,"gateway_not_configured");
  if (!tokenAccepted(req)) return fail(res,json,401,"unauthorized");
  const configuredOwner = ownerId();
  if (!configuredOwner) return fail(res,json,503,"owner_not_configured");
  const instance = await getRuntime();

  if (pathname === "/api/goddesses") {
    if (req.method !== "GET") return fail(res,json,405,"method_not_allowed");
    const tasks = instance.listTasks(configuredOwner);
    const worker = instance.status();
    const registry = COUNCIL_33.map(role => {
      const roleTasks = tasks.filter(task => task.roleId === role.id);
      const latestTask = roleTasks.at(-1);
      const status = roleTasks.some(task => task.status === "running") && worker.running
        ? "active"
        : latestTask?.status === "failed" ? "alert" : "standby";
      return {
        id:role.position, roleId:role.id, name:role.name, title:role.title,
        domain:role.domain, mission:role.mission, character:role.tone, status
      };
    });
    return respond(res,json,200,{
      totalGoddesses:registry.length,
      activeUnits:registry.filter(role => role.status === "active").length,
      worker, registry
    });
  }

  if (pathname === "/api/goddesses/execute") {
    if (req.method !== "POST") return fail(res,json,405,"method_not_allowed");
    try {
      const body = await readJson(req);
      const numericId = Number(body.roleId ?? body.id);
      const byPosition = Number.isInteger(numericId) && numericId >= 1
        ? COUNCIL_33.find(role => role.position === numericId) : null;
      const requestedDomain = typeof body.domain === "string"
        ? body.domain.normalize("NFKC").trim().toLocaleLowerCase("de-DE") : "";
      const byDomain = COUNCIL_33.find(role =>
        role.domain.normalize("NFKC").toLocaleLowerCase("de-DE") === requestedDomain);
      const role = getCouncilRole(body.roleId) || byPosition || byDomain;
      if (!role) return fail(res,json,400,"unknown_role_or_domain");
      if (typeof body.payload !== "string" || !body.payload.trim()) {
        return fail(res,json,400,"payload_required");
      }
      const task = await instance.createTask({
        ownerId:configuredOwner, roleId:role.id, taskType:body.taskType || "analysis",
        instructions:body.payload, context:typeof body.context === "string" ? body.context : ""
      });
      return respond(res,json,202,{
        success:true, task,
        note:"Aufgabe ist eingereiht. Die Ausführung erfolgt nur mit aktiviertem Z1-Worker und freigegebenem Modell."
      });
    } catch (error) {
      const status = ["task_queue_full","invalid_run_at"].includes(error.message) ? 409 : 400;
      return fail(res,json,status,error.message || "invalid_request");
    }
  }

  if (pathname === "/api/z1/memory/items") {
    if (req.method === "GET") return respond(res,json,200,{items:memoryStore.list(configuredOwner)});
    if (req.method !== "POST") return fail(res,json,405,"method_not_allowed");
    try {
      const body = await readJson(req);
      const item = await memoryStore.add({ownerId:configuredOwner,title:body.title,content:body.content,sourceReference:body.sourceReference});
      return respond(res,json,201,{item});
    } catch (error) {
      const status = error.message === "memory_store_full" ? 409 : 400;
      return fail(res,json,status,error.message || "invalid_request");
    }
  }
  if (pathname === "/api/z1/memory/search") {
    if (req.method !== "GET") return fail(res,json,405,"method_not_allowed");
    try {
      const rawLimit = url.searchParams.get("limit");
      const results = memoryStore.search({ownerId:configuredOwner,query:url.searchParams.get("q") || "",limit:rawLimit === null ? 5 : Number(rawLimit)});
      return respond(res,json,200,{results});
    } catch (error) {
      return fail(res,json,400,error.message || "invalid_request");
    }
  }

  if (pathname === "/api/z1/agents/status") {
    if (req.method !== "GET") return fail(res,json,405,"method_not_allowed");
    return respond(res,json,200,instance.status());
  }
  if (pathname === "/api/z1/agents/tasks") {
    if (req.method === "GET") return respond(res,json,200,{tasks:instance.listTasks(configuredOwner)});
    if (req.method !== "POST") return fail(res,json,405,"method_not_allowed");
    try {
      const body = await readJson(req);
      const task = await instance.createTask({
        ownerId:configuredOwner, roleId:body.roleId, taskType:body.taskType,
        instructions:body.instructions, context:body.context,
        runAt:body.runAt, repeatEveryMinutes:body.repeatEveryMinutes ?? null
      });
      return respond(res,json,202,{task, note:"Task is queued. The worker runs when Z1_AGENTS_ENABLED=true and a governed model is configured."});
    } catch (error) {
      const status = ["task_queue_full","invalid_run_at"].includes(error.message) ? 409 : 400;
      return fail(res,json,status,error.message || "invalid_request");
    }
  }
  if (pathname === "/api/z1/agents/memories") {
    if (req.method !== "GET") return fail(res,json,405,"method_not_allowed");
    return respond(res,json,200,{memories:instance.listMemories(configuredOwner,url.searchParams.get("roleId") || undefined)});
  }
  const feedbackMatch = pathname.match(/^\/api\/z1\/agents\/memories\/([a-f0-9-]+)\/feedback$/i);
  if (feedbackMatch) {
    if (req.method !== "POST") return fail(res,json,405,"method_not_allowed");
    try {
      const body = await readJson(req);
      const result = await instance.giveFeedback({ownerId:configuredOwner,memoryId:feedbackMatch[1],helpful:body.helpful});
      return respond(res,json,200,result);
    } catch (error) {
      return fail(res,json,error.message === "memory_not_found" ? 404 : 400,error.message || "invalid_request");
    }
  }
  return fail(res,json,404,"not_found");
}
