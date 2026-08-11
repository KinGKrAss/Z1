from fastapi import FastAPI

from app.api import memory, properties, documents
from app.db.database import check_db
from app.mcp.server import build_mcp_server

app = FastAPI(title="Z1 Cloud API", version="1.0.0")
app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])


@app.get("/health")
def health():
    try:
        check_db()
        return {"status": "ok", "service": "z1-cloud", "database": "ok"}
    except Exception:
        return {"status": "degraded", "service": "z1-cloud", "database": "unavailable"}


# MCP transport is kept separate from the REST service lifecycle. The FastMCP
# instance is exported for deployment adapters (stdio/streamable HTTP).
mcp_server = build_mcp_server()
