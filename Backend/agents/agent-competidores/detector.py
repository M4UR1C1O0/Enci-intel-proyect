import logging
from datetime import datetime, timezone, timedelta
from google.cloud import firestore

logger = logging.getLogger("agente_competidores.detector")

# Umbrales: critical ≥80, high 60-79, medium 40-59, low <40
def _urgency_to_priority(urgency: int) -> str:
    if urgency >= 80:
        return "critical"
    if urgency >= 60:
        return "high"
    if urgency >= 40:
        return "medium"
    return "low"

_EXPIRY_DELTA = {
    "critical": timedelta(hours=24),
    "high":     timedelta(hours=72),
    "medium":   timedelta(days=7),
    "low":      timedelta(days=30),
}

def _expires_at(priority: str, created_at: datetime) -> datetime:
    return created_at + _EXPIRY_DELTA.get(priority, timedelta(days=30))

COL_NOTICIAS = "competitor_news"
COL_ALERTAS  = "alerts"


def cargar_noticias_previas(db: firestore.Client) -> dict:
    docs = db.collection(COL_NOTICIAS).stream()
    return {doc.id: doc.to_dict() for doc in docs}


def detectar_noticias_nuevas(noticias_actuales: list[dict], previas: dict) -> list[dict]:
    return [n for n in noticias_actuales if n["id"] not in previas]


def sincronizar_noticias(db: firestore.Client, noticias: list[dict]):
    if not noticias:
        return
    ts    = datetime.now(timezone.utc)
    batch = db.batch()
    for n in noticias:
        ref = db.collection(COL_NOTICIAS).document(n["id"])
        batch.set(ref, {**n, "updated_at": ts}, merge=True)
    batch.commit()
    logger.info(f"Sincronizadas {len(noticias)} noticias en Firestore")


def generar_alertas(db: firestore.Client, nuevas_noticias: list[dict]) -> int:
    if not nuevas_noticias:
        return 0
    ts  = datetime.now(timezone.utc)
    col = db.collection(COL_ALERTAS)

    for n in nuevas_noticias:
        urgency  = 55
        priority = _urgency_to_priority(urgency)
        # ID determinista basado en el ID único de la noticia (MD5 de su URL)
        alert_id = f"comp_noticia_{n['id']}"
        col.document(alert_id).set({
            "type":       "LAUNCH",
            "subtype":    "NOTICIA",
            "title":      f"Nueva publicación Drag Pharma: {n['titulo']}",
            "body":       n.get("resumen", "") or f"Ver artículo: {n['url']}",
            "urgency":    urgency,
            "priority":   priority,
            "source":     "Web competidor",
            "agent_id":   "agente_competidores",
            "status":     "active",
            "created_at": ts,
            "expires_at": _expires_at(priority, ts),
        })

    logger.info(f"Alertas generadas: {len(nuevas_noticias)} noticias")
    return len(nuevas_noticias)