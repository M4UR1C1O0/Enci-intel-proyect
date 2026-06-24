from fastapi import APIRouter
from google.cloud import firestore

router = APIRouter()
db = firestore.AsyncClient()

CAMPOS_ALERTA = {"title", "body", "description", "type", "subtype", "priority", "urgency", "source", "agent_id", "status", "created_at", "leida"}

@router.get("/")
async def get_alerts():
    alerts_docs = await (
        db.collection("alerts")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(50)
        .get()
    )
    alerts = [
        {k: v for k, v in doc.to_dict().items() if k in CAMPOS_ALERTA}
        for doc in alerts_docs
    ]
    return {
        "success": True,
        "data": alerts
    }