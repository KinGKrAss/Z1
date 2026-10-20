# GPEN portrait enhancement

Z1 exposes GPEN as an optional second image stage at
`POST /api/z1/ai/portrait-enhancement`. The route accepts an inline PNG, JPEG,
or WebP image and returns a PNG data URL. It does not fetch remote URLs or change
the image-generation route. A client can pass a generated image to this route
after polling the ModelScope hologram task.

## Enable on a GPU host

Use a separate Python environment for ModelScope CV dependencies. Install a
PyTorch build compatible with the host CUDA driver, then install ModelScope CV:

```sh
python -m pip install "modelscope[cv]"
```

The worker downloads the selected public ModelScope model on first use. Keep the
model cache on a persistent volume. The high-resolution checkpoint is large and
GPU memory needs depend on the input image and runtime.

Set these server-side values:

```text
Z1_MODEL_GATEWAY_TOKEN=<existing Z1 API bearer secret>
Z1_GPEN_ENABLED=true
Z1_MODELSCOPE_PORTRAIT_MODELS=damo/cv_gpen_image-portrait-enhancement-hires
Z1_GPEN_DEVICE=cuda:0
```

For CPU testing, set `Z1_GPEN_DEVICE=cpu`. The route is disabled unless
`Z1_GPEN_ENABLED=true` and a supported model is explicitly allowlisted. The
model ID is also checked against a fixed GPEN-only allowlist. Do not put tokens
in a Colab notebook, browser code, or the repository.

## Request

```http
POST /api/z1/ai/portrait-enhancement
Authorization: Bearer <Z1_MODEL_GATEWAY_TOKEN>
Content-Type: application/json
```

```json
{
  "model": "damo/cv_gpen_image-portrait-enhancement-hires",
  "image": "data:image/png;base64,..."
}
```

The decoded input limit is 4 MiB. The returned `image` is an inline PNG data
URL with an 8 MiB output limit. Audit events contain the model, action, outcome,
and SHA-256 of the input image; the image bytes are not written to the audit log.
The local Python worker is launched for each request, so the first request can
take a while while the model loads. This implementation has mocked unit tests;
a live GPU inference and deployment have not been run by CI.

## Tests

```sh
node --test tests/gpen_portrait_adapter.test.mjs
```
