from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.schemas import ConversationImport, MemoryCreate
from app.services import MemoryService

router = APIRouter()

@router.get("/search")
def search_memory(q: str, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return {"query": q, "items": MemoryService(db).search(q, limit)}

@router.get("/context")
def memory_context(topic: str, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    return MemoryService(db).context(topic, limit)

@router.get("/{memory_id}")
def get_memory(memory_id: UUID, db: Session = Depends(get_db)):
    result = MemoryService(db).get(memory_id)
    if not result: raise HTTPException(status_code=404, detail="Memory not found")
    return result

@router.post("", status_code=201)
def save_memory(payload: MemoryCreate, db: Session = Depends(get_db)):
    return MemoryService(db).save(**payload.model_dump())

@router.post("/conversations/import", status_code=201)
def import_conversation(payload: ConversationImport, db: Session = Depends(get_db)):
    return MemoryService(db).ingest_conversation(payload.conversation_id, payload.title, [m.model_dump() for m in payload.messages], payload.source)
