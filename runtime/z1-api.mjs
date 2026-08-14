import http from "node:http";
import { spawn } from "node:child_process";

const port = Number(process.env.Z1_API_PORT ?? 3001);
const host = process.env.Z1_API_HOST ?? "127.0.0.1";

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function coreStatus() {
  return new Promise((resolve) => {
    const child = spawn("python", ["-m", "core.system_z1_core"], {
      env: { ...process.env, Z1_AUDIT_PATH: process.env.Z1_AUDIT_PATH ?? "data/z1_audit.jsonl" },
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.on("close", () => {
      try { resolve(JSON.parse(output)); }
      catch { resolve({ name: "Z1 Core", status: "unknown", runtime: "python" }); }
    });
    child.on("error", () => resolve({ name: "Z1 Core", status: "offline" }));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { status: "online", service: "z1-api", runtime: "node", node: process.version });
  }
  if (req.method === "GET" && url.pathname === "/api/z1/status") {
    return json(res, 200, await coreStatus());
  }
  if (req.method === "GET" && url.pathname === "/api/z1/modules") {
    return json(res, 200, { modules: ["zoe", "gaia", "fortuna", "electra", "diplomatie", "ppt"] });
  }
  return json(res, 404, { error: "not_found" });
});

server.listen(port, host, () => {
  console.log(`[Z1 API] http://${host}:${port}`);
});
