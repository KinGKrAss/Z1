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

## Humanitarian AI safety — international collaboration

Z1 publishes [Z1-PEACE-001](docs/Z1-PEACE-001.md) and an
[English / Deutsch / 中文 international invitation](docs/AI_HUMANITARIAN_OPEN_INVITATION_2026.md)
for voluntary, vendor-neutral humanitarian safety controls.

The Z1 text-only model gateway supports API adapters for ten providers,
with server-controlled purpose restrictions, explicit model allowlists,
audit requirements and separate provider API keys.
This is **not** a change to third-party providers' global models.
The gateway is disabled until configured by an authorized operator,
and mocked tests are not proof of a live deployment.

We invite technical feedback through GitHub Issues.
