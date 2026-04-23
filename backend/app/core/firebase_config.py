import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
from pathlib import Path

# Path to the service account key JSON file
BASE_DIR = Path(__file__).resolve().parent.parent
SERVICE_ACCOUNT_KEY_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY", str(BASE_DIR / "serviceAccountKey.json"))

def initialize_firebase():
    """Initializes the Firebase Admin SDK."""
    if not firebase_admin._apps:
        if os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred)
        else:
            # Fallback for environments where the key file might not be present (e.g. CI)
            # Or if you want to use default credentials
            firebase_admin.initialize_app()

def get_db():
    """Returns a Firestore client."""
    initialize_firebase()
    return firestore.client()
