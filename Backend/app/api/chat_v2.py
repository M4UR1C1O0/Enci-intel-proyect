import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.services.chat_service import handle_chat_query
from app.repositories.chat_repository import (
    get_sessions,
    get_session_messages,
    delete_user_history,
)

router = APIRouter()


# ── Modelos ──────────────────────────────────────────────────────────────────

class ChatQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    species: Optional[str] = Field(
        default=None,
        description="Especie: aves, porcinos, rumiantes, peces, canino, felino, equino"
    )
    category: Optional[str] = Field(
        default=None,
        description="Categoría terapéutica: antibiótico, antiparasitario, vacuna, etc."
    )
    session_id: Optional[str] = Field(
        default=None,
        description="ID de sesión existente para mantener contexto de conversación"
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/query")
async def chat_query(
    request: ChatQueryRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Envía una consulta al Consultor Veterinario IA.
    Responde en streaming SSE (text/event-stream).
    Cada token llega como: data: {"type": "token", "content": "..."}
    Al finalizar: data: {"type": "done", "session_id": "...", "context_used": true}
    """
    try:
        stream_generator, active_session_id = await handle_chat_query(
            question=request.question,
            user_id=current_user["uid"],
            species=request.species,
            category=request.category,
            session_id=request.session_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "LLM_UNAVAILABLE", "message": str(e)},
        )

    async def event_stream():
        try:
            async for token in stream_generator:
                data = json.dumps({"type": "token", "content": token}, ensure_ascii=False)
                yield f"data: {data}\n\n"
        except Exception as e:
            error = json.dumps({"type": "error", "message": str(e)})
            yield f"data: {error}\n\n"
        finally:
            done = json.dumps({
                "type": "done",
                "session_id": active_session_id,
                "context_used": True,
            })
            yield f"data: {done}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sessions")
async def get_chat_sessions(
    current_user: dict = Depends(get_current_user),
):
    """Lista las sesiones de conversación del usuario autenticado."""
    sessions = await get_sessions(user_id=current_user["uid"])
    return {
        "success": True,
        "data": sessions,
        "meta": {"total": len(sessions)},
    }


@router.get("/sessions/{session_id}/messages")
async def get_session_msgs(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Obtiene los mensajes de una sesión específica."""
    messages = await get_session_messages(session_id=session_id)
    return {
        "success": True,
        "data": messages,
        "meta": {"total": len(messages)},
    }


@router.delete("/history")
async def delete_history(
    current_user: dict = Depends(get_current_user),
):
    """Elimina todo el historial de chat del usuario autenticado."""
    deleted = await delete_user_history(user_id=current_user["uid"])
    return {
        "success": True,
        "data": {"deleted_count": deleted},
    }
