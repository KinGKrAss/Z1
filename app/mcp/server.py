from uuid import UUID

from mcp.server.fastmcp import FastMCP

from app.db.database import SessionLocal
from app.services import DocumentService, MemoryService, PropertyService

mcp = FastMCP("z1")


def _db(): return SessionLocal()

@mcp.tool()
def create_property(object_code: str, name: str | None = None, status: str = "active", city: str | None = None, street: str | None = None, house_number: str | None = None, postal_code: str | None = None) -> dict:
    """Create a property through the Z1 service layer."""
    db = _db()
    try:
        data = {"object_code": object_code, "name": name, "status": status}
        address = {k: v for k, v in {"city": city, "street": street, "house_number": house_number, "postal_code": postal_code}.items() if v is not None}
        if address: data["address"] = address
        return PropertyService(db).create(data)
    finally: db.close()

@mcp.tool()
def search_property(query: str, limit: int = 20) -> list[dict]:
    """Search properties by code, name, street or city."""
    db = _db()
    try: return PropertyService(db).search(query, limit)
    finally: db.close()

@mcp.tool()
def get_property_context(property_id: str) -> dict:
    """Return normalized property context."""
    db = _db()
    try: return PropertyService(db).get(UUID(property_id)) or {"error": "Property not found"}
    finally: db.close()

@mcp.tool()
def save_memory(title: str, content: str, memory_type: str = "fact", confidence: float = 1.0, category: str = "general", priority: int = 5, memory_key: str | None = None, source_type: str | None = None, source_id: str | None = None, source_text: str | None = None) -> dict:
    """Persist a durable memory with versioning and optional provenance."""
    db = _db()
    try:
        sources = [] if not source_type else [{"source_type": source_type, "source_id": source_id, "source_text": source_text}]
        return MemoryService(db).save(title, content, memory_type, confidence, sources, category, priority, memory_key)
    finally: db.close()

@mcp.tool()
def search_memory(query: str, limit: int = 20) -> list[dict]:
    """Search durable Z1 memories."""
    db = _db()
    try: return MemoryService(db).search(query, limit)
    finally: db.close()

@mcp.tool()
def build_memory_context(topic: str, limit: int = 20) -> dict:
    """Build a source-aware context package for an AI agent."""
    db = _db()
    try: return MemoryService(db).context(topic, limit)
    finally: db.close()

@mcp.tool()
def ingest_conversation(conversation_id: str, messages: list[dict], title: str | None = None, source: str = "chat_import") -> dict:
    """Persist an imported conversation and its raw messages. This does not invent memories."""
    db = _db()
    try: return MemoryService(db).ingest_conversation(conversation_id, title, messages, source)
    finally: db.close()

@mcp.tool()
def save_property_document(property_id: str, name: str, drive_file_id: str | None = None, mime_type: str | None = None, version: str | None = None) -> dict:
    """Register a property document and its Drive reference."""
    db = _db()
    try: return DocumentService(db).save(UUID(property_id), {"name": name, "drive_file_id": drive_file_id, "mime_type": mime_type, "version": version})
    finally: db.close()

@mcp.tool()
def list_property_documents(property_id: str, limit: int = 100) -> list[dict]:
    """List registered documents for a property."""
    db = _db()
    try: return DocumentService(db).list(UUID(property_id), limit)
    finally: db.close()

@mcp.tool()
def build_property_expose_context(property_id: str) -> dict:
    """Build a compact property + document context package."""
    db = _db()
    try:
        pid = UUID(property_id); data = PropertyService(db).get(pid)
        if not data: return {"error": "Property not found"}
        data["documents"] = DocumentService(db).list(pid); return data
    finally: db.close()


def build_mcp_server() -> FastMCP:
    return mcp
