from fastapi import APIRouter

router = APIRouter()

@router.get("")
def list_properties():
    return {"items": [], "status": "scaffold"}

@router.post("")
def create_property(payload: dict):
    return {"status": "accepted", "property": payload}
