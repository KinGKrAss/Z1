import test from "node:test";
import assert from "node:assert/strict";
import { invokeCouncilModel, COUNCIL_SYSTEM_INSTRUCTION } from "../core/council_agent_gateway.mjs";

const env = {
  OPENAI_API_KEY:"test-secret", Z1_OPENAI_MODELS:"test-model",
  NVIDIA_API_KEY:"test-nvidia-secret", Z1_NVIDIA_MODELS:"nvidia/nemotron-3-nano-30b-a3b"
};

test("Council model call is allowlisted, audited before dispatch, and has no tools", async () => {
  const events = [];
  let requestBody;
  const result = await invokeCouncilModel({
    provider:"openai", model:"test-model", roleId:"zoe", taskType:"summary",
    content:"Summarize this supplied note."
  }, {
    env,
    audit:async event => events.push(event.outcome),
    fetchImpl:async (_url, init) => {
      requestBody = JSON.parse(init.body);
      return { ok:true, json:async () => ({ output_text:"A concise summary." }) };
    }
  });
  assert.deepEqual(events, ["approved","completed"]);
  assert.equal(requestBody.instructions, COUNCIL_SYSTEM_INSTRUCTION);
  assert.equal(requestBody.store, false);
  assert.equal("tools" in requestBody, false);
  assert.equal(result.text, "A concise summary.");
});

test("NVIDIA NIM can run an allowlisted Council role", async () => {
  const events = [];
  const result = await invokeCouncilModel({
    provider:"nvidia", model:"nvidia/nemotron-3-nano-30b-a3b", roleId:"zoe", taskType:"summary",
    content:"Summarize this supplied note."
  }, {
    env, audit:async event => events.push(event.outcome),
    fetchImpl:async (url, init) => {
      assert.equal(url,"https://integrate.api.nvidia.com/v1/chat/completions");
      assert.equal(init.headers.Authorization,"Bearer test-nvidia-secret");
      const body=JSON.parse(init.body);
      assert.equal(body.model,"nvidia/nemotron-3-nano-30b-a3b");
      assert.equal(body.messages[0].role,"system");
      assert.equal(body.messages[0].content,COUNCIL_SYSTEM_INSTRUCTION);
      return {ok:true,json:async()=>({choices:[{message:{content:"NVIDIA Council result."}}]})};
    }
  });
  assert.equal(result.text,"NVIDIA Council result.");
  assert.deepEqual(events,["approved","completed"]);
});

test("invalid roles are rejected before provider dispatch", async () => {
  let called = false;
  await assert.rejects(invokeCouncilModel({
    provider:"openai", model:"test-model", roleId:"z1-core", taskType:"summary", content:"x"
  }, { env, audit:async()=>{}, fetchImpl:async()=>{ called=true; } }), { code:"council_task_not_allowed" });
  assert.equal(called, false);
});
