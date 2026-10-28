<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3c2987e2-c423-4fb0-8850-7fc54ceac624

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Python development setup

Use Python 3.12. Create a virtual environment with `python -m venv .venv`,
then activate it with `source .venv/bin/activate` (Linux/macOS) or
`.venv\Scripts\activate` (Windows).
Install runtime and test dependencies with `python -m pip install -r requirements-dev.txt`.
Run all Python tests with `python -m pytest tests -q`.
The pinned textract 2.x release replaces 1.6.5, whose invalid dependency metadata
is rejected by current pip versions. Some document formats additionally require
system extraction tools; the UTF-8 text extraction test does not require them.

## Humanitarian AI safety — international collaboration

Z1 publishes [Z1-PEACE-001](docs/Z1-PEACE-001.md) and an
[English / Deutsch / 中文 international invitation](docs/AI_HUMANITARIAN_OPEN_INVITATION_2026.md)
for voluntary, vendor-neutral humanitarian safety controls.

The Z1 model gateway supports governed text inference across eleven providers.
ModelScope additionally has authenticated image-question and hologram-generation
routes for separately allowlisted vision and image models. The hologram route
creates a friendly fictional AI being in a luminous 3D hologram style and returns
an asynchronous task URL that can be polled for the generated image.
Requests use server-side credentials, fixed provider origins, purpose restrictions
and redacted audit records. Z1 never fetches a provider-returned image URL.
This is **not** a change to third-party providers' global models.
The gateway is disabled until configured by an authorized operator,
and mocked tests are not proof of a live deployment.

An optional GPEN portrait-enhancement stage is available for generated or
user-supplied images. It is a separate GPU-backed local worker and does not
generate images by itself. See [GPEN adapter setup](docs/GPEN_ADAPTER.md).

For ModelScope image generation, set the server secrets MODELSCOPE_TOKEN and
Z1_MODEL_GATEWAY_TOKEN, then allowlist a model in Z1_MODELSCOPE_IMAGE_MODELS
(for example Qwen/Qwen-Image-2.1). Send an authenticated POST
/api/z1/ai/hologram with { "model": "...", "description": "..." }.
The response is 202 with a taskUrl; poll that URL using the same bearer token
until the task status is SUCCEED. The returned image URL comes from ModelScope.

We invite technical feedback through GitHub Issues.

## Governed automatic model selection

The authenticated humanitarian workflows support opt-in, server-configured
automatic model selection. See [model routing](docs/MODEL_ROUTING.md) for the
quality/cost/latency algorithm, confidentiality approvals and validation.
No profiles or live model calls are enabled by this code change.


## Windpark accounting

Z1 includes a source-referenced monthly ledger for windpark production, income, operating costs and cash flow. See [the setup and data rules](docs/WINDPARK_ACCOUNTING.md) and open `/windparks.html` in the app. It starts empty and does not connect to banks, meters or settlement providers.
