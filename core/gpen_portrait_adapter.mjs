/**
 * Local GPEN portrait-enhancement adapter.
 * Processes one bounded inline image through a fixed ModelScope GPEN model.
 * The model is never caller-selected outside this fixed allowlist.
 */
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { ModelPolicyError } from "./model_policy_gateway.mjs";
import { evaluateHumanitarianAction } from "./humanitarian_policy.mjs";

export const GPEN_MODELS = Object.freeze([
  "damo/cv_gpen_image-portrait-enhancement-hires",
  "damo/cv_gpen_image-portrait-enhancement"
]);
const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const MIME_EXT = Object.freeze({ png: "png", jpeg: "jpg", webp: "webp" });

function decodeImageDataUrl(value) {
  if (typeof value !== "string") throw new ModelPolicyError("invalid_image");
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4 !== 0) throw new ModelPolicyError("invalid_image");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_INPUT_BYTES || bytes.toString("base64") !== match[2]) {
    throw new ModelPolicyError("invalid_image");
  }
  return { bytes, mime: match[1], ext: MIME_EXT[match[1]] };
}

function runWorker(input, { python = process.env.Z1_GPEN_PYTHON || "python3",
  script = path.resolve(process.cwd(), "runtime/gpen_portrait_worker.py"),
  spawnImpl = spawn, timeoutMs = 180000 } = {}) {
  return new Promise((resolve, reject) => {
    const workerEnv = {};
    for (const name of ["PATH", "HOME", "MODELSCOPE_CACHE", "CUDA_VISIBLE_DEVICES", "LD_LIBRARY_PATH"]) {
      if (typeof process.env[name] === "string") workerEnv[name] = process.env[name];
    }
    const child = spawnImpl(python, [script], { stdio: ["pipe", "pipe", "ignore"], env: workerEnv });
    let stdout = "";
    let settled = false;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new ModelPolicyError("gpen_timeout", 504));
    }, timeoutMs);
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      stdout += chunk;
      if (Buffer.byteLength(stdout) > 12 * 1024 * 1024) {
        child.kill("SIGKILL");
        finish(new ModelPolicyError("gpen_output_too_large", 502));
      }
    });
    child.on("error", () => finish(new ModelPolicyError("gpen_worker_unavailable", 503)));
    child.on("close", code => {
      if (code !== 0) return finish(new ModelPolicyError("gpen_worker_failed", 502));
      try {
        const result = JSON.parse(stdout);
        if (result?.error) return finish(new ModelPolicyError("gpen_worker_failed", 502));
        const data = result?.image;
        const match = typeof data === "string" &&
          /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
        if (!match || match[1].length % 4 !== 0) throw new Error("invalid worker image");
        const bytes = Buffer.from(match[1], "base64");
        if (!bytes.length || bytes.length > MAX_OUTPUT_BYTES || bytes.toString("base64") !== match[1]) {
          throw new Error("invalid worker image");
        }
        finish(null, data);
      } catch {
        finish(new ModelPolicyError("gpen_worker_failed", 502));
      }
    });
    child.stdin.end(JSON.stringify({ model: input.model, image: input.bytes.toString("base64"),
      extension: input.ext, device: process.env.Z1_GPEN_DEVICE || "cuda:0" }) + "\n");
  });
}

export async function enhancePortraitWithGpen(
  { model, image, trustedAction },
  { env = process.env, audit, worker = runWorker } = {}
) {
  if (typeof audit !== "function") throw new ModelPolicyError("audit_required", 503);
  const decision = evaluateHumanitarianAction(trustedAction);
  const imageInput = decodeImageDataUrl(image);
  const configured = (env.Z1_MODELSCOPE_PORTRAIT_MODELS || "").split(",").map(value => value.trim()).filter(Boolean);
  if (!GPEN_MODELS.includes(model) || !configured.includes(model)) {
    throw new ModelPolicyError("model_not_allowlisted", 403);
  }
  if (env.Z1_GPEN_ENABLED !== "true") throw new ModelPolicyError("gpen_not_configured", 503);
  if (!decision.allowed) throw new ModelPolicyError(decision.reason, 403);
  const stamp = {
    event: "z1_gpen_portrait_policy",
    policy: "Z1-PEACE-001",
    provider: "modelscope-gpen",
    model,
    action: trustedAction,
    content_sha256: createHash("sha256").update(imageInput.bytes).digest("hex")
  };
  await audit({ ...stamp, outcome: "approved" });
  try {
    const result = await worker({ model, ...imageInput });
    await audit({ ...stamp, outcome: "completed" });
    return { provider: "modelscope-gpen", model, policy: "Z1-PEACE-001", image: result };
  } catch (error) {
    await audit({ ...stamp, outcome: "error", reason: error.code || "gpen_worker_failed" });
    if (error instanceof ModelPolicyError) throw error;
    throw new ModelPolicyError("gpen_worker_failed", 502);
  }
}
