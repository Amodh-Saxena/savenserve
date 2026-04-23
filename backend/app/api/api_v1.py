from fastapi import APIRouter
from app.api.routes import auth, users, foods, notifications

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(foods.router, prefix="/foods", tags=["foods"])
router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
