"""Single-request GPEN worker for the Z1 Node API.

Install ModelScope CV dependencies in an isolated GPU environment. Model IDs are
fixed to upstream GPEN portrait-restoration models; input is an inline image only.
"""
import base64
import json
import os
import sys
import tempfile

MODEL_IDS = {
    "damo/cv_gpen_image-portrait-enhancement-hires",
    "damo/cv_gpen_image-portrait-enhancement",
}
MAX_INPUT_BYTES = 4 * 1024 * 1024
MAX_OUTPUT_BYTES = 8 * 1024 * 1024


def emit(value):
    sys.stdout.write(json.dumps(value, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def run():
    request = json.loads(sys.stdin.readline())
    model = request.get("model")
    if model not in MODEL_IDS:
        raise ValueError("unsupported_model")
    encoded = request.get("image", "")
    if not isinstance(encoded, str) or len(encoded) > MAX_INPUT_BYTES * 2:
        raise ValueError("invalid_image")
    image_bytes = base64.b64decode(encoded, validate=True)
    if not image_bytes or len(image_bytes) > MAX_INPUT_BYTES:
        raise ValueError("invalid_image")
    extension = request.get("extension")
    if extension not in {"png", "jpg", "webp"}:
        raise ValueError("invalid_image")
    device = request.get("device", "cuda:0")
    if device not in {"cuda:0", "cpu"}:
        raise ValueError("invalid_device")

    # Import only after request validation. ModelScope loads the fixed model once
    # for this request; deployments can keep a worker process warm for lower latency.
    from modelscope.outputs import OutputKeys
    from modelscope.pipelines import pipeline
    from modelscope.utils.constant import Tasks
    import cv2

    enhancer = pipeline(Tasks.image_portrait_enhancement, model=model, device=device)
    with tempfile.NamedTemporaryFile(suffix="." + extension) as source:
        source.write(image_bytes)
        source.flush()
        result = enhancer(source.name)
    output = result.get(OutputKeys.OUTPUT_IMG) if isinstance(result, dict) else None
    if output is None:
        raise ValueError("empty_output")
    ok, encoded_output = cv2.imencode(".png", output)
    if not ok:
        raise ValueError("encode_failed")
    output_bytes = encoded_output.tobytes()
    if not output_bytes or len(output_bytes) > MAX_OUTPUT_BYTES:
        raise ValueError("output_too_large")
    emit({"image": "data:image/png;base64," + base64.b64encode(output_bytes).decode("ascii")})


if __name__ == "__main__":
    try:
        run()
    except Exception:
        # Do not return stack traces, local paths, model internals, or input data.
        emit({"error": "gpen_worker_failed"})
        sys.exit(1)
