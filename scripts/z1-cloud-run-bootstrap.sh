#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  scripts/z1-cloud-run-bootstrap.sh --project PROJECT_ID [options]

Options:
  --region REGION                 Cloud Run / Artifact Registry region (default: europe-west3)
  --repository NAME               Artifact Registry repository (default: z1-services)
  --service NAME                  Cloud Run service (default: z1-github-tools)
  --github-repository OWNER/REPO  GitHub repository (default: KinGKrAss/Z1)
  --help                          Show this help

Requires an authenticated gcloud CLI and permission to enable APIs, create
service accounts, create workload identity pools, and grant project IAM roles.
The script creates Secret Manager containers only. Add the two secret versions
separately in Google Cloud Secret Manager; secret values are never requested or
printed by this script.
USAGE
}

PROJECT_ID=""
REGION="europe-west3"
ARTIFACT_REPOSITORY="z1-services"
CLOUD_RUN_SERVICE="z1-github-tools"
GITHUB_REPOSITORY="KinGKrAss/Z1"
RUNTIME_SERVICE_ACCOUNT="z1-github-tools-runtime"
DEPLOYER_SERVICE_ACCOUNT="z1-github-tools-deployer"
WIF_POOL="github-z1"
WIF_PROVIDER="github-z1"

while (($#)); do
  case "$1" in
    --project) PROJECT_ID="${2:?missing value for --project}"; shift 2 ;;
    --region) REGION="${2:?missing value for --region}"; shift 2 ;;
    --repository) ARTIFACT_REPOSITORY="${2:?missing value for --repository}"; shift 2 ;;
    --service) CLOUD_RUN_SERVICE="${2:?missing value for --service}"; shift 2 ;;
    --github-repository) GITHUB_REPOSITORY="${2:?missing value for --github-repository}"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ -z "$PROJECT_ID" ]]; then
  printf 'Missing required --project PROJECT_ID\n' >&2
  usage >&2
  exit 2
fi

for command_name in gcloud grep; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
done

if [[ ! "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
  printf 'Invalid Google Cloud project ID: %s\n' "$PROJECT_ID" >&2
  exit 2
fi
if [[ ! "$GITHUB_REPOSITORY" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  printf 'Invalid GitHub repository: %s\n' "$GITHUB_REPOSITORY" >&2
  exit 2
fi

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null || true)"
if [[ -z "$ACTIVE_ACCOUNT" ]]; then
  printf 'No active gcloud account. Run gcloud auth login and retry.\n' >&2
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
if [[ -z "$PROJECT_NUMBER" ]]; then
  printf 'Could not resolve project number for %s\n' "$PROJECT_ID" >&2
  exit 1
fi

printf 'Preparing Cloud Run deployment in project %s (%s), region %s.\n' "$PROJECT_ID" "$PROJECT_NUMBER" "$REGION"
printf 'Authenticated gcloud account: %s\n' "$ACTIVE_ACCOUNT"

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  --project="$PROJECT_ID"

if gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER" \
  --workload-identity-pool="$WIF_POOL" \
  --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  printf 'WIF provider %s already exists. Inspect its issuer, attribute mappings, and condition before using it; this script will not overwrite it.\n' "$WIF_PROVIDER" >&2
  exit 1
fi

if ! gcloud artifacts repositories describe "$ARTIFACT_REPOSITORY" \
  --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$ARTIFACT_REPOSITORY" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Z1 service images" \
    --project="$PROJECT_ID"
fi

ensure_service_account() {
  local account_id="$1"
  local display_name="$2"
  if ! gcloud iam service-accounts describe "${account_id}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$account_id" \
      --display-name="$display_name" \
      --project="$PROJECT_ID"
  fi
}
ensure_service_account "$RUNTIME_SERVICE_ACCOUNT" "Z1 GitHub tools runtime"
ensure_service_account "$DEPLOYER_SERVICE_ACCOUNT" "Z1 GitHub tools deployer"

ensure_secret() {
  local secret_name="$1"
  if ! gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud secrets create "$secret_name" \
      --replication-policy=automatic \
      --project="$PROJECT_ID"
  fi
}
ensure_secret "z1-github-tool-token"
ensure_secret "z1-github-token"

RUNTIME_EMAIL="${RUNTIME_SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOYER_EMAIL="${DEPLOYER_SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

for secret_name in z1-github-tool-token z1-github-token; do
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --member="serviceAccount:${RUNTIME_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" >/dev/null
done

# The deploy identity can deploy services and write images. It can act only as
# the dedicated runtime identity, not as arbitrary service accounts.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/run.admin" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/artifactregistry.writer" >/dev/null
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/serviceusage.serviceUsageConsumer" >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_EMAIL" \
  --member="serviceAccount:${DEPLOYER_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --project="$PROJECT_ID" >/dev/null

if ! gcloud iam workload-identity-pools describe "$WIF_POOL" \
  --location=global --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$WIF_POOL" \
    --location=global \
    --display-name="GitHub Actions for Z1" \
    --project="$PROJECT_ID"
fi

gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER" \
  --workload-identity-pool="$WIF_POOL" \
  --location=global \
  --display-name="GitHub Actions: ${GITHUB_REPOSITORY} main" \
  --issuer-uri="https://token.actions.githubusercontent.com/" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository_id == '1249461106' && assertion.ref == 'refs/heads/main'" \
  --project="$PROJECT_ID"

PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL}/providers/${WIF_PROVIDER}"
REPOSITORY_PRINCIPAL="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL}/attribute.repository_id/1249461106"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" \
  --member="$REPOSITORY_PRINCIPAL" \
  --role="roles/iam.workloadIdentityUser" \
  --project="$PROJECT_ID" >/dev/null

cat <<OUTPUT

GCP provisioning completed. Add these values to GitHub repository ${GITHUB_REPOSITORY}:

Repository variables
  GCP_PROJECT_ID=${PROJECT_ID}
  GCP_REGION=${REGION}
  GCP_ARTIFACT_REPOSITORY=${ARTIFACT_REPOSITORY}
  CLOUD_RUN_SERVICE=${CLOUD_RUN_SERVICE}
  GCP_RUNTIME_SERVICE_ACCOUNT=${RUNTIME_EMAIL}

GitHub Actions secrets
  GCP_WIF_PROVIDER=${PROVIDER_RESOURCE}
  GCP_DEPLOYER_SERVICE_ACCOUNT=${DEPLOYER_EMAIL}

Before deploying, add active versions to Secret Manager secrets:
  z1-github-tool-token  (generate a separate high-entropy caller token)
  z1-github-token       (read-only GitHub token scoped to ${GITHUB_REPOSITORY})

The deployment service account has project-level roles/run.admin and
roles/artifactregistry.writer. Use a dedicated project for this service where
possible. Cloud Run remains private; grant Cloud Run Invoker only to approved
callers after deployment.
OUTPUT

