from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.schemas import DocumentCreate
from app.services import DocumentService

router = APIRouter()


@router.get("/{property_id}")
def list_documents(property_id: UUID, limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)):
    return {"property_id": str(property_id), "items": DocumentService(db).list(property_id, limit)}


@router.post("/{property_id}", status_code=201)
def save_document(property_id: UUID, payload: DocumentCreate, db: Session = Depends(get_db)):
    return DocumentService(db).save(property_id, payload.model_dump(exclude_none=True))
