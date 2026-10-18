# Z1 read-only MCP connector for Gemini

This connector lets a Gemini client call three read-only Z1 runtime endpoints:

- `z1_status` checks whether the Z1 API is online through its passive `/health` endpoint.
- `z1_modules` lists the modules exposed by the Z1 runtime.
- `z1_policy` reads the public Z1 peace and humanitarian policy.

It does not expose private finance, property, account, phone, or ChatGPT plugin data. It does not write to Z1 or call another AI model. Z1's runtime must already be deployed and reachable from this service.

## Keep the access key inside the app backend

The key is a server-side deployment secret named `Z1_MCP_ACCESS_TOKEN`. Store it in the hosting provider's secret manager or the backend process environment. Do not put it in source code, a mobile app bundle, a Gemini prompt, a settings file committed to Git, or a user-visible screen. The backend supplies it in the MCP Authorization header. Users do not need to view or type the key.

The secret still has to be installed once by an authorized operator in the backend's secret manager. This repository does not have access to a production hosting account and cannot install or activate a secret there.

## Run

Use Node.js 22 or newer. Set `Z1_API_BASE_URL` and a separate random `Z1_MCP_ACCESS_TOKEN` of at least 32 characters in the process environment or hosting secret manager. `.env.example` is a reference only; the server does not load it automatically. Keep the token out of Git, chat messages, Gemini prompts, and source files.

Install and start:

```sh
npm install
Z1_API_BASE_URL="https://your-z1-host" Z1_MCP_ACCESS_TOKEN="$Z1_MCP_ACCESS_TOKEN" npm start
```

For internet use, bind this process to loopback and put it behind a TLS reverse proxy. Keep the Z1 API private to the connector. Do not expose the Z1 API or this MCP service over plain HTTP. Rotate the MCP token if it is ever disclosed. The connector uses a separate token from `Z1_MODEL_GATEWAY_TOKEN`.

## Gemini API example

Google's Gemini Interactions API accepts remote MCP endpoints over Streamable HTTP. Configure this in your trusted Gemini API backend. Read the key from that backend's secret manager; do not return it to the mobile client:

```js
tools: [{
  type: "mcp_server",
  name: "z1_readonly",
  url: process.env.Z1_MCP_URL,
  headers: { Authorization: `Bearer ${process.env.Z1_MCP_ACCESS_TOKEN}` },
  allowed_tools: ["z1_status", "z1_modules", "z1_policy"]
}]
```

## Gemini CLI example

Add this to Gemini CLI's `settings.json`. Use the hyphenated alias shown here. Keep the token in the shell environment, not in the file:

```json
{
  "mcpServers": {
    "z1-readonly": {
      "httpUrl": "https://your-z1-mcp-host/mcp",
      "headers": { "Authorization": "Bearer $Z1_MCP_ACCESS_TOKEN" },
      "includeTools": ["z1_status", "z1_modules", "z1_policy"],
      "trust": false
    }
  }
}
```

## Limits

This connector can be used by a Gemini API backend or Gemini CLI configured for remote MCP. It does not install a connector into the consumer Gemini Android app. The ChatGPT System Z1 plugin's private persistent store is a separate service. This connector reads the Z1 runtime endpoints in `runtime/z1-api.mjs`; it cannot access that plugin store unless Z1 adds a separately authenticated API for it. A code package alone does not create a public endpoint. Hosting, TLS, runtime URL, and a private access token must be configured before Gemini can connect live.
