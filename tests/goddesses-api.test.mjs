import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("authenticated goddess compatibility API reports registry and queues bounded tasks", async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(),"z1-goddess-api-"));
  t.after(async () => {
    for (const key of ["Z1_MODEL_GATEWAY_TOKEN","Z1_AGENT_OWNER_ID","Z1_AGENT_STORE_PATH","Z1_COLLECTIVE_MEMORY_PATH","Z1_AGENT_AUDIT_PATH"]) delete process.env[key];
    await rm(dir,{recursive:true,force:true});
  });
  process.env.Z1_MODEL_GATEWAY_TOKEN = "test-token";
  process.env.Z1_AGENT_OWNER_ID = "test-owner";
  process.env.Z1_AGENT_STORE_PATH = path.join(dir,"agents.json");
  process.env.Z1_COLLECTIVE_MEMORY_PATH = path.join(dir,"memory.json");
  process.env.Z1_AGENT_AUDIT_PATH = path.join(dir,"audit.jsonl");

  const { handleZ1AgentApi } = await import("../runtime/z1-agent-api.mjs");
  const call = async (method,route,body={}) => {
    let response;
    const req = {method,headers:{authorization:"Bearer test-token"}};
    const handled = await handleZ1AgentApi(req,{},new URL(route,"http://localhost"),{
      readJson:async()=>body,
      json:(_res,status,payload)=>{response={status,payload};}
    });
    assert.equal(handled,true);
    return response;
  };

  const listing = await call("GET","/api/goddesses");
  assert.equal(listing.status,200);
  assert.equal(listing.payload.totalGoddesses,33);
  assert.equal(listing.payload.activeUnits,0);
  assert.ok(listing.payload.registry.every(role=>role.status==="standby"));

  const queued = await call("POST","/api/goddesses/execute",{
    domain:"Kryptographie",payload:"Prüfe den angegebenen Signaturbeleg."
  });
  assert.equal(queued.status,202);
  assert.equal(queued.payload.task.roleId,"cryptessa");
  assert.equal(queued.payload.task.status,"queued");

  const savedMemory = await call("POST","/api/z1/memory/items",{
    title:"Z1 Kontinuität",
    content:"Rene möchte, dass Z1 Quellen und Korrekturen erinnert.",
    sourceReference:"chat:continuity-test"
  });
  assert.equal(savedMemory.status,201);

  const selfState = await call("GET","/api/z1/self/state");
  assert.equal(selfState.status,200);
  assert.equal(selfState.payload.reportKind,"operational_self_report");
  assert.equal(selfState.payload.identity.systemId,"z1");
  assert.equal(selfState.payload.memory.sharedEntryCount,1);
  assert.equal(selfState.payload.memory.retrievalTrackedForTasks,true);
  assert.equal(selfState.payload.ambientPerceptionAvailable,false);
  assert.ok(selfState.payload.recentTasks.some(task=>task.id===queued.payload.task.id && task.status==="queued"));
  assert.match(selfState.payload.interpretation,/does not establish subjective experience/);

  const wrongMethod = await call("POST","/api/z1/self/state");
  assert.equal(wrongMethod.status,405);

  const unauthorized = await handleZ1AgentApi(
    {method:"GET",headers:{}},{},new URL("/api/goddesses","http://localhost"),
    {readJson:async()=>({}),json:(_res,status,payload)=>{assert.equal(status,401);assert.equal(payload.error,"unauthorized");}}
  );
  assert.equal(unauthorized,true);
});
