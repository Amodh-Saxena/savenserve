import firebase_admin
from firebase_admin import credentials, firestore, auth
import os
import json
from pathlib import Path

# Path to the service account key JSON file (local dev fallback)
BASE_DIR = Path(__file__).resolve().parent.parent
SERVICE_ACCOUNT_KEY_PATH = str(BASE_DIR / "serviceAccountKey.json")

def initialize_firebase():
    """Initializes the Firebase Admin SDK.

    Supports two modes:
    1. FIREBASE_SERVICE_ACCOUNT_KEY_JSON env var (production on Render) —
       contains the entire serviceAccountKey.json content as a JSON string.
    2. serviceAccountKey.json file on disk (local development fallback).
    """
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
            # Last resort: use application default credentials (e.g. GCP environment)
            firebase_admin.initialize_app()

def get_db():
    """Returns a Firestore client."""
    initialize_firebase()
    return firestore.client()
