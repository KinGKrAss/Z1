from fastapi import APIRouter

router = APIRouter()

@router.get("/search")
def search_memory(q: str, limit: int = 20):
    return {"query": q, "items": [], "limit": limit, "status": "scaffold"}

@router.post("")
def save_memory(payload: dict):
    return {"status": "accepted", "memory": payload}
