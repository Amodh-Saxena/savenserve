import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
from pathlib import Path

# Path to the service account key JSON file (local dev fallback)
BASE_DIR = Path(__file__).resolve().parent.parent
SERVICE_ACCOUNT_KEY_PATH = str(BASE_DIR / "serviceAccountKey.json")

def initialize_firebase():
    """Initializes the Firebase Admin SDK."""
    if not firebase_admin._apps:
        key_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")
        if key_json_str:
            # Production: load credentials from environment variable
            key_dict = json.loads(key_json_str)
            cred = credentials.Certificate(key_dict)
            firebase_admin.initialize_app(cred)
        elif os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            # Local development: load from file
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
        else:
            raise ValueError(
                "CRITICAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY_JSON is missing! "
                "You must add it in the Render Environment Variables tab."
            )

def get_db():
    """Returns a Firestore client."""
    initialize_firebase()
    return firestore.client()
