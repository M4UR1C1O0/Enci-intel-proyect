import os
import firebase_admin
from firebase_admin import credentials, firestore as fb_firestore

if not firebase_admin._apps:
    key_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    if key_path and os.path.exists(key_path):
        # Local: usa el JSON de la service account
        firebase_admin.initialize_app(credentials.Certificate(key_path))
    else:
        # Cloud Run: usa Application Default Credentials automáticamente
        firebase_admin.initialize_app()

db = fb_firestore.client()
