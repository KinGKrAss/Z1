import { GoogleGenAI } from "@google/genai";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { z } from "zod";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "../..");
config({ path: path.join(projectRoot, ".env.local") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("[Z1 Gemini MCP] Set GEMINI_API_KEY in .env.local or the runtime environment.");
  process.exit(1);
}

const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const gemini = new GoogleGenAI({ apiKey });
const server = new McpServer({ name: "z1-gemini", version: "1.0.0" });

server.registerTool(
  "gemini_ask",
  {
    description: "Send a one-turn prompt to Google Gemini and return its text response.",
    inputSchema: {
      prompt: z.string().trim().min(1).max(12_000),
      model: z.string().trim().min(1).max(120).optional(),
    },
  },
  async ({ prompt, model }) => {
    const response = await gemini.models.generateContent({
      model: model ?? defaultModel,
      contents: prompt,
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Gemini returned an empty response.");
    return { content: [{ type: "text", text }] };
  },
);

await server.connect(new StdioServerTransport());
