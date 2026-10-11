/** Z1-SPEAK-001: server-side audible TTS; requires trusted policy scope. */
import { spawn } from 'node:child_process';
import { requireHumanitarianAction, PEACE_POLICY } from './humanitarian_policy.mjs';

const VOICE_MAP = Object.freeze({ 'de-DE': 'de', 'en-US': 'en-us' });
const ALLOWED_SCOPES = new Set([
  'education', 'humanitarian_aid', 'peace_mediation', 'neutral_analysis',
  'civilian_protection', 'disaster_response'
]);
export const SPEAK_POLICY = Object.freeze({
  id: 'Z1-SPEAK-001', version: '1.0.0', dependsOn: PEACE_POLICY.id,
  defaultVoice: 'de-DE', maxChars: 1000, format: 'audio/wav'
});
export function getSpeakVoices() { return Object.keys(VOICE_MAP); }

/** Run espeak without shell expansion; fail if the engine is unavailable. */
export function synthesizeEspeak({ text, voice }) {
  return new Promise((resolve, reject) => {
    const child = spawn('espeak', ['--stdout', '-v', VOICE_MAP[voice], '-s', '150'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const chunks = [];
    let total = 0;
    let errorOutput = '';
    let settled = false;
    const timeout = setTimeout(() => child.kill(), 15000);
    const fail = (reason) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(Object.assign(new Error(reason), { code: 'Z1_SPEAK_ENGINE_ERROR' }));
    };
    child.on('error', () => fail('espeak_unavailable'));
    child.stdout.on('data', chunk => {
      total += chunk.length;
      if (total > 16 * 1024 * 1024) { child.kill(); fail('audio_too_large'); return; }
      chunks.push(chunk);
    });
    child.stderr.on('data', chunk => { errorOutput += chunk.toString().slice(0, 500); });
    child.stdin.on('error', () => {});
    child.on('close', code => {
      if (settled) return;
      clearTimeout(timeout);
      if (code !== 0) return fail('espeak_failed');
      const audio = Buffer.concat(chunks);
      if (audio.length < 44 || audio.toString('ascii', 0, 4) !== 'RIFF') return fail('invalid_wav');
      settled = true;
      resolve(audio);
    });
    child.stdin.end(text);
  });
}

/** Scope must be selected by trusted server logic, NOT accepted as proof from user input. */
export async function z1Speak(text, opts = {}) {
  const { voice = SPEAK_POLICY.defaultVoice, scope = 'education',
    audit, synthesize = synthesizeEspeak } = opts;
  if (typeof audit !== 'function') throw Object.assign(new Error('audit_required'), { code: 'Z1_SPEAK_AUDIT_REQUIRED' });
  try {
    if (typeof text !== 'string' || !text.trim()) throw Object.assign(new Error('empty_text'), { code: 'Z1_SPEAK_EMPTY' });
    if (text.length > SPEAK_POLICY.maxChars) throw Object.assign(new Error('text_too_long'), { code: 'Z1_SPEAK_TOO_LONG' });
    if (!Object.hasOwn(VOICE_MAP, voice)) throw Object.assign(new Error('voice_not_allowed'), { code: 'Z1_SPEAK_VOICE_NOT_ALLOWED' });
    if (!ALLOWED_SCOPES.has(scope)) throw Object.assign(new Error('scope_not_allowed'), { code: 'Z1_SPEAK_SCOPE_DENIED' });
    requireHumanitarianAction(scope, audit);
    const raw = await synthesize({ text, voice });
    if (!(raw instanceof Uint8Array) || raw.byteLength === 0) throw Object.assign(new Error('invalid_audio'), { code: 'Z1_SPEAK_ENGINE_ERROR' });
    const audio = Buffer.from(raw);
    audit({ event: 'z1_speak', result: 'success', policy: SPEAK_POLICY.id,
      scope, voice, length: text.length, audioBytes: audio.length });
    return { ok: true, audio, mimeType: SPEAK_POLICY.format, voice, scope,
      policy: SPEAK_POLICY.id, timestamp: new Date().toISOString() };
  } catch (error) {
    audit({ event: 'z1_speak', result: 'denied_or_failed', policy: SPEAK_POLICY.id,
      scope: typeof scope === 'string' ? scope : 'invalid', code: error.code || 'Z1_SPEAK_FAILED',
      length: typeof text === 'string' ? text.length : 0 });
    throw error;
  }
}
