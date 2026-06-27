import sys
import logging
import argparse
from datetime import datetime, timezone

sys.path.insert(0, "agents/agent-competidores")

from firestore_session import get_db
from scraper import scrape_drag_pharma_noticias
from detector import (
    cargar_noticias_previas,
    detectar_noticias_nuevas,
    sincronizar_noticias,
    generar_alertas,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("agente_competidores")


def main(dry_run: bool = False, populate_only: bool = False, force_alerts: bool = False):
    ts = datetime.now(timezone.utc)

    if dry_run:
        logger.info("=== MODO DRY-RUN: solo scraping, sin Firestore ===")
        noticias = scrape_drag_pharma_noticias()
        print(f"\n========== NOTICIAS ({len(noticias)}) ==========")
        for n in noticias:
            print(f"  [{n['fecha']}] {n['titulo']}")
            print(f"           {n['url']}")
        return

    db = get_db()

    run_ref = db.collection("agent_runs").document()
    run_ref.set({
        "agent_id":   "agente_competidores",
        "status":     "running",
        "started_at": ts,
    })
    db.collection("agents").document("agente_competidores").set({
        "status":      "running",
        "last_run":    ts,
        "name":        "Agente Competidores",
        "description": "Monitoreo de noticias de Drag Pharma",
    }, merge=True)

    try:
        logger.info("Scrapeando noticias Drag Pharma...")
        noticias = scrape_drag_pharma_noticias()
        logger.info(f"  {len(noticias)} noticias encontradas")

        if force_alerts:
            logger.info("=== MODO FORCE-ALERTS: tratando todo como nuevo ===")
            previas = {}
        else:
            previas = cargar_noticias_previas(db)

        nuevas = detectar_noticias_nuevas(noticias, previas)
        logger.info(f"  {len(nuevas)} noticias nuevas")

        sincronizar_noticias(db, noticias)

        total_alertas = 0
        if not populate_only:
            total_alertas = generar_alertas(db, nuevas)
        else:
            logger.info("Populate-only: omitiendo generación de alertas")

        run_ref.update({
            "status":        "success",
            "ended_at":      datetime.now(timezone.utc),
            "nuevos":        len(nuevas),
            "total_alertas": total_alertas,
        })
        db.collection("agents").document("agente_competidores").set({
            "status": "active",
            "last_result": {"nuevos": len(nuevas), "total_alertas": total_alertas},
        }, merge=True)

        logger.info(f"Agente completado: {len(nuevas)} noticias nuevas, {total_alertas} alertas")

    except Exception as e:
        logger.error(f"Error en agente competidores: {e}")
        run_ref.update({"status": "failure", "error": str(e), "ended_at": datetime.now(timezone.utc)})
        db.collection("agents").document("agente_competidores").set({"status": "error", "last_error": str(e)}, merge=True)
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",       action="store_true")
    parser.add_argument("--populate-only", action="store_true")
    parser.add_argument("--force-alerts",  action="store_true")
    args = parser.parse_args()
    main(dry_run=args.dry_run, populate_only=args.populate_only, force_alerts=args.force_alerts)