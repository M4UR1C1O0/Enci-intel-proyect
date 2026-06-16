from fastapi import APIRouter
from google.cloud import firestore

router = APIRouter()
db = firestore.AsyncClient()


@router.get("/")
async def get_agents():
    agents = [
        {"id": doc.id, **doc.to_dict()}
        async for doc in db.collection("agents").stream()
    ]
    return {"success": True, "data": agents}


@router.get("/{agent_id}/runs")
async def get_agent_runs(agent_id: str, limit: int = 10):
    runs = []
    query = (
        db.collection("agent_runs")
        .where("agent_id", "==", agent_id)
        .order_by("started_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
    )
    async for doc in query.stream():
        run = doc.to_dict()
        # Convertir timestamps a string ISO
        for campo in ("started_at", "ended_at"):
            if campo in run and run[campo]:
                try:
                    run[campo] = run[campo].isoformat()
                except Exception:
                    pass
        runs.append({"id": doc.id, **run})
    return {"success": True, "data": runs}


@router.get("/{agent_id}")
async def get_agent_detail(agent_id: str):
    doc = await db.collection("agents").document(agent_id).get()
    if not doc.exists:
        return {"success": False, "data": None}
    return {"success": True, "data": {"id": doc.id, **doc.to_dict()}}