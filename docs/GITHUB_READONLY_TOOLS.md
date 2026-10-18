# Z1 read-only GitHub tools

Z1 exposes two authenticated, read-only endpoints for a repository allowlist:

- `GET /api/z1/github/status?repo=owner/name` reads the default branch, newest commit, combined commit status, and Actions runs for that commit. It returns `green`, `red`, `pending`, or `unknown`. An empty checks list or a truncated Actions-run list is `unknown`, never green.
- `GET /api/z1/github/runs?repo=owner/name&branch=main&per_page=10` lists recent Actions runs for a configured branch. `per_page` is capped at 20.

Both endpoints require `Authorization: Bearer <Z1_GITHUB_TOOL_TOKEN>`. The Z1 API sends a separate server-side `Z1_GITHUB_TOKEN` to GitHub. Configure both values in the hosting secret manager, never in the mobile app, a browser bundle, or Git.

Set `Z1_GITHUB_REPOSITORIES` to a comma-separated allowlist such as `KinGKrAss/Z1,KinGKrAss/33-G-ttinnen-`. Include a private repository only when its status should be visible through this API. For private repositories, use a fine-grained token or GitHub App with access limited to the selected repositories. Grant read-only Metadata, Actions, Contents, and Commit statuses permissions. No write permission is used. The status endpoint needs Contents to read the latest commit and Commit statuses to read its combined status.

A missing token or empty repository allowlist returns 503; a caller token failure returns 401; a repo outside the allowlist returns 403. GitHub rate limits, including HTTP 429 and secondary-limit responses, and permission failures return sanitized diagnostics so the token and upstream response body are not exposed. The endpoints make no writes and do not retry rate-limited requests.

GitHub App installation tokens expire after one hour. This runtime does not mint or refresh them. If an installation token is used, an external secret manager or rotation process must refresh it before expiry. A fine-grained personal access token is another option when policy permits.

After deployment, a trusted Z1 client can call the endpoint with the tool token held in its server-side secret store. This source change does not deploy the API or provision either secret.
