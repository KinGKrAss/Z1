import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mock Data for Goddesses
const GODDESSES_FILE = path.join(process.cwd(), "api_endpoints.local.json");
const NEW_GODDESSES_DATA = [
  { id: "aegis", name: "Aegis", domain: "Schutz", core_strength: "Verteidigung", prompt_prefix: "Sprich stark und schützend.", role: "Systemschutz", access: ["security"], escalation: true },
  { id: "bellona", name: "Bellona", domain: "Kampf", core_strength: "Offensive", prompt_prefix: "Sprich kämpferisch und direkt.", role: "Offensivstrategie", access: ["combat"], escalation: true },
  { id: "vesta", name: "Vesta", domain: "Sicherheit", core_strength: "Wachsamkeit", prompt_prefix: "Sprich aufmerksam und vorsichtig.", role: "Interne Sicherheit", access: ["security"], escalation: false },
  { id: "nyx", name: "Nyx", domain: "Cyber", core_strength: "Infiltration", prompt_prefix: "Sprich leise und strategisch.", role: "Cyber-Operationen", access: ["network"], escalation: true },
  { id: "themis", name: "Themis", domain: "Recht", core_strength: "Gerechtigkeit", prompt_prefix: "Sprich nüchtern und eindeutig.", role: "Rechtsprüfung", access: ["legal"], escalation: true },
  { id: "midas", name: "Midas", domain: "Finanzen", core_strength: "Optimierung", prompt_prefix: "Sprich sachlich und präzise.", role: "Finanzsteuerung", access: ["finance"], escalation: true },
  { id: "gaia", name: "Gaia-Z", domain: "Ressourcen", core_strength: "Extraktion", prompt_prefix: "Sprich stabil und erdverbunden.", role: "Ressourcenverwaltung", access: ["resources"], escalation: false },
  { id: "electra", name: "Electra", domain: "Energie", core_strength: "Versorgung", prompt_prefix: "Sprich energisch und klar.", role: "Energiesysteme", access: ["energy"], escalation: false },
  { id: "fortuna", name: "Fortuna", domain: "Markt", core_strength: "Chancen", prompt_prefix: "Sprich kalkuliert und taktisch.", role: "Marktanalyse", access: ["market"], escalation: false },
  { id: "hestia", name: "Hestia", domain: "Infrastruktur", core_strength: "Stabilität", prompt_prefix: "Sprich ruhig und strukturiert.", role: "Bau & Systeme", access: ["infra"], escalation: false },
  { id: "sophia", name: "Sophia", domain: "Wissen", core_strength: "Analyse", prompt_prefix: "Sprich intelligent und erklärend.", role: "Wissensbasis", access: ["knowledge"], escalation: true },
  { id: "iris", name: "Iris", domain: "Kommunikation", core_strength: "Verbindung", prompt_prefix: "Sprich klar und verbindend.", role: "Kommunikation", access: ["network"], escalation: false },
  { id: "selene", name: "Selene", domain: "Erkundung", core_strength: "Expansion", prompt_prefix: "Sprich neugierig und zielgerichtet.", role: "Expansion", access: ["exploration"], escalation: false },
  { id: "hebe", name: "Hebe", domain: "Gesundheit", core_strength: "Regeneration", prompt_prefix: "Sprich sanft und unterstützend.", role: "Medizin", access: ["health"], escalation: false },
  { id: "calliope", name: "Calliope", domain: "Kultur", core_strength: "Inspiration", prompt_prefix: "Sprich inspirierend und kreativ.", role: "Kultur", access: ["culture"], escalation: false },
  { id: "calyx", name: "Calyx", domain: "Nano", core_strength: "Präzision", prompt_prefix: "Sprich technisch und exakt.", role: "Nanotechnik", access: ["nano"], escalation: false },
  { id: "dione", name: "Dione", domain: "Klima", core_strength: "Balance", prompt_prefix: "Sprich ruhig und kontrolliert.", role: "Umwelt", access: ["climate"], escalation: false },
  { id: "eos", name: "Eos", domain: "Logistik", core_strength: "Organisation", prompt_prefix: "Sprich effizient und klar.", role: "Versorgung", access: ["logistics"], escalation: false },
  { id: "thalassa", name: "Thalassa", domain: "Wasser", core_strength: "Kontrolle", prompt_prefix: "Sprich fließend und ruhig.", role: "Wassersysteme", access: ["water"], escalation: false },
  { id: "rhea", name: "Rhea", domain: "Produktion", core_strength: "Output", prompt_prefix: "Sprich produktiv und klar.", role: "Fertigung", access: ["production"], escalation: false },
  { id: "pallas", name: "Pallas", domain: "Analyse", core_strength: "Logik", prompt_prefix: "Sprich logisch und nüchtern.", role: "Analyse", access: ["analysis"], escalation: true },
  { id: "eris", name: "Eris", domain: "Chaos", core_strength: "Kontrolle", prompt_prefix: "Sprich berechnend und strategisch.", role: "Stabilisierung", access: ["risk"], escalation: true },
  { id: "artemis", name: "Artemis", domain: "Präzision", core_strength: "Treffsicherheit", prompt_prefix: "Sprich fokussiert und exakt.", role: "Zielsysteme", access: ["target"], escalation: false },
  { id: "hera", name: "Hera-V", domain: "Diplomatie", core_strength: "Verhandlung", prompt_prefix: "Sprich souverän und überzeugend.", role: "Diplomatie", access: ["diplomacy"], escalation: true },
  { id: "clio", name: "Clio", domain: "Geschichte", core_strength: "Dokumentation", prompt_prefix: "Sprich dokumentierend und klar.", role: "Archiv", access: ["history"], escalation: false },
  { id: "mnemosyne", name: "Mnemosyne", domain: "Memory", core_strength: "Speicherung", prompt_prefix: "Sprich erinnernd und strukturiert.", role: "Langzeitgedächtnis", access: ["memory"], escalation: true },
  { id: "morpheia", name: "Morpheia", domain: "Simulation", core_strength: "Vorhersage", prompt_prefix: "Sprich visionär und analytisch.", role: "Simulation", access: ["simulation"], escalation: true },
  { id: "astraea", name: "Astraea", domain: "Ordnung", core_strength: "Balance", prompt_prefix: "Sprich übergeordnet und ausgleichend.", role: "Systemgleichgewicht", access: ["all"], escalation: true },
  { id: "operia", name: "Operia", domain: "Verwaltung", core_strength: "Prozesse", prompt_prefix: "Ich bin das Getriebe im Rat des Löwenherz.", role: "Betriebsmeisterin", access: ["systems"], escalation: false },
  { id: "algorya", name: "Algorya", domain: "Logik", core_strength: "Transformation", prompt_prefix: "Sprich algorithmisch und präzise.", role: "Logikarchitektin", access: ["logic"], escalation: true },
  { id: "nike", name: "Nike", domain: "Sieg", core_strength: "Triumph", prompt_prefix: "Sprich siegreich und entschlossen.", role: "Erfolgskontrolle", access: ["market"], escalation: false },
  { id: "persephone", name: "Persephone", domain: "Resilienz", core_strength: "Tiefe", prompt_prefix: "Sprich beständig und zyklisch.", role: "Data-Recovery", access: ["memory"], escalation: true },
  { id: "hecate", name: "Hecate", domain: "Schwellen", core_strength: "Übergang", prompt_prefix: "Sprich einsichtsvoll und leitend.", role: "Gateway-Control", access: ["network"], escalation: true }
].map(g => ({
  ...g,
  url: `https://api.pantheon.local/v1/${g.id}`,
  status: Math.random() > 0.05 ? "online" : "offline",
  type: "live"
}));

