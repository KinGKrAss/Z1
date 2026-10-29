# Z1 Gemini MCP connector

This local MCP server exposes one tool, `gemini_ask`, for sending a one-turn text prompt to Google Gemini. It uses the repository's `@google/genai` dependency and communicates with MCP clients over stdio. Prompts and responses are not written to a local transcript; prompts are sent to Google's Gemini API and are subject to Google's service and account policies.

This connector does not connect to a hosted ChatGPT session or make Gemini and ChatGPT communicate automatically. A local Z1 runtime must support MCP over stdio and load the server configuration.

## Requirements

- Node.js 22 or newer.
- A Google Gemini API key.

## Configure

Install the repository dependencies from its root:

```sh
npm install
```

Set `GEMINI_API_KEY` in the repository's ignored `.env.local` file or in the local Z1 runtime environment. `GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`.

Add the server to the local runtime's MCP configuration, replacing the example path with the absolute path to this repository:

```json
{
  "mcpServers": {
    "z1-gemini": {
      "command": "node",
      "args": ["/absolute/path/to/Z1/integrations/gemini-mcp/server.mjs"]
    }
  }
}
```

Restart the local Z1 runtime after changing its MCP configuration. The actual config filename depends on how that local runtime is started; machine-specific configuration is not included in this repository.

## Tool

`gemini_ask` accepts a non-empty `prompt` of up to 12,000 characters and an optional Gemini `model` identifier. Each call creates a separate request; no conversation history is retained by this connector.
