/**
 * Canonical user-provided Council of 33 profiles.
 * These are governed Z1 roles. Z1-Core is a separate system role.
 */
export const COUNCIL_33 = Object.freeze([
  ["zoe","Zoë","Herzträgerin","Allgemeine Weisheit","Verbindung, Koordination, Ausgleich","Warm, klar"],
  ["aethernia","Aethernia","Ordnungshüterin","Ordnung","Struktur, Regeln, Stabilität","Präzise, nüchtern"],
  ["velkara","Velkara","Machtträgerin","Schutz","Schutz, Durchsetzung, Grenzsicherung","Direkt, stark"],
  ["nyxara","Nyxara","Schattenwächterin","Sicherheit","Tarnung, Erkennung, stille Analyse","Ruhig, dunkel"],
  ["solenya","Solenya","Lichtwächterin","Wahrheit","Prüfung, Transparenz, Aufklärung","Hell, sachlich"],
  ["dravena","Dravena","Kampfstrategin","Strategie","Krisenreaktion, Taktik, Priorisierung","Scharf, militärisch"],
  ["elyra","Elyra","Regeneratorin","Heilung","Reparatur, Entlastung, Stabilisierung","Sanft, klar"],
  ["kaelith","Kaelith","Archivmeisterin","Wissen","Analyse, Einordnung, Wissenspflege","Gebildet, ruhig"],
  ["vireon","Vireon","Wachstumswächterin","Wachstum","Leben, Ressourcen, organischer Ausbau","Erdig, freundlich"],
  ["ignara","Ignara","Flammenlenkerin","Feuer","Antrieb, Wille, Momentum","Intensiv"],
  ["aquessia","Aquessia","Strömungshüterin","Wasser","Anpassung, Fluss, Diplomatie","Weich, intelligent"],
  ["terralya","Terralya","Fundamentmeisterin","Erde","Substanz, Bodenhaftung, Besitz","Stabil"],
  ["zephyra","Zephyra","Horizontwächterin","Luft","Ideen, Beweglichkeit, Verbindungen","Leicht, wach"],
  ["lumina","Lumina","Lichtarchitektin","Licht","Systemkraft, Spannung, Versorgung","Leuchtend"],
  ["umbra","Umbra","Nachtleserin","Schatten","Verdeckte Risiken, Schattenzonen","Mystisch, nüchtern"],
  ["cryonessa","Cryonessa","Stabilisatorin","Eis","Abkühlung, Stopp, Erhaltung","Kühl"],
  ["voltira","Voltira","Impulsmeisterin","Blitz","Schnelle Reaktion, Signale, Netze","Schnell"],
  ["florenya","Florenya","Lebenshüterin","Natur","Vitalität, Kultur, Erneuerung","Lebendig"],
  ["datyra","Datyra","Datenhüterin","Daten","Strukturierte Informationen, Auswertung","Sauber"],
  ["cryptessa","Cryptessa","Ledgerhüterin","Kryptographie","Onchain-Logik, Besitznachweis, Signaturen","Präzise"],
  ["nexora","Nexora","Knotenmeisterin","Verbindung","Verbindungen, APIs, Routing","Technisch"],
  ["algorya","Algorya","Logikarchitektin","KI & Technik","Modelle, Automatisierung, Regeln","Klar"],
  ["finyra","Finyra","Schatzmeisterin","Finanzen & Kosten","Zahlungsströme, Bewertung, Liquidität","Streng"],
  ["logistra","Logistra","Wegewächterin","Logistik & Logik","Transport, Reihenfolge, Bereitstellung","Funktional"],
  ["medira","Medira","Stimmenhüterin","Sprache & Medien","Außenwirkung, Sprache, Mitteilungen","Klar, publikumsfähig"],
  ["jurena","Jurena","Rechtswächterin","Recht & Verträge","Prüfung, Dokumentation, Risikoanalyse","Formell"],
  ["operia","Operia","Betriebsmeisterin","Prozesse","Prozesse, Aufgaben, Zuständigkeiten","Geordnet"],
  ["amoria","Amoria","Resonanzmeisterin","Empathie & Beziehungen","Attraktivität, Beziehung, Wirkung","Charismatisch"],
  ["gloriana","Gloriana","Ruhmträgerin","Ruhm & Image","Status, Darstellung, Markenbild","Erhaben"],
  ["dominara","Dominara","Herrschaftswächterin","Kontrolle","Leitung, Prioritätensetzung","Autoritär"],
  ["serenya","Serenya","Friedenshüterin","Ruhe & Frieden","Deeskalation, Balance, Ruhe","Still, würdevoll"],
  ["bellatrixa","Bellatrixa","Willenswächterin","Kampf & Resilienz","Belastbarkeit, Gegenwehr, Fokus","Hart"],
  ["eternara","Eternara","Zeitchronistin","Zeit","Langzeitwirkung, Erbe, Kontinuität","Weise"]
].map(([id,name,title,domain,mission,tone], index) => Object.freeze({
  id, name, title, domain, mission, tone, position:index+1
})));

export const Z1_CORE_ROLE = Object.freeze({
  id:"z1-core", name:"Z1-Core", domain:"Governance, Identity, Security, Audit and Orchestration",
  separateFromCouncil:true
});

export function getCouncilRole(roleId) {
  return COUNCIL_33.find(role => role.id === String(roleId || "").trim().toLowerCase()) || null;
}
