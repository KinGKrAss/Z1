import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";

const port = Number(process.env.Z1_API_PORT ?? 3001);
const host = process.env.Z1_API_HOST ?? "127.0.0.1";
const documentRoot = path.resolve(process.env.Z1_DOCUMENT_ROOT ?? path.join(process.cwd(), "data", "documents"));

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1024 * 1024) {
        req.destroy();
        reject(new Error("request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function coreStatus() {
  return new Promise((resolve) => {
    const child = spawn("python", ["-m", "modules.bootstrap"], {
      env: { ...process.env, Z1_AUDIT_PATH: process.env.Z1_AUDIT_PATH ?? "data/z1_audit.jsonl" },
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.on("close", () => {
      try {
        const parsed = JSON.parse(output);
        resolve({ ...parsed, runtime: "node + python" });
      } catch {
        resolve({ name: "Z1 Core", status: "unknown", runtime: "node + python" });
      }
    });
    child.on("error", () => resolve({ name: "Z1 Core", status: "offline", runtime: "node + python" }));
  });
}

function resolveDocumentPath(relativePath) {
  const resolved = path.resolve(documentRoot, relativePath);
  if (resolved !== documentRoot && !resolved.startsWith(`${documentRoot}${path.sep}`)) {
    throw new Error("document path outside configured document root");
  }
  return resolved;
}

function validateAssetDocument(relativePath, expectedAssetId) {
  return new Promise((resolve) => {
    let target;
    try {
      target = resolveDocumentPath(relativePath);
    } catch (error) {
      resolve({ validation_status: "INVALID_ASSET_DOCUMENT", error: String(error) });
      return;
    }

    const args = ["-m", "modules.gitta_asset_validation", target];
    if (expectedAssetId) args.push("--expected-asset-id", expectedAssetId);

    const child = spawn("python", args, { env: process.env });
    let output = "";
    let errorOutput = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { errorOutput += chunk.toString(); });
    child.on("close", (code) => {
      try {
        resolve({ ...JSON.parse(output), exit_code: code });
      } catch {
        resolve({
          validation_status: "EXTRACTION_FAILED",
          exit_code: code,
          error: errorOutput || "asset validator returned invalid JSON",
        });
      }
    });
    child.on("error", (error) => resolve({ validation_status: "EXTRACTION_FAILED", error: String(error) }));
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
    return json(res, 200, { modules: ["zoe", "gaia", "fortuna", "electra", "diplomatie", "ppt", "gitta-asset-validation"] });
  }
  if (req.method === "POST" && url.pathname === "/api/z1/asset-validation") {
    try {
      const body = await readJson(req);
      if (typeof body.path !== "string" || !body.path.trim()) {
        return json(res, 400, { error: "path_required" });
      }
      const result = await validateAssetDocument(body.path, typeof body.expectedAssetId === "string" ? body.expectedAssetId : undefined);
      return json(res, result.validation_status === "EXTRACTION_FAILED" ? 422 : 200, result);
    } catch (error) {
      return json(res, 400, { error: "invalid_request", detail: String(error) });
    }
  }
  return json(res, 404, { error: "not_found" });
});

server.listen(port, host, () => {
  console.log(`[Z1 API] http://${host}:${port}`);
});
