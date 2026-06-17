from fastapi import APIRouter
from google.cloud import firestore

router = APIRouter()
db = firestore.AsyncClient()

@router.get("/")
async def get_alerts():
    alerts_ref = db.collection("alerts")
    alerts_docs = await alerts_ref.get()
    alerts = [doc.to_dict() for doc in alerts_docs]
    return {
        "success": True,
        "data": alerts
    }