import assert from "node:assert/strict";
import test from "node:test";
import { generateGatewayKey, sealMessage, openMessage, authorize } from "../core/diplomatic_family_gateway.mjs";

process.env.Z1_DFG_KEY = generateGatewayKey();
process.env.Z1_DFG_ALLOWED_RECIPIENTS = "family-reem";

const principal = { id: "sovereign", role: "sovereign" };

test("seals and opens a family message", () => {
  const envelope = sealMessage({ senderId: principal.id, recipientId: "family-reem", body: "Vertraulich" });
  assert.notEqual(envelope.ciphertext, "Vertraulich");
  assert.equal(openMessage(envelope), "Vertraulich");
});

test("rejects non-sovereign sender", () => {
  assert.throws(() => authorize({ principal: { id: "zoe", role: "assistant" }, recipientId: "family-reem" }));
});

test("rejects non-allowlisted recipient", () => {
  assert.throws(() => authorize({ principal, recipientId: "unknown-contact" }));
});
