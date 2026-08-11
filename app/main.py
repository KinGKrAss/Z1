from fastapi import FastAPI

from app.api import memory, properties, documents

app = FastAPI(title="Z1 Cloud API", version="1.0.0")
app.include_router(properties.router, prefix="/api/properties", tags=["properties"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "z1-cloud"}
