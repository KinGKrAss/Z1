# Z1 read-only GitHub tools

Z1 exposes two authenticated, read-only endpoints for a repository allowlist:

- `GET /api/z1/github/status?repo=owner/name` reads the default branch, newest commit, combined commit status, and Actions runs for that commit. It returns `green`, `red`, `pending`, or `unknown`. An empty checks list is `unknown`, never green.
- `GET /api/z1/github/runs?repo=owner/name&branch=main&per_page=10` lists recent Actions runs for a configured branch. `per_page` is capped at 20.

Both endpoints require `Authorization: Bearer <Z1_GITHUB_TOOL_TOKEN>`. The Z1 API sends a separate server-side `Z1_GITHUB_TOKEN` to GitHub. Configure both values in the hosting secret manager, never in the mobile app, a browser bundle, or Git.

Set `Z1_GITHUB_REPOSITORIES` to a comma-separated allowlist such as `KinGKrAss/Z1,KinGKrAss/33-G-ttinnen-`. Include a private repository only when its status should be visible through this API. For private repositories, use a fine-grained token or GitHub App installation token restricted to the selected repositories, with read-only Metadata and Actions permissions. No write permission is used.

A missing configuration returns 503; a caller token failure returns 401; a repo outside the allowlist returns 403. GitHub rate limits and permission failures return sanitized diagnostics so the token and upstream response body are not exposed. The endpoints make no writes and do not retry rate-limited requests.

After deployment, a trusted Z1 client can call the endpoint with the tool token held in its server-side secret store. This source change does not deploy the API or provision either secret.
