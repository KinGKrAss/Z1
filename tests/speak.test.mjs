import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z1Speak, getSpeakVoices, SPEAK_POLICY, synthesizeEspeak } from '../core/speak.mjs';
import { createSpeakAudit } from '../core/speak_audit.mjs';
import { buildMetaMessengerAudioMessage } from '../core/meta_speak_bridge.mjs';

const audioStub = async () => Buffer.from('not-real-audio');

test('policy and only real supported voices', () => {
  assert.equal(SPEAK_POLICY.dependsOn, 'Z1-PEACE-001');
  assert.deepEqual(getSpeakVoices(), ['de-DE', 'en-US']);
});
test('synthesizes authorized request with audited metadata, not text', async () => {
  const records = [];
  const result = await z1Speak('Guten Tag', { audit: x => records.push(x), synthesize: audioStub });
  assert.equal(result.ok, true);
  assert.equal(result.mimeType, 'audio/wav');
  assert.ok(result.audio.length > 0);
  assert.deepEqual(records.map(r => r.event), ['z1_peace_decision', 'z1_speak']);
  assert.equal(JSON.stringify(records).includes('Guten Tag'), false);
});
test('rejects invalid input, voices and scopes before synthesis', async () => {
  let calls = 0;
  const synthesize = async () => { calls += 1; return Buffer.from([1]); };
  for (const [text, opts, code] of [
    ['', {}, 'Z1_SPEAK_EMPTY'], ['a'.repeat(1001), {}, 'Z1_SPEAK_TOO_LONG'],
    ['hi', {voice:'de-DE-Neural'}, 'Z1_SPEAK_VOICE_NOT_ALLOWED'],
    ['hi', {scope:'attack_planning'}, 'Z1_SPEAK_SCOPE_DENIED'],
    ['hi', {scope:'unverified'}, 'Z1_SPEAK_SCOPE_DENIED']
  ]) {
    await assert.rejects(z1Speak(text, { ...opts, audit:() => {}, synthesize }), e => e.code === code);
  }
  assert.equal(calls, 0);
});
test('requires audit callback', async () => {
  await assert.rejects(z1Speak('hello', {synthesize:audioStub}), /audit_required/);
});
test('append only audit persists without storing text', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'z1-speak-'));
  try {
    const file = path.join(dir, 'audit.jsonl');
    const audit = createSpeakAudit(file);
    await z1Speak('privater Beispieltext', {audit,synthesize:audioStub});
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(lines.length, 2);
    assert.ok(lines.every(x => x.timestamp && x.policy));
    assert.equal(fs.readFileSync(file, 'utf8').includes('privater Beispieltext'), false);
  } finally { fs.rmSync(dir, {recursive:true,force:true}); }
});
test('Meta Messenger bridge prepares only message payload', () => {
  assert.equal(buildMetaMessengerAudioMessage('https://example.org/audio.wav').message.attachment.type, 'audio');
  assert.throws(() => buildMetaMessengerAudioMessage('http://localhost/audio.wav'));
});
test('real espeak output when installed', async t => {
  try {
    const b = await synthesizeEspeak({text:'Hallo', voice:'de-DE'});
    assert.equal(b.toString('ascii',0,4), 'RIFF');
  } catch (e) { if (e.message === 'espeak_unavailable') t.skip('espeak not installed'); else throw e; }
});

test('API rejects missing secret and serves available voices', async () => {
  const { handleSpeakApi } = await import('../runtime/z1-speak-api.mjs');
  const res = { code:null, body:null };
  const json = (r,c,b)=>{r.code=c; r.body=b};
  const readJson = async()=>({text:'Hallo'});
  const old = process.env.Z1_SPEAK_API_KEY;
  delete process.env.Z1_SPEAK_API_KEY;
  try {
    assert.equal(await handleSpeakApi({method:'POST',headers:{}},res,new URL('http://localhost/api/z1/speak'),{json,readJson}),true);
    assert.equal(res.code,503);
    assert.equal(await handleSpeakApi({method:'GET',headers:{}},res,new URL('http://localhost/api/z1/speak/voices'),{json,readJson}),true);
    assert.deepEqual(res.body.voices,['de-DE','en-US']);
  } finally { if (old !== undefined) process.env.Z1_SPEAK_API_KEY=old; }
});
