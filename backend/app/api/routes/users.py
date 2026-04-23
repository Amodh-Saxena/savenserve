from fastapi import APIRouter, Depends
from typing import List
from firebase_admin import firestore
from app.core.firebase_config import initialize_firebase
from app.schemas.user import UserResponse, UserUpdate
from app.api.deps import get_current_user
from app.core.mappls import geocode_address

initialize_firebase()
db = firestore.client()
router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/update_me", response_model=UserResponse)
def update_user_me(user_in: UserUpdate, current_user: dict = Depends(get_current_user)):
    try:
        lat, lng = geocode_address(user_in.location)
        
        update_data = {
            "location": user_in.location,
            "lat": lat if lat else (current_user.get("lat") or 0.0),
            "lng": lng if lng else (current_user.get("lng") or 0.0)
        }

        user_ref = db.collection("users").document(current_user["id"])
        user_ref.update(update_data)
        
        # Merge for response ensuring strict payload alignment
        role_raw = str(current_user.get("role", "donor")).lower()
        if role_raw not in ["donor", "ngo", "admin"]:
             role_raw = "donor"
             
        updated_user = {
            **current_user,
            "name": current_user.get("name") or "Unknown",
            "email": current_user.get("email") or "unknown@example.com",
            "role": role_raw,
            **update_data
        }
        return updated_user
    except Exception as e:
        from fastapi import HTTPException
        print(f"Update Address FATAL Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[UserResponse])
def read_all_users():
    users_ref = db.collection("users").stream()
    users = []
    for doc in users_ref:
        data = doc.to_dict()
        data["id"] = doc.id
        users.append(data)
    return users
