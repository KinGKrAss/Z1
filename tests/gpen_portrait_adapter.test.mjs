import test from "node:test";
import assert from "node:assert/strict";
import { enhancePortraitWithGpen } from "../core/gpen_portrait_adapter.mjs";

const model = "damo/cv_gpen_image-portrait-enhancement-hires";
const image = "data:image/png;base64,aGVsbG8=";
const env = {
  Z1_GPEN_ENABLED: "true",
  Z1_MODELSCOPE_PORTRAIT_MODELS: model
};

test("GPEN processes only configured images and audits hashes without image bytes", async () => {
  const events = [];
  let calls = 0;
  const result = await enhancePortraitWithGpen({ model, image, trustedAction: "education" }, {
    env,
    audit: async event => events.push(event),
    worker: async input => {
      calls++;
      assert.equal(input.model, model);
      assert.equal(input.mime, "png");
      assert.equal(input.bytes.toString(), "hello");
      return "data:image/png;base64,aGVsbG8=";
    }
  });
  assert.equal(calls, 1);
  assert.equal(result.provider, "modelscope-gpen");
  assert.equal(result.image, "data:image/png;base64,aGVsbG8=");
  assert.deepEqual(events.map(event => event.outcome), ["approved", "completed"]);
  assert.ok(events.every(event => !JSON.stringify(event).includes("hello")));
});

test("GPEN is disabled until explicitly configured and rejects unapproved model ids", async () => {
  let calls = 0;
  const audit = async () => {};
  await assert.rejects(enhancePortraitWithGpen({ model, image, trustedAction: "education" }, {
    env: { ...env, Z1_GPEN_ENABLED: "false" }, audit,
    worker: async () => { calls++; }
  }), { code: "gpen_not_configured" });
  await assert.rejects(enhancePortraitWithGpen({ model: "attacker/model", image, trustedAction: "education" }, {
    env, audit, worker: async () => { calls++; }
  }), { code: "model_not_allowlisted" });
  assert.equal(calls, 0);
});

test("GPEN rejects remote URLs, malformed data URLs, and oversized images", async () => {
  for (const invalid of [
    "https://example.com/face.png",
    "data:image/svg+xml;base64,aGVsbG8=",
    "data:image/png;base64,aGVsbG8=\n",
    "data:image/png;base64," + Buffer.alloc(4 * 1024 * 1024 + 3).toString("base64")
  ]) {
    await assert.rejects(enhancePortraitWithGpen({ model, image: invalid, trustedAction: "education" }, {
      env, audit: async () => {}, worker: async () => "data:image/png;base64,aGVsbG8="
    }), { code: "invalid_image" });
  }
});
