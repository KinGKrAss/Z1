import express from "express";
import { discoverOrbsTonNodes, readTonBalance } from "./orbs-ton-access.mjs";

const STATUS_PAGE = "https://status.orbs.network/";

export function createOrbsTonAccessRouter({ fetchImpl = fetch, network = process.env.ORBS_TON_NETWORK ?? "mainnet" } = {}) {
  const router = express.Router();
  router.get("/status", async (_req, res) => {
    try {
      const nodes = await discoverOrbsTonNodes({ fetchImpl, network });
      res.json({
        provider: "Orbs TON Access",
        network,
        reachable: nodes.length > 0,
        healthyNodes: nodes.length,
        statusPage: STATUS_PAGE,
        checkedAt: new Date().toISOString(),
        access: "read-only",
      });
    } catch (error) {
      res.status(503).json({
        provider: "Orbs TON Access",
        network,
        reachable: false,
        healthyNodes: 0,
        statusPage: STATUS_PAGE,
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Network status check failed",
        access: "read-only",
      });
    }
  });
  router.get("/balance", async (req, res) => {
    try {
      const balance = await readTonBalance(req.query.address, { fetchImpl, network });
      res.json(balance);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Balance lookup failed";
      const clientError = message.startsWith("Provide a valid") || message.startsWith("ORBS_TON_NETWORK");
      res.status(clientError ? 400 : 503).json({ error: message, provider: "Orbs TON Access", network });
    }
  });
  return router;
}
