from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_notifications():
    return [{"id": 1, "message": "Placeholder: New food available near you!"}]
