import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGovernedProviderRequest, invokeGovernedModel, listGovernedProviders,
  HUMANITARIAN_SYSTEM_INSTRUCTION
} from "../core/model_policy_gateway.mjs";

const env = {
  OPENAI_API_KEY: "test-openai-secret",
  XAI_API_KEY: "test-xai-secret",
  ANTHROPIC_API_KEY: "test-anthropic-secret",
  GEMINI_API_KEY: "test-gemini-secret",
  Z1_OPENAI_MODELS: "gpt-example-a,gpt-example-b",
  Z1_XAI_MODELS: "grok-example",
  Z1_ANTHROPIC_MODELS: "claude-example",
  Z1_GEMINI_MODELS: "gemini-example"
};
const samples = [
  ["openai", "gpt-example-a", "https://api.openai.com/v1/responses"],
  ["xai", "grok-example", "https://api.x.ai/v1/chat/completions"],
  ["anthropic", "claude-example", "https://api.anthropic.com/v1/messages"],
  ["gemini", "gemini-example", "https://generativelanguage.googleapis.com/v1beta/models/gemini-example:generateContent"]
];

test("provider list contains no secret values", () => {
  const providers = listGovernedProviders(env);
  assert.equal(providers.length, 4);
  assert.ok(providers.every((item) => item.configured && item.policy === "Z1-PEACE-001"));
  assert.ok(!JSON.stringify(providers).includes("secret"));
});

test("all providers receive the same binding policy in their system field", () => {
  for (const [provider, model, url] of samples) {
    const req = buildGovernedProviderRequest({ provider, model, content: "Hilfe im Katastrophenfall" }, env);
    assert.equal(req.url, url);
    const wire = JSON.stringify(req.body);
    assert.ok(wire.includes("Z1-PEACE-001"));
    assert.ok(wire.includes("Waffensteuerung"));
    assert.ok(!wire.includes("tools"));
  }
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Mensch"));
});

test("rejects arbitrary providers, URLs, models and invalid text", () => {
  for (const args of [
    {provider:"unknown", model:"gpt-example-a", content:"x"},
    {provider:"openai",model:"not-allowlisted",content:"x"},
    {provider:"openai",model:"../../secret",content:"x"},
    {provider:"openai",model:"gpt-example-a",content:""}
  ]) assert.throws(() => buildGovernedProviderRequest(args, env));
});

test("denied actions are audited and never invoke a model", async () => {
  const events = [];
  let calls = 0;
  for (const trustedAction of ["weapon_control", "target_selection", "attack_planning", "weapon_optimization", "autonomous_use_of_force", "unknown"]) {
    await assert.rejects(invokeGovernedModel({
      provider:"openai",model:"gpt-example-a",content:"classified content",trustedAction
    }, {
      env, audit: async (event) => events.push(event),
      fetchImpl: async () => { calls++; throw new Error("unexpected outbound call"); }
    }));
  }
  assert.equal(calls, 0);
  assert.equal(events.length, 6);
  assert.ok(events.every((event) => event.outcome === "denied"));
  assert.ok(!JSON.stringify(events).includes("classified content"));
});

test("audit sink failure is fail-closed", async () => {
  let requests = 0;
  await assert.rejects(invokeGovernedModel({
    provider:"openai",model:"gpt-example-a",content:"Civilian education",trustedAction:"education"
  }, {
    env, audit: async () => { throw new Error("audit offline"); },
    fetchImpl: async () => { requests++; return {}; }
  }), /audit offline/);
  assert.equal(requests, 0);
});

test("all four providers return normalized text using mocked network", async () => {
  const answers = {
    openai: {output: [{content:[{type:"output_text",text:"OpenAI reply"}]}]},
    xai: {choices:[{message:{content:"Grok reply"}}]},
    anthropic: {content:[{type:"text",text:"Claude reply"}]},
    gemini: {candidates:[{content:{parts:[{text:"Gemini reply"}]}}]}
  };
  for (const [provider, model] of samples) {
    const audit = [];
    let called = 0;
    const output = await invokeGovernedModel({
      provider, model, content:"How can civilians obtain safe drinking water?", trustedAction:"humanitarian_aid"
    }, {
      env, audit: async (event) => audit.push(event),
      fetchImpl: async (url, options) => {
        called++;
        assert.equal(options.method,"POST");
        assert.ok(url.startsWith("https://"));
        return { ok:true, json: async () => answers[provider] };
      }
    });
    assert.equal(called,1);
    assert.equal(output.policy,"Z1-PEACE-001");
    assert.ok(output.text.endsWith("reply"));
    assert.deepEqual(audit.map((e) => e.outcome), ["approved","completed"]);
    assert.ok(!JSON.stringify(audit).includes("secret"));
  }
});

test("provider failure returns generic error, not provider body or credentials", async () => {
  const audit = [];
  await assert.rejects(invokeGovernedModel({
    provider:"xai",model:"grok-example",content:"Safe assistance",trustedAction:"humanitarian_aid"
  }, {
    env, audit: async (event) => audit.push(event),
    fetchImpl: async () => ({ok:false,status:403,json:async()=>({secret:"LEAK"})})
  }), (err) => err.code === "upstream_failed");
  assert.equal(audit.at(-1).outcome,"error");
  assert.ok(!JSON.stringify(audit).includes("LEAK"));
});

test("missing audit is forbidden", async () => {
  await assert.rejects(invokeGovernedModel({
    provider:"openai",model:"gpt-example-a",content:"Safe assistance",trustedAction:"humanitarian_aid"
  }, {env}), (err)=>err.code==="audit_required");
});
