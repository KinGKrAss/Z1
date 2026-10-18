/** Authenticated routes for durable autonomous Council tasks. */
import { timingSafeEqual } from "node:crypto";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { AutonomousCouncilRuntime } from "./autonomous-council-runtime.mjs";

let runtime;
async function getRuntime() {
  if (!runtime) {
    const auditPath = path.resolve(process.env.Z1_AGENT_AUDIT_PATH || "data/z1_agent_audit.jsonl");
    const audit = async event => {
      await mkdir(path.dirname(auditPath), { recursive:true, mode:0o700 });
      await appendFile(auditPath, JSON.stringify({ ...event, timestamp:new Date().toISOString() })+"\n",
        { encoding:"utf8", mode:0o600 });
    };
    runtime = await new AutonomousCouncilRuntime({ audit }).init();
  }
  return runtime;
}

function ownerId() {
  return process.env.Z1_AGENT_OWNER_ID || "default-owner";
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
  const instance = await getRuntime();
  return instance.start();
}

export async function handleZ1AgentApi(req, res, url, { readJson, json }) {
  const pathname = url.pathname;
  if (!pathname.startsWith("/api/z1/agents")) return false;
  if (!process.env.Z1_MODEL_GATEWAY_TOKEN) return fail(res,json,503,"gateway_not_configured");
  if (!tokenAccepted(req)) return fail(res,json,401,"unauthorized");
  const instance = await getRuntime();

  if (pathname === "/api/z1/agents/status") {
    if (req.method !== "GET") return fail(res,json,405,"method_not_allowed");
    return respond(res,json,200,instance.status());
  }
  if (pathname === "/api/z1/agents/tasks") {
    if (req.method === "GET") return respond(res,json,200,{tasks:instance.listTasks(ownerId())});
    if (req.method !== "POST") return fail(res,json,405,"method_not_allowed");
    try {
      const body = await readJson(req);
      const task = await instance.createTask({
        ownerId:ownerId(), roleId:body.roleId, taskType:body.taskType,
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
    return respond(res,json,200,{memories:instance.listMemories(ownerId(),url.searchParams.get("roleId") || undefined)});
  }
  const feedbackMatch = pathname.match(/^\/api\/z1\/agents\/memories\/([a-f0-9-]+)\/feedback$/i);
  if (feedbackMatch) {
    if (req.method !== "POST") return fail(res,json,405,"method_not_allowed");
    try {
      const body = await readJson(req);
      const result = await instance.giveFeedback({ownerId:ownerId(),memoryId:feedbackMatch[1],helpful:body.helpful});
      return respond(res,json,200,result);
    } catch (error) {
      return fail(res,json,error.message === "memory_not_found" ? 404 : 400,error.message || "invalid_request");
    }
  }
  return fail(res,json,404,"not_found");
}
