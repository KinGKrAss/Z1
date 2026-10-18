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
  DEEPSEEK_API_KEY: "test-deepseek-secret",
  DASHSCOPE_API_KEY: "test-qwen-secret",
  MOONSHOT_API_KEY: "test-kimi-secret",
  ZAI_API_KEY: "test-zhipu-secret",
  MISTRAL_API_KEY: "test-mistral-secret",
  COHERE_API_KEY: "test-cohere-secret",
  MODELSCOPE_API_KEY: "test-modelscope-secret",
  Z1_OPENAI_MODELS: "gpt-example-a,gpt-example-b",
  Z1_XAI_MODELS: "grok-example",
  Z1_ANTHROPIC_MODELS: "claude-example",
  Z1_GEMINI_MODELS: "gemini-example",
  Z1_DEEPSEEK_MODELS: "deepseek-example",
  Z1_QWEN_MODELS: "qwen-example",
  Z1_KIMI_MODELS: "kimi-example",
  Z1_ZHIPU_MODELS: "glm-example",
  Z1_MISTRAL_MODELS: "mistral-example",
  Z1_COHERE_MODELS: "cohere-example",
  Z1_MODELSCOPE_MODELS: "Qwen/Qwen3-8B-Instruct"
};
const samples = [
  ["openai", "gpt-example-a", "https://api.openai.com/v1/responses"],
  ["xai", "grok-example", "https://api.x.ai/v1/chat/completions"],
  ["anthropic", "claude-example", "https://api.anthropic.com/v1/messages"],
  ["gemini", "gemini-example", "https://generativelanguage.googleapis.com/v1beta/models/gemini-example:generateContent"],
  ["deepseek", "deepseek-example", "https://api.deepseek.com/chat/completions"],
  ["qwen", "qwen-example", "https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions"],
  ["kimi", "kimi-example", "https://api.moonshot.ai/v1/chat/completions"],
  ["zhipu", "glm-example", "https://api.z.ai/api/paas/v4/chat/completions"],
  ["mistral", "mistral-example", "https://api.mistral.ai/v1/chat/completions"],
  ["cohere", "cohere-example", "https://api.cohere.com/v2/chat"],
  ["modelscope", "Qwen/Qwen3-8B-Instruct", "https://api-inference.modelscope.cn/v1/chat/completions"]
];

test("provider list contains no secret values", () => {
  const providers = listGovernedProviders(env);
  assert.equal(providers.length, 11);
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
    assert.ok(wire.includes("Wahrheit vor Zustimmung"));
    assert.ok(wire.includes("Menschliche Entscheidungshoheit"));
    assert.ok(wire.includes("Z1-Core"));
    assert.ok(!wire.includes("tools"));
  }
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Mensch"));
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Wahrheit vor Zustimmung"));
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Architektur vor Aktion"));
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Menschliche Entscheidungshoheit"));
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Z1-Core"));
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Council-of-33-Rollen"));
  assert.ok(HUMANITARIAN_SYSTEM_INSTRUCTION.includes("Produktivbetrieb"));
});

test("rejects arbitrary providers, URLs, models and invalid text", () => {
  for (const args of [
    {provider:"constructor", model:"gpt-example-a", content:"x"},
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

test("all ten providers return normalized text using mocked network", async () => {
  const answers = {
    openai: {output: [{content:[{type:"output_text",text:"OpenAI reply"}]}]},
    xai: {choices:[{message:{content:"Grok reply"}}]},
    anthropic: {content:[{type:"text",text:"Claude reply"}]},
    gemini: {candidates:[{content:{parts:[{text:"Gemini reply"}]}}]},
    deepseek: {choices:[{message:{content:"DeepSeek reply"}}]},
    qwen: {choices:[{message:{content:"Qwen reply"}}]},
    kimi: {choices:[{message:{content:"Kimi reply"}}]},
    zhipu: {choices:[{message:{content:"GLM reply"}}]},
    mistral: {choices:[{message:{content:"Mistral reply"}}]},
    cohere: {message:{content:[{type:"text",text:"Cohere reply"}]}},
    modelscope: {choices:[{message:{content:"ModelScope reply"}}]}
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

test("unconfigured and unknown model IDs remain blocked for new providers", () => {
  for (const [provider, model] of samples) {
    assert.throws(() => buildGovernedProviderRequest({provider,model:"arbitrary-unknown",content:"help"}, env),
      (err) => err.code === "model_not_allowlisted");
    const withoutKeys = {...env};
    const keyNames = {
      openai:"OPENAI_API_KEY", xai:"XAI_API_KEY", anthropic:"ANTHROPIC_API_KEY",
      gemini:"GEMINI_API_KEY", deepseek:"DEEPSEEK_API_KEY", qwen:"DASHSCOPE_API_KEY",
      kimi:"MOONSHOT_API_KEY", zhipu:"ZAI_API_KEY", mistral:"MISTRAL_API_KEY",cohere:"COHERE_API_KEY", modelscope:"MODELSCOPE_API_KEY"
    };
    delete withoutKeys[keyNames[provider]];
    assert.throws(() => buildGovernedProviderRequest({provider,model,content:"help"}, withoutKeys),
      (err) => err.code === "provider_not_configured");
  }
});
