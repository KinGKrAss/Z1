import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const VERSION = "1.0";
const ALGORITHM = "aes-256-gcm";
const NONCE_BYTES = 12;
const KEY_BYTES = 32;
const MAX_MESSAGE_BYTES = 64 * 1024;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function keyFromEnv() {
  const encoded = requiredEnv("Z1_DFG_KEY");
  const key = Buffer.from(encoded, "base64url");
  if (key.length !== KEY_BYTES) throw new Error("Z1_DFG_KEY must decode to exactly 32 bytes");
  return key;
}

function auditPath() {
  return path.resolve(process.env.Z1_DFG_AUDIT_PATH ?? "data/diplomatic_family_audit.jsonl");
}

function audit(event) {
  const file = auditPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`, { mode: 0o600 });
}

export function generateGatewayKey() {
  return crypto.randomBytes(KEY_BYTES).toString("base64url");
}

export function sealMessage({ senderId, recipientId, body, classification = "FAMILY_CONFIDENTIAL", messageId = crypto.randomUUID() }) {
  if (!senderId || !recipientId) throw new Error("senderId and recipientId are required");
  if (typeof body !== "string" || !body.trim()) throw new Error("message body is required");
  if (Buffer.byteLength(body, "utf8") > MAX_MESSAGE_BYTES) throw new Error("message exceeds 64 KiB limit");

  const key = keyFromEnv();
  const nonce = crypto.randomBytes(NONCE_BYTES);
  const aad = Buffer.from(JSON.stringify({ version: VERSION, messageId, senderId, recipientId, classification }), "utf8");
  const cipher = crypto.createCipheriv(ALGORITHM, key, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(body, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  const envelope = {
    version: VERSION,
    algorithm: ALGORITHM,
    messageId,
    senderId,
    recipientId,
    classification,
    createdAt: new Date().toISOString(),
    nonce: nonce.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    authTag: tag.toString("base64url"),
  };

  audit({ event: "message_sealed", messageId, senderId, recipientId, classification });
  return envelope;
}

export function openMessage(envelope) {
  if (!envelope || envelope.version !== VERSION || envelope.algorithm !== ALGORITHM) {
    throw new Error("unsupported or malformed gateway envelope");
  }
  for (const field of ["messageId", "senderId", "recipientId", "classification", "nonce", "ciphertext", "authTag"]) {
    if (typeof envelope[field] !== "string" || !envelope[field]) throw new Error(`missing envelope field: ${field}`);
  }

  const key = keyFromEnv();
  const aad = Buffer.from(JSON.stringify({
    version: envelope.version,
    messageId: envelope.messageId,
    senderId: envelope.senderId,
    recipientId: envelope.recipientId,
    classification: envelope.classification,
  }), "utf8");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(envelope.nonce, "base64url"));
  decipher.setAAD(aad);
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64url"));
  const body = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");

  audit({ event: "message_opened", messageId: envelope.messageId, senderId: envelope.senderId, recipientId: envelope.recipientId });
  return body;
}

export function authorize({ principal, recipientId }) {
  const allowed = new Set((process.env.Z1_DFG_ALLOWED_RECIPIENTS ?? "").split(",").map((v) => v.trim()).filter(Boolean));
  if (!principal || principal.role !== "sovereign") throw new Error("gateway authorization requires sovereign principal");
  if (!allowed.has(recipientId)) throw new Error("recipient is not allowlisted");
  return true;
}

export function gatewayStatus() {
  const endpoint = process.env.Z1_DFG_ENDPOINT ?? null;
  return {
    gateway: "Diplomatic Family Gateway",
    version: VERSION,
    status: endpoint ? "configured" : "prepared",
    transport: endpoint ? "HTTPS endpoint required" : "no external endpoint configured",
    encryption: ALGORITHM,
    key_configured: Boolean(process.env.Z1_DFG_KEY),
    recipients_configured: Boolean(process.env.Z1_DFG_ALLOWED_RECIPIENTS),
    external_contact: false,
  };
}
