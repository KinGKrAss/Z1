from fastapi import APIRouter

router = APIRouter()

@router.get("/{property_id}")
def list_documents(property_id: str):
    return {"property_id": property_id, "items": [], "status": "scaffold"}

@router.post("/{property_id}")
def save_document(property_id: str, payload: dict):
    return {"property_id": property_id, "status": "accepted", "document": payload}
