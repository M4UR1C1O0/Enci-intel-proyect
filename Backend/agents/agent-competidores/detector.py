import logging
from datetime import datetime, timezone
from google.cloud import firestore

logger = logging.getLogger("agente_competidores.detector")

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
        col.add({
            "type":       "LAUNCH",
            "subtype":    "NOTICIA",
            "title":      f"Nueva publicación Drag Pharma: {n['titulo']}",
            "body":       n.get("resumen", "") or f"Ver artículo: {n['url']}",
            "urgency":    60,
            "source":     "Web competidor",
            "agent_id":   "agente_competidores",
            "status":     "active",
            "created_at": ts,
        })

    logger.info(f"Alertas generadas: {len(nuevas_noticias)} noticias")
    return len(nuevas_noticias)