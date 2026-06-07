import logging
from datetime import datetime, timezone
from google.cloud import firestore
import pandas as pd

logger = logging.getLogger("agente_sag.detector")

COL_REGISTRO = "Registro"
COL_NOMBRE   = "Nombre comercial"
COL_EMPRESA  = "Empresa Fabricante"
COL_IMPORTADOR = "Importador o Registrante"

COLECCION = "sag_productos"


def cargar_registros_previos(db: firestore.Client) -> dict:
    docs = db.collection(COLECCION).stream()
    return {doc.id: doc.to_dict() for doc in docs}


def detectar_cambios(df_actual: pd.DataFrame, previos: dict) -> tuple[set, set]:
    actuales_ids = set(df_actual[COL_REGISTRO].astype(str).str.strip().tolist())
    previos_ids  = set(previos.keys())
    nuevos      = actuales_ids - previos_ids
    cancelados  = previos_ids - actuales_ids
    return nuevos, cancelados


def sincronizar_productos(db: firestore.Client, df_actual: pd.DataFrame):
    batch = db.batch()
    ts = datetime.now(timezone.utc)
    for _, row in df_actual.iterrows():
        num = str(row[COL_REGISTRO]).strip()
        ref = db.collection(COLECCION).document(num)
        batch.set(ref, {**row.to_dict(), "updated_at": ts}, merge=True)
    batch.commit()
    logger.info(f"Sincronizados {len(df_actual)} productos en Firestore")


def generar_alertas(db: firestore.Client, nuevos: set, cancelados: set, df_actual: pd.DataFrame):
    ts  = datetime.now(timezone.utc)
    col = db.collection("alerts")
    total = 0

    for reg_id in nuevos:
        fila = df_actual[df_actual[COL_REGISTRO].astype(str).str.strip() == reg_id]
        if fila.empty:
            continue
        row = fila.iloc[0]
        col.add({
            "type":        "REGULATORY",
            "subtype":     "NEWSKU",
            "title":       f"Nuevo registro SAG: {row.get(COL_NOMBRE, reg_id)}",
            "description": f"Competidor: {row.get(COL_IMPORTADOR, '')} | Fabricante: {row.get(COL_EMPRESA, '')}",
            "urgency":     75,
            "source":      "SAG",
            "agent_id":    "agente_sag",
            "data":        row.to_dict(),
            "status":      "active",
            "created_at":  ts,
        })
        total += 1

    for reg_id in cancelados:
        col.add({
            "type":        "REGULATORY",
            "subtype":     "CANCELACION",
            "title":       f"Cancelación SAG: registro {reg_id}",
            "description": f"El registro {reg_id} ya no aparece en el listado oficial SAG",
            "urgency":     90,
            "source":      "SAG",
            "agent_id":    "agente_sag",
            "data":        {"registro": reg_id},
            "status":      "active",
            "created_at":  ts,
        })
        total += 1

    logger.info(f"Alertas generadas: {total} ({len(nuevos)} nuevos, {len(cancelados)} cancelados)")
    return total
