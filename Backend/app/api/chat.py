import json
import logging
import os
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.firebase_config import db as _sync_db
from app.rag import engine
from app.api.rate_limiter import check_and_increment

logger = logging.getLogger("chat")
router = APIRouter()


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    species: str | None = None
    history: list[dict] | None = None
    language: str | None = "es"
    alert_source: str | None = None  # "all" | "sag" | "competidores"


def _score_product(p: dict, keywords: list[str]) -> int:
    text = " ".join(str(v) for v in p.values()).lower()
    return sum(1 for kw in keywords if len(kw) > 2 and kw in text)


def _fetch_alerts_context(alert_source: str, question: str = "") -> str:
    sections: list[str] = []
    keywords = question.lower().split()

    # ── Alertas recientes ────────────────────────────────────────────────────
    q = _sync_db.collection("alerts").limit(30)
    if alert_source in ("sag", "competidores"):
        agent_id = "agente_sag" if alert_source == "sag" else "agente_competidores"
        q = q.where("agent_id", "==", agent_id)
    alert_docs = q.stream()
    lines = ["ALERTAS RECIENTES DEL SISTEMA:"]
    for doc in alert_docs:
        d = doc.to_dict()
        priority = str(d.get("priority") or d.get("urgency") or "").upper()
        title = d.get("title") or d.get("body") or ""
        desc = d.get("description") or d.get("body") or ""
        source = d.get("source") or d.get("agent_id") or ""
        lines.append(f"- [{priority}] {title} ({source}): {desc[:200]}")
    if len(lines) > 1:
        sections.append("\n".join(lines))
    else:
        sections.append("ALERTAS RECIENTES DEL SISTEMA: No hay alertas disponibles en este momento.")

    # ── Catálogo SAG: traer todos y filtrar por relevancia a la pregunta ─────
    if alert_source in ("sag", "all"):
        all_products = [doc.to_dict() for doc in _sync_db.collection("sag_productos").stream()]
        if all_products:
            if keywords:
                scored = sorted(all_products, key=lambda p: _score_product(p, keywords), reverse=True)
                relevant = [p for p in scored if _score_product(p, keywords) > 0][:60]
                products_to_show = relevant if relevant else all_products[:40]
            else:
                products_to_show = all_products[:40]

            lines = [f"CATÁLOGO SAG — PRODUCTOS COMPETIDORES ({len(all_products)} registros totales, mostrando {len(products_to_show)} relevantes):"]
            for p in products_to_show:
                nombre = p.get("Nombre comercial", "—")
                principio = p.get("Principio Activo") or p.get("Principios Activos") or p.get("Nombre genérico", "—")
                importador = p.get("Importador o Registrante", "—")
                especie = p.get("Especie") or p.get("Especies", "—")
                lines.append(f"- {nombre} | {principio} | {importador} | {especie}")
            sections.append("\n".join(lines))

    return "\n\n".join(sections)


def get_chat_user(request: Request, authorization: str | None = Header(default=None)) -> dict:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        try:
            from firebase_admin import auth as firebase_auth
            decoded = firebase_auth.verify_id_token(token, check_revoked=True)
            return {"uid": decoded["uid"], "email": decoded.get("email", "")}
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")
    if os.environ.get("CHAT_AUTH_REQUIRED", "true").lower() != "false":
        raise HTTPException(status_code=401, detail="Token no enviado")
    ip = request.client.host if request.client else "unknown"
    return {"uid": f"guest-{ip}"}


@router.post("/stream")
def chat_stream(req: ChatRequest, request: Request, authorization: str | None = Header(default=None)):
    user = get_chat_user(request, authorization)
    if not check_and_increment(user["uid"]):
        raise HTTPException(status_code=429, detail="Límite diario de consultas alcanzado.")

    alerts_context: str | None = None
    if req.alert_source:
        try:
            alerts_context = _fetch_alerts_context(req.alert_source, req.question)
        except Exception as e:
            logger.error(f"[chat/alerts] Error fetching alerts context: {e}")
            alerts_context = "ALERTAS RECIENTES DEL SISTEMA: Error temporal al obtener alertas."

    def safe_stream():
        try:
            for chunk in engine.query_stream(req.question, req.species, req.history, req.language, alerts_context):
                yield chunk
        except Exception:
            yield f"data: {json.dumps({'error': 'Error procesando la consulta.'})}\n\n"

    return StreamingResponse(safe_stream(), media_type="text/event-stream")


@router.post("/query")
def chat_query(req: ChatRequest, request: Request, authorization: str | None = Header(default=None)):
    user = get_chat_user(request, authorization)
    if not check_and_increment(user["uid"]):
        raise HTTPException(status_code=429, detail="Límite diario de consultas alcanzado.")
    result = engine.query(req.question, req.species, req.history)
    return {"success": True, "data": result}


@router.get("/docs-count")
def docs_count():
    if not engine._store:
        return {"success": True, "data": {"documents": 0}}
    return {"success": True, "data": {"documents": engine._store.document_count}}