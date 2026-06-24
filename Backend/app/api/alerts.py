from fastapi import APIRouter
from google.cloud import firestore
from datetime import datetime

router = APIRouter()
db = firestore.AsyncClient()

CAMPOS_ALERTA = {"title", "body", "description", "type", "subtype", "priority", "urgency", "source", "agent_id", "status", "created_at", "leida"}

@router.get("/")
async def get_alerts():
    alerts_docs = await db.collection("alerts").limit(100).get()
    alerts = [
        {k: v for k, v in doc.to_dict().items() if k in CAMPOS_ALERTA}
        for doc in alerts_docs
    ]
    alerts.sort(key=lambda a: a.get("created_at") or datetime.min, reverse=True)
    return {
        "success": True,
        "data": alerts[:50]
    }