import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { COUNCIL_33, Z1_CORE_ROLE } from "../core/council_33.mjs";
import { AutonomousCouncilRuntime } from "../runtime/autonomous-council-runtime.mjs";

test("canonical Council has 33 roles and keeps Z1-Core separate", () => {
  assert.equal(COUNCIL_33.length, 33);
  assert.equal(COUNCIL_33[12].id, "zephyra");
  assert.equal(COUNCIL_33[12].position, 13);
  assert.equal(Z1_CORE_ROLE.separateFromCouncil, true);
});

test("queued tasks persist, run autonomously, and learn only from accepted feedback", async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "z1-council-"));
  t.after(() => rm(dir, { recursive:true, force:true }));
  const filePath = path.join(dir, "agents.json");
  const env = { Z1_AGENTS_ENABLED:"true" };
  const prompts = [];
  const invokeModel = async request => {
    prompts.push(request.content);
    return { text: prompts.length === 1 ? "Verified summary one." : "Verified summary two." };
  };
  const config = { filePath, env, invokeModel, selectModel:() => ({provider:"test",model:"test-model"}) };
  const runtime = await new AutonomousCouncilRuntime(config).init();
  await runtime.createTask({
    ownerId:"owner-a", roleId:"zoe", taskType:"summary",
    instructions:"Summarize the supplied notes.", context:"Note: a project started.",
  });
  runtime.started = true;
  assert.equal(await runtime.runOne(), true);
  assert.equal(runtime.listTasks("owner-a")[0].status, "completed");
  assert.equal(runtime.listMemories("owner-a").length, 1);\n  assert.equal(runtime.listMemories("owner-a")[0].review, "provisional");

  const pending = JSON.parse(await readFile(filePath, "utf8"));
  const memoryId = pending.memories[0].id;
  assert.equal(pending.memories[0].review, "pending");
  await runtime.giveFeedback({ ownerId:"owner-a", memoryId, helpful:true });

  const restarted = await new AutonomousCouncilRuntime(config).init();
  assert.equal(restarted.listMemories("owner-a").length, 1);
  await restarted.createTask({
    ownerId:"owner-a", roleId:"zoe", taskType:"analysis",
    instructions:"Analyze the follow-up.", context:"New note.",
  });
  restarted.started = true;
  assert.equal(await restarted.runOne(), true);
  assert.match(prompts[1], /Role memory \\(accepted/);
  assert.match(prompts[1], /Verified summary one/);
  assert.equal(restarted.listTasks("owner-a").length, 2);
});

test("worker stays off unless explicitly enabled", async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "z1-council-off-"));
  t.after(() => rm(dir, { recursive:true, force:true }));
  const runtime = new AutonomousCouncilRuntime({
    filePath:path.join(dir, "agents.json"), env:{}, pollIntervalMs:10,
  });
  assert.equal(await runtime.start(), false);
  assert.equal(runtime.status().running, false);
});
