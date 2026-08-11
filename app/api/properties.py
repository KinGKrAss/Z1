from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.database import get_db
from app.schemas import PropertyCreate
from app.services import PropertyService

router = APIRouter()


@router.get("")
def list_properties(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return {"items": PropertyService(db).list_properties(limit)}


@router.get("/search")
def search_properties(q: str, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    return {"query": q, "items": PropertyService(db).search(q, limit)}


@router.get("/{property_id}")
def get_property(property_id: UUID, db: Session = Depends(get_db)):
    result = PropertyService(db).get(property_id)
    if not result:
        raise HTTPException(status_code=404, detail="Property not found")
    return result


@router.post("", status_code=201)
def create_property(payload: PropertyCreate, db: Session = Depends(get_db)):
    return PropertyService(db).create(payload.model_dump(exclude_none=True))
