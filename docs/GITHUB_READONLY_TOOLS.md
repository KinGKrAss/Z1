# Z1 read-only GitHub tools

Z1 exposes two authenticated, read-only endpoints for a repository allowlist:

- `GET /api/z1/github/status?repo=owner/name` reads the default branch, newest commit, combined commit status, and Actions runs for that commit. It returns `green`, `red`, `pending`, or `unknown`. An empty checks list or a truncated Actions-run list is `unknown`, never green.
- `GET /api/z1/github/runs?repo=owner/name&branch=main&per_page=10` lists recent Actions runs for a configured branch. `per_page` is capped at 20.

Both endpoints require `Authorization: Bearer <Z1_GITHUB_TOOL_TOKEN>`. The Z1 API sends a separate server-side `Z1_GITHUB_TOKEN` to GitHub. Configure both values in the hosting secret manager, never in the mobile app, a browser bundle, or Git.

Set `Z1_GITHUB_REPOSITORIES` to a comma-separated allowlist such as `KinGKrAss/Z1,KinGKrAss/33-G-ttinnen-`. Include a private repository only when its status should be visible through this API. For private repositories, use a fine-grained token or GitHub App with access limited to the selected repositories. Grant read-only Metadata, Actions, Contents, and Commit statuses permissions. No write permission is used. The status endpoint needs Contents to read the latest commit and Commit statuses to read its combined status.

A missing token or empty repository allowlist returns 503; a caller token failure returns 401; a repo outside the allowlist returns 403. GitHub rate limits, including HTTP 429 and secondary-limit responses, and permission failures return sanitized diagnostics so the token and upstream response body are not exposed. The endpoints make no writes and do not retry rate-limited requests.

GitHub App installation tokens expire after one hour. This runtime does not mint or refresh them. If an installation token is used, an external secret manager or rotation process must refresh it before expiry. A fine-grained personal access token is another option when policy permits.

After deployment, a trusted Z1 client can call the endpoint with the tool token held in its server-side secret store. This source change does not deploy the API or provision either secret.

## Private Cloud Run deployment

The isolated service in `runtime/z1-github-api-server.mjs` exposes only `/health` and the two read-only GitHub routes. Its container is built from `Dockerfile.z1-github-tools`; it listens on Cloud Run's `PORT` and binds to `0.0.0.0`. The deployment workflow is manual and only accepts the `main` branch. It deploys with `--no-allow-unauthenticated`, so the service is private by default.

### One-time Google Cloud setup

For a repeatable bootstrap, use `scripts/z1-cloud-run-bootstrap.sh` from a trusted workstation with an authenticated `gcloud` CLI:

```sh
bash scripts/z1-cloud-run-bootstrap.sh --project YOUR_PROJECT_ID --region europe-west3
```

The Google identity running the script needs permission to enable APIs, create service accounts and Workload Identity Federation resources, and grant project IAM roles. The script enables the required APIs, creates the Artifact Registry repository, dedicated runtime and deployer service accounts, two empty Secret Manager secrets, and a GitHub OIDC provider restricted to GitHub repository ID `1249461106` (`KinGKrAss/Z1`) on `refs/heads/main`. Using the immutable repository ID avoids trusting a repository name that could later be reused. It grants the runtime account access only to the two secrets and lets the GitHub identity impersonate only the dedicated deployer account. It refuses to overwrite an existing WIF provider so an existing trust policy is not silently changed.

The script does not set GitHub repository configuration and never requests or prints secret values. Copy the printed values into these GitHub repository settings:

- Variables: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_ARTIFACT_REPOSITORY`, `CLOUD_RUN_SERVICE`, and `GCP_RUNTIME_SERVICE_ACCOUNT`.
- Actions secrets: `GCP_WIF_PROVIDER` (full provider resource name) and `GCP_DEPLOYER_SERVICE_ACCOUNT` (deployer service-account email).

Add active versions directly in Google Cloud Secret Manager before deployment:

- `z1-github-tool-token`: a separate high-entropy token for trusted callers.
- `z1-github-token`: a read-only GitHub token scoped only to `KinGKrAss/Z1`, with repository metadata, contents, commit-status, and Actions read access.

The bootstrap grants the deployer `roles/run.admin` and `roles/artifactregistry.writer` at the project level, plus `roles/iam.serviceAccountUser` on the runtime service account. Use a dedicated Google Cloud project for this service where possible. Cloud Run remains private; grant Cloud Run Invoker only to approved callers after deployment. Caller requests also need the app-level bearer token.

After setup, run **Deploy Z1 GitHub tools to Cloud Run** from GitHub Actions with branch `main`. The workflow builds and pushes the isolated image, deploys the private Cloud Run service, and prints its URL. It does not make the service public or configure a caller identity.

This repository change does not create Google Cloud resources, add secret values, or perform a live deployment. Cloud Run deployments use Workload Identity Federation and Secret Manager so that long-lived credentials and application tokens do not need to be committed. See [Google Cloud Workload Identity Federation for deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [Cloud Run service secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets), and [Cloud Run deployment reference](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy).
