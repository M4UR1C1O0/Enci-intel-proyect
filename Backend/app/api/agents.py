from fastapi import APIRouter, Depends, HTTPException
from google.cloud import firestore
from pydantic import BaseModel
from app.api.auth import require_admin
from app.api.rate_limiter import check_and_increment
from app.api import cache as _cache

router = APIRouter()
db = firestore.AsyncClient()


@router.get("/")
async def get_agents():
    cached = _cache.get("agents")
    if cached:
        return cached
    agents = [
        {"id": doc.id, **doc.to_dict()}
        async for doc in db.collection("agents").stream()
    ]
    result = {"success": True, "data": agents}
    _cache.set("agents", result, ttl=60)
    return result


@router.get("/{agent_id}/runs")
async def get_agent_runs(agent_id: str, limit: int = 10):
    cache_key = f"agent_runs:{agent_id}:{limit}"
    cached = _cache.get(cache_key)
    if cached:
        return cached
    runs = []
    query = (
        db.collection("agent_runs")
        .where("agent_id", "==", agent_id)
        .order_by("started_at", direction=firestore.Query.DESCENDING)
        .limit(limit)
    )
    async for doc in query.stream():
        run = doc.to_dict()
        for campo in ("started_at", "ended_at"):
            if campo in run and run[campo]:
                try:
                    run[campo] = run[campo].isoformat()
                except Exception:
                    pass
        runs.append({"id": doc.id, **run})
    result = {"success": True, "data": runs}
    _cache.set(cache_key, result, ttl=30)
    return result


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

    job_name = _get_scheduler_job_name(project, agent_id)
    url = f"https://cloudscheduler.googleapis.com/v1/{job_name}:run"
    resp = http_requests.post(url, headers={"Authorization": f"Bearer {creds.token}"})

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Error al ejecutar scheduler: {resp.text}")

    return {"success": True, "message": "Scheduler iniciado correctamente"}


class ScheduleUpdate(BaseModel):
    schedule: str


def _get_scheduler_job_name(project: str, agent_id: str) -> str:
    job_id = agent_id.replace("_", "-")
    return f"projects/{project}/locations/us-central1/jobs/{job_id}-scheduler-trigger"


@router.patch("/{agent_id}/schedule")
async def update_agent_schedule(agent_id: str, body: ScheduleUpdate, admin=Depends(require_admin)):
    parts = body.schedule.strip().split()
    if len(parts) != 5:
        raise HTTPException(status_code=400, detail="El schedule debe ser una expresión cron de 5 campos.")

    import google.auth
    import google.auth.transport.requests
    import requests as http_requests

    doc = await db.collection("agents").document(agent_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Agente no encontrado")

    try:
        creds, project = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de autenticación GCP: {e}")

    job_name = _get_scheduler_job_name(project, agent_id)
    url = f"https://cloudscheduler.googleapis.com/v1/{job_name}?updateMask=schedule"
    resp = http_requests.patch(
        url,
        headers={"Authorization": f"Bearer {creds.token}"},
        json={"schedule": body.schedule},
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Error al actualizar schedule: {resp.text}")

    await db.collection("agents").document(agent_id).set(
        {"schedule": body.schedule}, merge=True
    )

    return {"success": True, "schedule": body.schedule}


@router.patch("/{agent_id}/enabled")
async def toggle_agent(agent_id: str, admin=Depends(require_admin)):
    import google.auth
    import google.auth.transport.requests
    import requests as http_requests

    doc = await db.collection("agents").document(agent_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Agente no encontrado")

    enabled = not doc.to_dict().get("enabled", True)

    try:
        creds, project = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de autenticación GCP: {e}")

    job_name = _get_scheduler_job_name(project, agent_id)
    action = "resume" if enabled else "pause"
    url = f"https://cloudscheduler.googleapis.com/v1/{job_name}:{action}"
    resp = http_requests.post(url, headers={"Authorization": f"Bearer {creds.token}"})

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Error al {action} scheduler: {resp.text}")

    await db.collection("agents").document(agent_id).set(
        {"enabled": enabled, "status": "active" if enabled else "idle"}, merge=True
    )

    return {"success": True, "enabled": enabled}


@router.get("/{agent_id}")
async def get_agent_detail(agent_id: str):
    doc = await db.collection("agents").document(agent_id).get()
    if not doc.exists:
        return {"success": False, "data": None}
    return {"success": True, "data": {"id": doc.id, **doc.to_dict()}}