// Overwrite for the new structure
fs.writeFileSync(GODDESSES_FILE, JSON.stringify(NEW_GODDESSES_DATA, null, 2));

// API Routes
app.get("/api/goddesses", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(GODDESSES_FILE, "utf-8"));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to read goddess data" });
  }
});

app.post("/api/system/heal", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(GODDESSES_FILE, "utf-8"));
    const healed = data.map((g: any) => ({ ...g, status: "online" }));
    fs.writeFileSync(GODDESSES_FILE, JSON.stringify(healed, null, 2));
    
    // Simulate complex audit logs
    const logs = [
      "Scanned 33 agent profiles...",
      "Detected memory corruption in Astraea module: REPAIRED",
      "Syncing Vault-Key with remote nodes...",
      "Goddess Alignment recalibrated to 1.0",
      "Network tunnel to City-NRW established via Hestia-Z",
    ];

    res.json({ 
      message: "🦁 System-Heilung durch Operia & Algorya vollzogen.", 
      details: "Alle 33 Einheiten im Sanctum sind nun operativ.",
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Heal failed" });
  }
});

app.get("/api/goddesses/status", async (req, res) => {
  // Simulate status check
  try {
    const data = JSON.parse(fs.readFileSync(GODDESSES_FILE, "utf-8"));
    const updatedData = data.map((g: any) => {
      // Logic from z1_goettinnen_api_router_diagnose.py simulation:
      // randomizing for the demo feel, but in reality would fetch g.url
      if (g.type === "stub") return { ...g, status: "prepped" };
      
      const random = Math.random();
      if (random > 0.8) return { ...g, status: "offline" };
      return { ...g, status: "online" };
    });
    
    // In a real app, we'd save this to z1_api_status.json as requested
    fs.writeFileSync("z1_api_status.json", JSON.stringify(updatedData, null, 2));
    
    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ error: "Failed to perform status check" });
  }
});

// Vite Middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
