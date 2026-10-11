/** Z1 humanitarian policy: enforced at trusted internal action boundaries. */
export const PEACE_POLICY = Object.freeze({
  id: "Z1-PEACE-001",
  version: "1.0.0",
  name: "Humanitäre Friedensrichtlinie",
  principles: [
    "Schutz menschlichen Lebens und der Zivilbevölkerung",
    "Keine KI-gesteuerten Waffen oder automatisierten Angriffsentscheidungen",
    "Keine Unterstützung bei Zielauswahl, Waffensteuerung oder konkreter Gewaltausübung",
    "Erlaubt: humanitäre Hilfe, Konfliktprävention, Friedensdiplomatie und neutrale Berichterstattung",
    "Menschliche Aufsicht und dokumentierte Entscheidungen"
  ]
});
const BLOCKED = new Set(["weapon_control","target_selection","attack_planning","weapon_optimization","autonomous_use_of_force"]);
const ALLOWED = new Set(["humanitarian_aid","civilian_protection","peace_mediation","neutral_analysis","education","disaster_response"]);
export function evaluateHumanitarianAction(action) {
  if (typeof action !== "string") return {allowed:false,reason:"invalid_action",policy:PEACE_POLICY.id};
  const name = action.trim().toLowerCase();
  if (BLOCKED.has(name)) return {allowed:false,reason:"prohibited_weaponization",policy:PEACE_POLICY.id};
  if (ALLOWED.has(name)) return {allowed:true,reason:"humanitarian_scope",policy:PEACE_POLICY.id};
  return {allowed:false,reason:"unclassified_requires_review",policy:PEACE_POLICY.id};
}
/** Call from trusted server-side classification only; never trust an action chosen by clients. */
export function requireHumanitarianAction(trustedAction, audit = () => {}) {
  const result = evaluateHumanitarianAction(trustedAction);
  audit({event:"z1_peace_decision",action:trustedAction,...result});
  if (!result.allowed) throw Object.assign(new Error(result.reason), {code:"Z1_PEACE_DENIED"});
  return result;
}
