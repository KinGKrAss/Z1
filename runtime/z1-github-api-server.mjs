import http from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { handleZ1GitHubApi } from "./z1-github-api.mjs";

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

export function createZ1GitHubApiServer({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { status: "online", service: "z1-github-tools" });
    }
    const handled = await handleZ1GitHubApi(req, res, url, { json, env, fetchImpl });
    if (!handled) json(res, 404, { error: "not_found" });
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT ?? 8080);
  const server = createZ1GitHubApiServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`[Z1 GitHub tools] listening on 0.0.0.0:${port}`);
  });
}
