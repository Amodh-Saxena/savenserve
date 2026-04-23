from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth, firestore
from fastapi.security import OAuth2PasswordRequestForm
from app.core.firebase_config import initialize_firebase
from app.core.mappls import geocode_address
from app.api.deps import get_current_user
from app.schemas.user import UserCreate, UserResponse
from app.core.mongodb import get_mongo_db
import datetime

router = APIRouter()

initialize_firebase()
db = firestore.client()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate):
    # This endpoint is called after the user is created in Firebase Auth on the frontend.
    # We use the UID to store metadata in Firestore.
    try:
        # Check if user already exists in Auth or Firestore
        # But usually, the frontend creates the Auth user first.
        # So we just update/create the Firestore document.
        user_ref = db.collection("users").where("email", "==", user_in.email).limit(1).get()
        if len(user_ref) > 0:
             raise HTTPException(status_code=400, detail="User already exists.")
             
        # In a real Firebase app, we'd use the UID from the token. 
        # For the direct register call, we might need to create the user in Auth first if it doesn't exist.
        user_record = auth.create_user(
            email=user_in.email,
            password=user_in.password,
            display_name=user_in.name
        )
        
        # Perform synchronous Geocoding on Mapmyindia
        lat, lng = (None, None)
        if user_in.location:
             lat, lng = geocode_address(user_in.location)
             if not lat:
                 # Block Registration if MapmyIndia rejects the address parameters
                 raise HTTPException(status_code=400, detail="Address could not be verified on the Map. Please provide a more precise tracking address.")

        user_data = {
            "email": user_in.email,
            "name": user_in.name,
            "role": user_in.role.value,
            "location": user_in.location,
            "contact_number": getattr(user_in, 'contact_number', None),
            "lat": lat,
            "lng": lng,
            "created_at": firestore.SERVER_TIMESTAMP
        }
        
        db.collection("users").document(user_record.uid).set(user_data)
        
        # Mirror to MongoDB
        try:
            mongo_db = get_mongo_db()
            mongo_user_data = user_data.copy()
            mongo_user_data["_id"] = user_record.uid
            # Remove objects that are not BSON serializable if any
            if "created_at" in mongo_user_data:
                mongo_user_data["created_at"] = datetime.datetime.utcnow()
            mongo_db.users.insert_one(mongo_user_data)
        except Exception as mongo_err:
            print(f"MongoDB Mirror Error: {mongo_err}")

        user_data["id"] = user_record.uid
        return user_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # NOTE: Firebase handles login on the frontend. 
    # This endpoint is only if the user wants to use standard OAuth2 flow with Firebase Admin.
    # However, it's better to just use the Firebase SDK on the frontend.
    # I'll provide a simple placeholder or suggest the frontend approach.
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Login should be handled on the frontend via Firebase SDK."
    )
