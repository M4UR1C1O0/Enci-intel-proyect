import sys
import logging
from datetime import datetime, timezone

sys.path.insert(0, 'agents/agent-sag')

from firestore_session import get_db
from scraper import descargar_registros_sag
from detector import cargar_registros_previos, detectar_cambios, sincronizar_productos, generar_alertas, limpiar_alertas_vencidas

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger("agente_sag")

def main():
    db = get_db()
    ts = datetime.now(timezone.utc)

    # Registrar inicio en agent_runs
    run_ref = db.collection("agent_runs").document()
    run_ref.set({
        "agent_id":   "agente_sag",
        "status":     "running",
        "started_at": ts,
    })

    # Actualizar estado en agents
    db.collection("agents").document("agente_sag").set({
        "status":      "running",
        "last_run":    ts,
        "name":        "Agente SAG",
        "description": "Monitoreo de registros SAG de productos",
    }, merge=True)

    try:
        logger.info("Descargando registros SAG...")
        df = descargar_registros_sag()

        logger.info("Cargando previos de Firestore...")
        previos = cargar_registros_previos(db)

        logger.info("Detectando cambios...")
        nuevos, cancelados = detectar_cambios(df, previos)

        logger.info("Sincronizando productos...")
        sincronizar_productos(db, df, cancelados)

        try:
            logger.info("Limpiando alertas vencidas...")
            limpiar_alertas_vencidas(db)
        except Exception as e_limp:
            logger.warning(f"Limpieza de alertas omitida: {e_limp}")

        logger.info("Generando alertas...")
        total_alertas = generar_alertas(db, nuevos, cancelados, df)

        # Registrar éxito
        run_ref.update({
            "status":          "success",
            "ended_at":        datetime.now(timezone.utc),
            "nuevos":          len(nuevos),
            "cancelados":      len(cancelados),
            "total_alertas":   total_alertas,
        })

        db.collection("agents").document("agente_sag").set({
            "status":      "active",
            "last_run":    ts,
            "last_result": {
                "nuevos":        len(nuevos),
                "cancelados":    len(cancelados),
                "total_alertas": total_alertas,
            }
        }, merge=True)

        logger.info(f"Agente SAG completado: {len(nuevos)} nuevos, {len(cancelados)} cancelados, {total_alertas} alertas")

    except Exception as e:
        logger.error(f"Error en agente SAG: {e}")
        run_ref.update({
            "status":   "failure",
            "error":    str(e),
            "ended_at": datetime.now(timezone.utc),
        })
        db.collection("agents").document("agente_sag").set({
            "status": "error",
            "last_error": str(e),
        }, merge=True)
        raise

if __name__ == "__main__":
    main()