import { validateSpeakRequest, MAX_SPEAK_CHARS, PEACE_POLICY_ID } from "./speak-ui-policy.mjs";
const el = id => document.getElementById(id);
const text = el("speak-text"), locale = el("voice-locale"), scope = el("scope"), custom = el("custom-scope");
const speakButton = el("speak-btn"), stopButton = el("stop-btn"), status = el("speak-status");
const auditList = el("audit-items");
const synth = window.speechSynthesis;
let current = null, audit = [];
function log(event, detail = "") {
  audit.unshift({ event, detail, at: new Date().toLocaleTimeString("de-DE") });
  audit = audit.slice(0, 40);
  auditList.replaceChildren();
  for (const item of audit) {
    const li = document.createElement("li");
    const when = document.createElement("time");
    when.textContent = item.at;
    const content = document.createElement("div");
    const type = document.createElement("strong");
    type.textContent = item.event;
    const description = document.createElement("span");
    description.textContent = item.detail;
    content.append(type, description); li.append(when, content); auditList.append(li);
  }
}
function tell(message, error = false) {
  status.textContent = message;
  status.classList.toggle("error", error);
}
function busy(isBusy) {
  speakButton.disabled = isBusy;
  stopButton.disabled = !isBusy;
  speakButton.textContent = isBusy ? "● Zoë spricht …" : "▶ Zoë sprechen lassen";
}
function stop(announced = false) {
  if (!current) return;
  current = null;
  if (synth) synth.cancel();
  busy(false);
  if (announced) { log("z1_speak_stopped", "Manuell gestoppt"); tell("Sprachausgabe gestoppt."); }
}
function voiceFor(lang) {
  const voices = synth?.getVoices?.() || [];
  return voices.find(v => v.lang?.toLowerCase() === lang.toLowerCase())
    || voices.find(v => v.lang?.slice(0, 2).toLowerCase() === lang.slice(0, 2).toLowerCase());
}
function speak() {
  const value = text.value;
  const action = scope.value === "custom" ? custom.value : scope.value;
  log("z1_speak_request", "Zweck: " + action + " · " + value.length + " Zeichen");
  const review = validateSpeakRequest(value, action);
  if (!review.allowed) {
    stop();
    log("z1_speak_denied", review.code);
    tell(review.code + ": Nicht freigegeben.", true);
    return;
  }
  if (!synth || !window.SpeechSynthesisUtterance) {
    log("z1_speak_error", "BROWSER_TTS_UNAVAILABLE");
    tell("Sprachausgabe wird auf diesem Gerät nicht unterstützt.", true);
    return;
  }
  stop();
  const utterance = new window.SpeechSynthesisUtterance(value);
  utterance.lang = locale.value;
  utterance.rate = 0.96;
  const chosenVoice = voiceFor(locale.value);
  if (chosenVoice) utterance.voice = chosenVoice;
  current = utterance;
  busy(true);
  tell("Zoë spricht mit der Stimme deines Geräts.");
  utterance.onend = () => {
    if (current !== utterance) return;
    current = null;
    busy(false);
    log("z1_speak_completed", PEACE_POLICY_ID + " · " + locale.value);
    tell("Sprachausgabe abgeschlossen.");
  };
  utterance.onerror = e => {
    if (current !== utterance) return;
    current = null;
    busy(false);
    log("z1_speak_error", String(e.error || "SPEECH_FAILED"));
    tell("Sprachausgabe fehlgeschlagen.", true);
  };
  try { synth.speak(utterance); } catch {
    current = null; busy(false);
    log("z1_speak_error", "SPEECH_FAILED");
    tell("Sprachausgabe konnte nicht gestartet werden.", true);
  }
}
text.addEventListener("input", () => {
  el("char-count").textContent = text.value.length + " / " + MAX_SPEAK_CHARS;
});
scope.addEventListener("change", () => { el("custom-wrap").hidden = scope.value !== "custom"; });
speakButton.addEventListener("click", speak);
stopButton.addEventListener("click", () => stop(true));
el("clear-audit").addEventListener("click", () => {
  audit = [];
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = "Noch keine Ereignisse.";
  auditList.replaceChildren(li);
});
window.addEventListener("pagehide", () => stop());
if (!synth || !window.SpeechSynthesisUtterance) tell("Web Speech API ist nicht verfügbar.", true);
