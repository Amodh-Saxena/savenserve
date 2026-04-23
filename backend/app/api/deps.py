from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth, firestore
from app.core.firebase_config import initialize_firebase
from app.schemas.user import UserResponse

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")

initialize_firebase()
db = firestore.client()

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Verify the ID token using the Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        if not uid or not email:
            raise credentials_exception
    except Exception:
        raise credentials_exception
        
    # Retrieve user from Firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # If user exists in Firebase Auth but not Firestore, it might be a new user
        # For now, raise exception or handle as needed
        raise credentials_exception
        
    user_data = user_doc.to_dict()
    user_data["id"] = uid
    return user_data
