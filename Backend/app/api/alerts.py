import asyncio
from fastapi import APIRouter
from google.cloud import firestore
from datetime import datetime, timezone, timedelta
from app.api import cache as _cache

router = APIRouter()
db = firestore.AsyncClient()

_SAG_EXCLUIR = {"status", "cancelled_at", "updated_at"}
COUNTS_WINDOW = timedelta(days=30)  # las tarjetas KPI solo cuentan alertas recientes

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

@router.get("/")
async def get_alerts():
    cached = _cache.get("alerts")
    if cached:
        return cached

    _min_ts = datetime.min.replace(tzinfo=timezone.utc)
    _counts_cutoff = datetime.now(timezone.utc) - COUNTS_WINDOW

    alerts_docs = await (
        db.collection("alerts")
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(500)
        .get()
    )

    alerts = []
    prioridades_recientes = []
    for doc in alerts_docs:
        data = {k: v for k, v in doc.to_dict().items() if k in CAMPOS_ALERTA}
        data["id"] = doc.id
        data["priority"] = _resolve_priority(data)
        created = data.get("created_at")
        if isinstance(created, datetime):
            created_utc = created if created.tzinfo else created.replace(tzinfo=timezone.utc)
            if created_utc >= _counts_cutoff:
                prioridades_recientes.append(data["priority"])
        for campo in ("created_at", "expires_at"):
            if campo in data and isinstance(data[campo], datetime):
                data[campo] = data[campo].isoformat()
        alerts.append(data)

    alerts.sort(key=lambda a: a.get("created_at") or _min_ts.isoformat(), reverse=True)

    # Enriquecer alertas SAG cancelación con datos de sag_productos
    indices_sag = [
        (i, (a.get("data") or {}).get("registro"))
        for i, a in enumerate(alerts)
        if a.get("agent_id") == "agente_sag"
        and a.get("subtype") == "CANCELACION"
        and (a.get("data") or {}).get("registro")
    ]
    if indices_sag:
        registros_uniq = list({r for _, r in indices_sag})
        refs = [db.collection("sag_productos").document(r) for r in registros_uniq]
        docs_sag = await asyncio.gather(*[ref.get() for ref in refs])
        productos = {
            doc.id: {k: v for k, v in doc.to_dict().items() if k not in _SAG_EXCLUIR and v not in (None, "")}
            for doc in docs_sag if doc.exists
        }
        for i, reg_id in indices_sag:
            if reg_id in productos:
                current = alerts[i].get("data") or {}
                alerts[i]["data"] = {**current, **productos[reg_id]}

    counts = {
        "total":    len(prioridades_recientes),
        "critical": sum(1 for p in prioridades_recientes if p == "critical"),
        "high":     sum(1 for p in prioridades_recientes if p == "high"),
        "medium":   sum(1 for p in prioridades_recientes if p == "medium"),
        "low":      sum(1 for p in prioridades_recientes if p == "low"),
    }

    result = {
        "success": True,
        "counts":  counts,
        "data":    alerts[:50],
    }
    _cache.set("alerts", result, ttl=120)
    return result