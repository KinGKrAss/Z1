import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CollectiveMemoryStore } from "../runtime/collective-memory-runtime.mjs";

test("collective entries persist, search across role-neutral knowledge, and remain user-isolated", async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "z1-memory-"));
  t.after(() => rm(dir,{recursive:true,force:true}));
  const filePath = path.join(dir,"memory.json");
  const store = await new CollectiveMemoryStore({filePath}).init();
  const saved = await store.add({ownerId:"owner-a",title:"Windpark Münster",content:"Der Windparkbericht dokumentiert Jahresertrag und Belege.",sourceReference:"doc:wind-1"});
  assert.equal(saved.provenance,"user_provided");
  const restarted = await new CollectiveMemoryStore({filePath}).init();
  assert.equal(restarted.search({ownerId:"owner-a",query:"Windpark Jahresertrag",limit:5}).length,1);
  assert.equal(restarted.search({ownerId:"owner-b",query:"Windpark Jahresertrag",limit:5}).length,0);
});

test("deduplicates identical records and rejects missing provenance", async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "z1-memory-"));
  t.after(() => rm(dir,{recursive:true,force:true}));
  const store = await new CollectiveMemoryStore({filePath:path.join(dir,"memory.json")}).init();
  const item = {ownerId:"owner-a",title:"Z1 Richtlinie",content:"Rollen nutzen gemeinsame geprüfte Quellen.",sourceReference:"doc:policy-1"};
  const first = await store.add(item);
  const second = await store.add(item);
  assert.equal(first.id,second.id);
  await assert.rejects(()=>store.add({...item,sourceReference:""}),/source_reference_required/);
  assert.equal(store.list("owner-a").length,1);
});
