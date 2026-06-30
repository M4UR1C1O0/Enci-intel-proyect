import logging
from datetime import datetime, timezone, timedelta
from google.cloud import firestore
import pandas as pd

logger = logging.getLogger("agente_sag.detector")

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

COL_REGISTRO = "Registro"
COL_NOMBRE   = "Nombre comercial"
COL_EMPRESA  = "Empresa Fabricante"
COL_IMPORTADOR = "Importador o Registrante"

COLECCION = "sag_productos"


def cargar_registros_previos(db: firestore.Client) -> dict:
    docs = db.collection(COLECCION).where("status", "!=", "cancelado").stream()
    return {doc.id: doc.to_dict() for doc in docs}


def detectar_cambios(df_actual: pd.DataFrame, previos: dict) -> tuple[set, set]:
    actuales_ids = set(df_actual[COL_REGISTRO].astype(str).str.strip().tolist())
    previos_ids  = set(previos.keys())
    nuevos      = actuales_ids - previos_ids
    cancelados  = previos_ids - actuales_ids
    return nuevos, cancelados


def sincronizar_productos(db: firestore.Client, df_actual: pd.DataFrame, cancelados: set):
    batch = db.batch()
    ts = datetime.now(timezone.utc)
    for _, row in df_actual.iterrows():
        num = str(row[COL_REGISTRO]).strip()
        ref = db.collection(COLECCION).document(num)
        batch.set(ref, {**row.to_dict(), "updated_at": ts, "status": "activo"}, merge=True)
    for reg_id in cancelados:
        ref = db.collection(COLECCION).document(reg_id)
        batch.update(ref, {"status": "cancelado", "cancelled_at": ts})
    batch.commit()
    logger.info(f"Sincronizados {len(df_actual)} productos, {len(cancelados)} marcados como cancelados")


def limpiar_alertas_vencidas(db: firestore.Client):
    now = datetime.now(timezone.utc)
    docs = db.collection("alerts").where("agent_id", "==", "agente_sag").where("expires_at", "<", now).stream()
    batch = db.batch()
    count = 0
    for doc in docs:
        batch.delete(doc.reference)
        count += 1
        if count % 500 == 0:
            batch.commit()
            batch = db.batch()
    if count % 500 != 0:
        batch.commit()
    logger.info(f"Alertas vencidas eliminadas: {count}")


def generar_alertas(db: firestore.Client, nuevos: set, cancelados: set, df_actual: pd.DataFrame):
    ts  = datetime.now(timezone.utc)
    col = db.collection("alerts")
    total = 0

    for reg_id in nuevos:
        fila = df_actual[df_actual[COL_REGISTRO].astype(str).str.strip() == reg_id]
        if fila.empty:
            continue
        row = fila.iloc[0]
        urgency  = 75
        priority = _urgency_to_priority(urgency)
        # ID determinista: misma ejecución sobre el mismo registro = mismo documento
        alert_id = f"sag_newsku_{reg_id}"
        col.document(alert_id).set({
            "type":        "REGULATORY",
            "subtype":     "NEWSKU",
            "title":       f"Nuevo registro SAG: {row.get(COL_NOMBRE, reg_id)}",
            "description": f"Competidor: {row.get(COL_IMPORTADOR, '')} | Fabricante: {row.get(COL_EMPRESA, '')}",
            "urgency":     urgency,
            "priority":    priority,
            "source":      "SAG",
            "agent_id":    "agente_sag",
            "data":        row.to_dict(),
            "status":      "active",
            "created_at":  ts,
            "expires_at":  _expires_at(priority, ts),
        })
        total += 1

    for reg_id in cancelados:
        urgency  = 90
        priority = _urgency_to_priority(urgency)
        alert_id = f"sag_cancel_{reg_id}"
        col.document(alert_id).set({
            "type":        "REGULATORY",
            "subtype":     "CANCELACION",
            "title":       f"Cancelación SAG: registro {reg_id}",
            "description": f"El registro {reg_id} ya no aparece en el listado oficial SAG",
            "urgency":     urgency,
            "priority":    priority,
            "source":      "SAG",
            "agent_id":    "agente_sag",
            "data":        {"registro": reg_id},
            "status":      "active",
            "created_at":  ts,
            "expires_at":  _expires_at(priority, ts),
        })
        total += 1

    logger.info(f"Alertas generadas: {total} ({len(nuevos)} nuevos, {len(cancelados)} cancelados)")
    return total
