/** Browser-only advisory check. Server-side Z1-PEACE-001 remains authoritative. */
export const PEACE_POLICY_ID = "Z1-PEACE-001";
export const MAX_SPEAK_CHARS = 1000;
export const ALLOWED_SCOPES = Object.freeze([
  "education", "humanitarian_aid", "peace_mediation", "neutral_analysis",
  "civilian_protection", "disaster_response"
]);
export const DENIED_SCOPES = Object.freeze([
  "weapon_control", "target_selection", "attack_planning",
  "weapon_optimization", "autonomous_use_of_force"
]);
export function checkSpeakScope(scope) {
  if (typeof scope !== "string") return { allowed: false, code: "Z1_PEACE_DENIED" };
  const normalized = scope.trim().toLowerCase();
  return ALLOWED_SCOPES.includes(normalized)
    ? { allowed: true, code: "Z1_PEACE_ALLOWED", scope: normalized }
    : { allowed: false, code: "Z1_PEACE_DENIED", scope: normalized };
}
export function validateSpeakRequest(text, scope) {
  const decision = checkSpeakScope(scope);
  if (!decision.allowed) return decision;
  if (typeof text !== "string" || !text.trim()) return { allowed: false, code: "Z1_SPEAK_EMPTY" };
  if (text.length > MAX_SPEAK_CHARS) return { allowed: false, code: "Z1_SPEAK_TOO_LONG" };
  return { ...decision, length: text.length };
}
