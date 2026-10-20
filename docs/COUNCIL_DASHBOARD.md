# Council and Z1 dashboard

The dashboard is available at `/council.html` after building the Vite app.

It displays the canonical role entries from `core/council_33.mjs`. Z1-Core is shown separately because the source registry defines it outside the Council of 33. Search and the domain filter operate locally on this read-only registry.

The summary connection indicator is fetched from the web server route `GET /api/z1/dashboard-health`. That route makes read-only requests to the configured Z1 API at `GET /api/z1/status` and `GET /api/z1/modules`. Configure `Z1_API_BASE_URL` on the web server when the API is not at `http://127.0.0.1:3001`. If the API cannot be reached, the dashboard shows it as unavailable.

There is no per-role runtime-status or parameter-editing endpoint in the current API. The dashboard therefore reports roles as registered and does not present them as running, synchronized, or editable.
