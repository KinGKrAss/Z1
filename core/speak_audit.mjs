/** Append-only metadata audit for Z1 Speak (never store spoken text). */
import fs from 'node:fs';
import path from 'node:path';

export function createSpeakAudit(filename = process.env.Z1_SPEAK_AUDIT_PATH ?? 'data/z1_speak_audit.jsonl') {
  const target = path.resolve(filename);
  return (entry) => {
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.appendFileSync(target, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n', { mode: 0o600 });
  };
}
