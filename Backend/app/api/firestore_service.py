from google.cloud import firestore
from datetime import datetime

_db = None

def get_db():
    global _db
    if _db is None:
        _db = firestore.AsyncClient()
    return _db

async def get_dashboard_summary() -> dict:
    db = get_db()
    # ── Alertas: TODAS sin filtro de estado ──────────────────────────────────
    alerts = [
        d.to_dict()
        async for d in db.collection("alerts").stream()
    ]

    # Criticidad numérica según resolveCriticality()
    # critical >= 80, high >= 60, medium >= 35, low < 35
    def get_urgency(a: dict) -> int:
        u = a.get("urgency")
        if isinstance(u, (int, float)):
            return int(u)
        # fallback al campo legacy priority
        return {"critical": 90, "high": 70, "medium": 50, "low": 20}.get(
            str(a.get("priority", "")).lower(), 0
        )

    critical_count = sum(1 for a in alerts if get_urgency(a) >= 80)
    high_count     = sum(1 for a in alerts if 60 <= get_urgency(a) < 80)
    unread_count   = sum(1 for a in alerts if not a.get("leida", False))

    # Tipo de la alerta más reciente
    def parse_ts(a: dict):
        ts = a.get("created_at") or a.get("timestamp")
        if isinstance(ts, datetime):
            return ts
        return datetime.min

    latest_alert     = max(alerts, key=parse_ts, default=None)
    last_alert_type  = latest_alert.get("type", "") if latest_alert else ""

    # ── Agentes ──────────────────────────────────────────────────────────────
    agents = [
        d.to_dict()
        async for d in db.collection("agents").stream()
    ]

    estados_activos = {"running", "active"}

    # Última ejecución desde agent_runs
    agent_runs = [
        d.to_dict()
        async for d in db.collection("agent_runs")
        .order_by("started_at", direction=firestore.Query.DESCENDING)
        .limit(1)
        .stream()
    ]

    last_run_ts = ""
    if agent_runs:
        ts = agent_runs[0].get("started_at") or agent_runs[0].get("timestamp")
        if isinstance(ts, datetime):
            last_run_ts = ts.strftime("%Y-%m-%d %H:%M")

    # ── Oportunidades: alertas no leídas de tipo LAUNCH o PRICE ─────────────
    opp_alerts = [
        a for a in alerts
        if a.get("type") in ("LAUNCH", "PRICE") and not a.get("leida", False)
    ]
    opportunities_count = len(opp_alerts)

    # Categoría con más oportunidades
    from collections import Counter
    cats = [a.get("category") or a.get("raw_data", {}).get("category", "") for a in opp_alerts]
    cats = [c for c in cats if c]
    top_category = Counter(cats).most_common(1)[0][0] if cats else ""

    return {
        "success": True,
        "data": {
            "agents": {
                "total":    len(agents),
                "running":  sum(1 for a in agents if a.get("status") in estados_activos),
                "idle":     sum(1 for a in agents if a.get("status") == "idle"),
                "waiting":  sum(1 for a in agents if a.get("status") == "waiting"),
                "last_run": last_run_ts,
            },
            "alerts": {
                "unread_count":    unread_count,
                "critical_count":  critical_count,
                "high_count":      high_count,
                "last_alert_type": last_alert_type,
            },
            "market": {
                "encipharm_share_pct": 0,   # placeholder hasta tener fuente de datos
                "trend":               "estable",
                "trend_delta":         None,
                "leading_competitor":  "",
            },
            "opportunities_count":        opportunities_count,
            "opportunities_top_category": top_category,
        }
    }