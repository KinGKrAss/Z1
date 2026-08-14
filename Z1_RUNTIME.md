# Z1 Runtime

System Z1 uses a layered runtime:

`OS → nvm → Node.js → Z1 Services/API → Z1 Core (Python) → Zoë and domain modules`

## Node.js

Node.js is the service/runtime layer. It does not replace `core/system_z1_core.py`.

Use nvm to install the project's Node.js version:

```bash
nvm install
nvm use
node --version
npm --version
```

## Start

```bash
npm run z1:api
```

The API exposes:

- `GET /health`
- `GET /api/z1/status`
- `GET /api/z1/modules`

The Python core can be tested independently:

```bash
npm run test:core
```

No credentials are embedded in the runtime. Provider integrations must use environment configuration and dedicated adapters.
