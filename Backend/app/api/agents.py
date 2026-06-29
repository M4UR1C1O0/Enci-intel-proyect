from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from app.api.auth import require_admin
from app.api.rate_limiter import check_and_increment

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


@router.post("/{agent_id}/run")
async def run_agent_now(agent_id: str, admin=Depends(require_admin)):
    if not check_and_increment(f"agent_run:{admin['uid']}", limit=10, window="hour"):
        raise HTTPException(status_code=429, detail="Límite de ejecuciones alcanzado (10/hora).")
    import google.auth
    import google.auth.transport.requests
    import requests as http_requests

    doc = await db.collection("agents").document(agent_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Agente no encontrado")

    agent_data = doc.to_dict()
    if agent_data.get("status") == "idle" or agent_data.get("enabled") is False:
        raise HTTPException(status_code=400, detail="El agente está inactivo y no puede ejecutarse")

    try:
        creds, project = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de autenticación GCP: {e}")

    job_name = f"projects/{project}/locations/us-central1/jobs/agente-sag-scheduler-trigger"
    url = f"https://cloudscheduler.googleapis.com/v1/{job_name}:run"
    resp = http_requests.post(url, headers={"Authorization": f"Bearer {creds.token}"})

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Error al ejecutar scheduler: {resp.text}")

    return {"success": True, "message": "Scheduler iniciado correctamente"}


@router.get("/{agent_id}")
async def get_agent_detail(agent_id: str):
    doc = await db.collection("agents").document(agent_id).get()
    if not doc.exists:
        return {"success": False, "data": None}
    return {"success": True, "data": {"id": doc.id, **doc.to_dict()}}