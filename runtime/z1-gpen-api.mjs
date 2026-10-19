/** Authenticated local GPEN portrait-enhancement route. */
import { timingSafeEqual } from "node:crypto";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { enhancePortraitWithGpen, GPEN_MODELS } from "../core/gpen_portrait_adapter.mjs";
import { ModelPolicyError } from "../core/model_policy_gateway.mjs";

const ROUTE = "/api/z1/ai/portrait-enhancement";

function tokenAccepted(req) {
  const expected = process.env.Z1_MODEL_GATEWAY_TOKEN;
  const actual = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!expected || !actual) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function audit(event) {
  const outputPath = path.resolve(process.env.Z1_MODEL_AUDIT_PATH || "data/z1_model_audit.jsonl");
  await mkdir(path.dirname(outputPath), { recursive: true, mode: 0o700 });
  await appendFile(outputPath, JSON.stringify({ ...event, timestamp: new Date().toISOString() }) + "\n",
    { encoding: "utf8", mode: 0o600 });
}

export async function handleZ1GpenApi(req, res, url, { readJson, json }) {
  if (url.pathname !== ROUTE) return false;
  if (req.method !== "POST") {
    json(res, 405, { error: "method_not_allowed" });
    return true;
  }
  if (!process.env.Z1_MODEL_GATEWAY_TOKEN) {
    json(res, 503, { error: "gateway_not_configured" });
    return true;
  }
  if (!tokenAccepted(req)) {
    json(res, 401, { error: "unauthorized" });
    return true;
  }
  try {
    const body = await readJson(req, 6 * 1024 * 1024);
    if (typeof body.model !== "string" || !GPEN_MODELS.includes(body.model) ||
        typeof body.image !== "string") {
      throw new ModelPolicyError("invalid_gpen_parameters");
    }
    const result = await enhancePortraitWithGpen({
      model: body.model, image: body.image, trustedAction: "education"
    }, { audit });
    json(res, 200, result);
  } catch (error) {
    json(res, error instanceof ModelPolicyError ? error.status : 400, {
      error: error instanceof ModelPolicyError ? error.code : "invalid_request"
    });
  }
  return true;
}
