from fastapi import APIRouter
from google.cloud import firestore
from datetime import datetime, timezone

router = APIRouter()
db = firestore.AsyncClient()

CAMPOS_ALERTA = {
    "title", "body", "description", "type", "subtype",
    "priority", "urgency", "source", "agent_id", "status",
    "created_at", "leida", "expires_at", "data",
}

# Umbrales: critical ≥80, high 60-79, medium 40-59, low <40
def _resolve_priority(alert: dict) -> str:
    if alert.get("priority"):
        return str(alert["priority"]).lower()
    urgency = alert.get("urgency")
    if isinstance(urgency, (int, float)):
        if urgency >= 80:
            return "critical"
        if urgency >= 60:
            return "high"
        if urgency >= 40:
            return "medium"
        return "low"
    return "low"

def _is_active(alert: dict, now: datetime) -> bool:
    expires = alert.get("expires_at")
    if expires is None:
        return True
    if isinstance(expires, datetime):
        exp = expires if expires.tzinfo else expires.replace(tzinfo=timezone.utc)
        return exp > now
    return True

@router.get("/")
async def get_alerts():
    now = datetime.now(timezone.utc)
    _min_ts = datetime.min.replace(tzinfo=timezone.utc)

    alerts_docs = await (
        db.collection("alerts")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(500)
        .get()
    )

    alerts = []
    for doc in alerts_docs:
        data = {k: v for k, v in doc.to_dict().items() if k in CAMPOS_ALERTA}
        data["id"] = doc.id
        if not _is_active(data, now):
            continue
        data["priority"] = _resolve_priority(data)
        for campo in ("created_at", "expires_at"):
            if campo in data and isinstance(data[campo], datetime):
                data[campo] = data[campo].isoformat()
        alerts.append(data)

    alerts.sort(key=lambda a: a.get("created_at") or _min_ts.isoformat(), reverse=True)

    counts = {
        "total":    len(alerts),
        "critical": sum(1 for a in alerts if a["priority"] == "critical"),
        "high":     sum(1 for a in alerts if a["priority"] == "high"),
        "medium":   sum(1 for a in alerts if a["priority"] == "medium"),
        "low":      sum(1 for a in alerts if a["priority"] == "low"),
    }

    return {
        "success": True,
        "counts":  counts,
        "data":    alerts[:50],
    }