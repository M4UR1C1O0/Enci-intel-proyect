import sys
import logging
import argparse
from datetime import datetime, timezone

sys.path.insert(0, "agents/agent-competidores")

from firestore_session import get_db
from scraper import scrape_drag_pharma, scrape_drag_pharma_noticias
from detector import (
    cargar_productos_previos,
    cargar_noticias_previas,
    detectar_productos_nuevos,
    detectar_noticias_nuevas,
    sincronizar_productos,
    sincronizar_noticias,
    generar_alertas,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("agente_competidores")


def main(dry_run: bool = False, populate_only: bool = False, force_alerts: bool = False):
    ts = datetime.now(timezone.utc)

    if dry_run:
        logger.info("=== MODO DRY-RUN: solo scraping, sin Firestore ===")

        logger.info("Scrapeando productos Drag Pharma...")
        productos = scrape_drag_pharma()
        logger.info(f"  {len(productos)} productos encontrados")

        logger.info("Scrapeando noticias Drag Pharma...")
        noticias = scrape_drag_pharma_noticias()
        logger.info(f"  {len(noticias)} noticias encontradas")

        print("\n========== PRODUCTOS ==========")
        for p in sorted(productos, key=lambda x: x["categoria"]):
            print(f"  [{p['categoria']}] {p['nombre']} | {', '.join(p['especies'])}")

        print("\n========== NOTICIAS ==========")
        for n in noticias:
            print(f"  [{n['fecha']}] {n['titulo']}")

        print(f"\nTotal: {len(productos)} productos, {len(noticias)} noticias")
        print("En producción se generarían alertas solo para los que sean NUEVOS vs. Firestore.")
        return

    db = get_db()

    if populate_only:
        logger.info("=== MODO POPULATE-ONLY: sin generación de alertas ===")

    run_ref = None
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
        "description": "Monitoreo web de productos y noticias de Drag Pharma",
    }, merge=True)

    try:
        logger.info("Scrapeando productos Drag Pharma...")
        productos = scrape_drag_pharma()
        logger.info(f"  {len(productos)} productos encontrados")

        logger.info("Scrapeando noticias Drag Pharma...")
        noticias = scrape_drag_pharma_noticias()
        logger.info(f"  {len(noticias)} noticias encontradas")

        if force_alerts:
            logger.info("=== MODO FORCE-ALERTS: tratando todo como nuevo ===")
            previos_productos = {}
            previas_noticias  = {}
        else:
            logger.info("Cargando estado previo de Firestore...")
            previos_productos = cargar_productos_previos(db)
            previas_noticias  = cargar_noticias_previas(db)

        nuevos_productos = detectar_productos_nuevos(productos, previos_productos)
        nuevas_noticias  = detectar_noticias_nuevas(noticias, previas_noticias)

        logger.info("Sincronizando productos...")
        sincronizar_productos(db, productos)

        logger.info("Sincronizando noticias...")
        sincronizar_noticias(db, noticias)

        total_alertas = 0
        if not populate_only:
            logger.info("Generando alertas...")
            total_alertas = generar_alertas(db, nuevos_productos, nuevas_noticias)
        else:
            logger.info("Populate-only: omitiendo generación de alertas")

        run_ref.update({
            "status":        "success",
            "ended_at":      datetime.now(timezone.utc),
            "nuevos":        len(nuevos_productos) + len(nuevas_noticias),
            "cancelados":    0,
            "total_alertas": total_alertas,
        })
        db.collection("agents").document("agente_competidores").set({
            "status": "active",
            "last_result": {
                "nuevos":        len(nuevos_productos) + len(nuevas_noticias),
                "cancelados":    0,
                "total_alertas": total_alertas,
            }
        }, merge=True)

        logger.info(
            f"Agente completado: {len(nuevos_productos)} productos nuevos, "
            f"{len(nuevas_noticias)} noticias nuevas, {total_alertas} alertas"
        )

    except Exception as e:
        logger.error(f"Error en agente competidores: {e}")
        if run_ref:
            run_ref.update({
                "status":   "failure",
                "error":    str(e),
                "ended_at": datetime.now(timezone.utc),
            })
            db.collection("agents").document("agente_competidores").set({
                "status":     "error",
                "last_error": str(e),
            }, merge=True)
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run",       action="store_true", help="Muestra qué haría sin escribir en Firestore")
    parser.add_argument("--populate-only", action="store_true", help="Pobla Firestore sin generar alertas")
    parser.add_argument("--force-alerts",  action="store_true", help="Fuerza generación de alertas para pruebas")
    args = parser.parse_args()

    main(dry_run=args.dry_run, populate_only=args.populate_only, force_alerts=args.force_alerts)