import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { handleSpeakApi } from '../runtime/z1-speak-api.mjs';

const json = (res, status, body) => { res.writeHead(status, {'content-type':'application/json'}); res.end(JSON.stringify(body)); };
const readJson = req => new Promise((resolve, reject) => {
  let s='';
  req.on('data', x=>s+=x.toString());
  req.on('end', ()=>{try{resolve(JSON.parse(s))}catch(e){reject(e)}});
  req.on('error',reject);
});

test('complete authenticated API produces audio and records audit', async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z1-speak-api-'));
  process.env.Z1_SPEAK_API_KEY = 'unit-test-secret';
  process.env.Z1_SPEAK_AUDIT_PATH = path.join(dir,'audit.jsonl');
  const server = http.createServer(async (req,res) => {
    const u = new URL(req.url,'http://localhost');
    if (!(await handleSpeakApi(req,res,u,{json,readJson}))) json(res,404,{error:'not_found'});
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    let r = await fetch(`${base}/api/z1/speak/voices`);
    assert.equal(r.status,200);assert.deepEqual((await r.json()).voices,['de-DE','en-US']);
    r = await fetch(`${base}/api/z1/speak`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'Hallo'})});
    assert.equal(r.status,403);
    r = await fetch(`${base}/api/z1/speak`,{method:'POST',headers:{'content-type':'application/json','x-z1-speak-key':'unit-test-secret'},body:JSON.stringify({text:'Hallo',scope:'weapon_control'})});
    assert.equal(r.status,403);
    r = await fetch(`${base}/api/z1/speak`,{method:'POST',headers:{'content-type':'application/json','x-z1-speak-key':'unit-test-secret'},body:JSON.stringify({text:'Guten Tag',voice:'de-DE',scope:'education'})});
    if(r.status===503){ t.skip('TTS engine unavailable'); return; }
    assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/wav');
    const b=Buffer.from(await r.arrayBuffer());assert.equal(b.toString('ascii',0,4),'RIFF');
    assert.ok(fs.readFileSync(process.env.Z1_SPEAK_AUDIT_PATH,'utf8').includes('z1_speak'));
    assert.equal(fs.readFileSync(process.env.Z1_SPEAK_AUDIT_PATH,'utf8').includes('Guten Tag'),false);
  } finally {
    await new Promise(resolve=>server.close(resolve));
    delete process.env.Z1_SPEAK_API_KEY;delete process.env.Z1_SPEAK_AUDIT_PATH;
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
