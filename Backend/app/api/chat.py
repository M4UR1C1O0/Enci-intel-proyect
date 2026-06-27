import json
import os
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.rag import engine
from app.api.rate_limiter import check_and_increment

router = APIRouter()

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    species: str | None = None
    history: list[dict] | None = None
    language: str | None = "es"


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

    def safe_stream():
        try:
            for chunk in engine.query_stream(req.question, req.species, req.history, req.language):
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
