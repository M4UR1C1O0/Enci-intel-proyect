import logging
from datetime import datetime, timezone
from google.cloud import firestore

logger = logging.getLogger("agente_competidores.detector")

COL_PRODUCTOS = "competitor_products"
COL_NOTICIAS  = "competitor_news"
COL_ALERTAS   = "alerts"


def cargar_productos_previos(db: firestore.Client) -> dict:
    docs = db.collection(COL_PRODUCTOS).stream()
    return {doc.id: doc.to_dict() for doc in docs}


def cargar_noticias_previas(db: firestore.Client) -> dict:
    docs = db.collection(COL_NOTICIAS).stream()
    return {doc.id: doc.to_dict() for doc in docs}


def detectar_productos_nuevos(productos_actuales: list[dict], previos: dict) -> list[dict]:
    nuevos = []
    for p in productos_actuales:
        if p["id"] not in previos:
            nuevos.append(p)
    return nuevos


def detectar_noticias_nuevas(noticias_actuales: list[dict], previas: dict) -> list[dict]:
    nuevas = []
    for n in noticias_actuales:
        if n["id"] not in previas:
            nuevas.append(n)
    return nuevas


def sincronizar_productos(db: firestore.Client, productos: list[dict]):
    if not productos:
        return
    ts    = datetime.now(timezone.utc)
    batch = db.batch()
    for i, p in enumerate(productos):
        ref = db.collection(COL_PRODUCTOS).document(p["id"])
        batch.set(ref, {**p, "updated_at": ts}, merge=True)
        # Firestore permite max 500 ops por batch
        if (i + 1) % 499 == 0:
            batch.commit()
            batch = db.batch()
    batch.commit()
    logger.info(f"Sincronizados {len(productos)} productos en Firestore")


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


def generar_alertas(db: firestore.Client, nuevos_productos: list[dict], nuevas_noticias: list[dict]) -> int:
    ts    = datetime.now(timezone.utc)
    col   = db.collection(COL_ALERTAS)
    total = 0

    for p in nuevos_productos:
        col.add({
            "type":        "LAUNCH",
            "subtype":     "NUEVO_PRODUCTO",
            "title":       f"Nuevo producto: {p['nombre']} — {p['empresa']}",
            "description": f"Categoría: {p['categoria']} | Especies: {', '.join(p.get('especies', []))} | {p['url']}",
            "urgency":     70,
            "source":      "Web competidor",
            "agent_id":    "agente_competidores",
            "data":        p,
            "status":      "active",
            "created_at":  ts,
        })
        total += 1

    for n in nuevas_noticias:
        col.add({
            "type":        "LAUNCH",
            "subtype":     "NOTICIA",
            "title":       f"Nueva noticia: {n['titulo']}",
            "description": f"Competidor: {n['empresa']} | Fecha: {n.get('fecha', '')} | {n['url']}",
            "urgency":     60,
            "source":      "Web competidor",
            "agent_id":    "agente_competidores",
            "data":        n,
            "status":      "active",
            "created_at":  ts,
        })
        total += 1

    logger.info(f"Alertas generadas: {total} ({len(nuevos_productos)} productos, {len(nuevas_noticias)} noticias)")
    return total