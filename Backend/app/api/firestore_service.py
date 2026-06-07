from google.cloud import firestore

db = firestore.AsyncClient()

async def get_dashboard_summary() -> dict:
    # Leer alertas activas
    alerts = [
        d.to_dict()
        async for d in db.collection("alerts")
        .where("estado", "==", "activa")
        .stream()
    ]

    # Leer agentes
    agents = [
        d.to_dict()
        async for d in db.collection("agents").stream()
    ]

    return {
        "success": True,
        "data": {
            "agents": {
                "total":   len(agents),
                "running": sum(1 for a in agents if a.get("status") == "running"),
                "idle":    sum(1 for a in agents if a.get("status") == "idle"),
                "waiting": sum(1 for a in agents if a.get("status") == "waiting"),
            },
            "alerts": {
                "unread_count":   sum(1 for a in alerts if not a.get("leida", False)),
                "critical_count": sum(1 for a in alerts if a.get("urgency") == "alta"),
            },
            "market": {
                "encipharm_share_pct": 0,  # placeholder
                "trend": "estable",
            }
        }
    }