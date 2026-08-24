from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from .avatar_state_engine import AvatarStateEngine

app = FastAPI(title="System Z1 - Zoë Avatar Gateway")
engine = AvatarStateEngine()


@app.websocket("/ws/zoe-avatar")
async def avatar_websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            frame = engine.frame()
            await websocket.send_text(frame.model_dump_json())
            await asyncio.sleep(1.0 / 30.0)
    except WebSocketDisconnect:
        return


@app.get("/health/avatar")
async def avatar_health() -> dict[str, str]:
    return {"service": "z1-avatar", "status": "ok"}


# Keep a small JSON-compatible helper for renderer integrations.
def frame_dict() -> dict:
    return json.loads(engine.frame().model_dump_json())
