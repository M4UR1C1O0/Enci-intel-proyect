import os
from google.cloud import firestore

def get_db() -> firestore.Client:
    project_id = os.getenv("GCP_PROJECT_ID", "enci-intel")
    return firestore.Client(project=project_id)
