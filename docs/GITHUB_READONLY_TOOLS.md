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

1. Choose a Google Cloud project and region. Enable Cloud Run, Artifact Registry, Secret Manager, IAM, IAM Credentials, and Security Token Service APIs. Create a Docker Artifact Registry repository in that region.
2. Create a runtime service account for the service. Create Secret Manager secrets named `z1-github-tool-token` and `z1-github-token`. Add secret versions directly in Secret Manager; never place their values in GitHub or this repository. Grant the runtime service account `roles/secretmanager.secretAccessor` on those two secrets only.
3. Create a separate deployment service account. Grant it Cloud Run deployment and Artifact Registry write permissions, plus `roles/iam.serviceAccountUser` on the runtime service account.
4. Configure Workload Identity Federation for GitHub Actions. Restrict the provider to repository `KinGKrAss/Z1` and ref `refs/heads/main`; avoid a long-lived service-account JSON key.
5. Add these GitHub repository variables: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_ARTIFACT_REPOSITORY`, `CLOUD_RUN_SERVICE`, and `GCP_RUNTIME_SERVICE_ACCOUNT`.
6. Add these GitHub Actions secrets: `GCP_WIF_PROVIDER` (full provider resource name) and `GCP_DEPLOYER_SERVICE_ACCOUNT` (deployment service-account email).

The GitHub token stored in `z1-github-token` must be read-only and scoped only to `KinGKrAss/Z1). The service requires repository metadata, contents, commit-status, and Actions read access. Generate a separate high-entropy value for `z1-github-tool-token`; trusted callers must send it as a Bearer token in addition to authenticating to private Cloud Run. Give only approved callers the Cloud Run Invoker role.

After setup, run **Deploy Z1 GitHub tools to Cloud Run** from GitHub Actions with branch `main`. The workflow builds and pushes the isolated image, deploys the private Cloud Run service, and prints its URL. It does not make the service public or configure a caller identity.

This repository change does not create Google Cloud resources, add secret values, or perform a live deployment. Cloud Run deployments use Workload Identity Federation and Secret Manager so that long-lived credentials and application tokens do not need to be committed. See [Google Cloud Workload Identity Federation for deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines), [Cloud Run service secrets](https://docs.cloud.google.com/run/docs/configuring/services/secrets), and [Cloud Run deployment reference](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy).
