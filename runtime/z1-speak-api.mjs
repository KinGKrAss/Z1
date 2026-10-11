/** Z1 Speak API routes; mounted by runtime/z1-api.mjs. */
import { timingSafeEqual } from 'node:crypto';
import { z1Speak, getSpeakVoices, SPEAK_POLICY } from '../core/speak.mjs';
import { createSpeakAudit } from '../core/speak_audit.mjs';

function authorized(req) {
  const expected = process.env.Z1_SPEAK_API_KEY;
  const provided = req.headers['x-z1-speak-key'];
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Return true when route was recognized, otherwise false. */
export async function handleSpeakApi(req, res, url, { json, readJson }) {
  if (req.method === 'GET' && url.pathname === '/api/z1/speak/voices') {
    json(res, 200, { voices: getSpeakVoices(), policy: SPEAK_POLICY });
    return true;
  }
  if (req.method !== 'POST' || url.pathname !== '/api/z1/speak') return false;
  if (!process.env.Z1_SPEAK_API_KEY) {
    json(res, 503, { error: 'speak_not_configured', detail: 'Z1_SPEAK_API_KEY must be configured' });
    return true;
  }
  if (!authorized(req)) {
    json(res, 403, { error: 'speak_forbidden' });
    return true;
  }
  try {
    const body = await readJson(req);
    const audit = createSpeakAudit();
    // Public endpoint has a fixed service purpose; never trust a client-supplied scope.
    if (body.scope !== undefined && body.scope !== 'education') {
      audit({ event:'z1_speak', result:'denied_or_failed', policy:SPEAK_POLICY.id, code:'Z1_SPEAK_SCOPE_DENIED' });
      json(res, 403, { error:'speak_scope_denied' });
      return true;
    }
    const result = await z1Speak(body.text, {voice:body.voice, scope:'education', audit});
    res.writeHead(200, { 'Content-Type': result.mimeType, 'Cache-Control': 'no-store',
      'X-Z1-Policy': result.policy, 'Content-Length': result.audio.length });
    res.end(result.audio);
  } catch (error) {
    const known = ['Z1_SPEAK_EMPTY', 'Z1_SPEAK_TOO_LONG', 'Z1_SPEAK_VOICE_NOT_ALLOWED'];
    const status = known.includes(error.code) || error instanceof SyntaxError ? 400 : 503;
    json(res, status, { error: error.code || 'speak_failed' });
  }
  return true;
}
