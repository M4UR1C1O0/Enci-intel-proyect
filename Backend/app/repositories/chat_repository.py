import os
from datetime import datetime, timezone
from typing import Optional
import firebase_admin
from firebase_admin import firestore
from google.cloud.firestore_v1 import AsyncClient

FIREBASE_PROJECT = os.getenv("FIREBASE_PROJECT_ID", "enci-intel-b48da")


def _get_db() -> AsyncClient:
    """Retorna el cliente async de Firestore."""
    return firestore.AsyncClient(project=FIREBASE_PROJECT)


async def get_recent_alerts(limit: int = 10) -> list[dict]:
    """Obtiene las últimas alertas de Firestore para inyectar como contexto."""
    db = _get_db()
    try:
        query = (
            db.collection("alerts")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        docs = await query.get()
        return [doc.to_dict() | {"id": doc.id} for doc in docs]
    except Exception:
        return []


async def get_recent_products(limit: int = 5) -> list[dict]:
    """Obtiene los productos más recientes de Firestore para contexto."""
    db = _get_db()
    try:
        query = db.collection("products").limit(limit)
        docs = await query.get()
        return [doc.to_dict() | {"id": doc.id} for doc in docs]
    except Exception:
        return []


async def create_session(user_id: str, title: str = "Nueva conversación") -> str:
    """Crea una nueva sesión de chat y retorna el session_id."""
    db = _get_db()
    ref = db.collection("chat_sessions").document()
    await ref.set({
        "user_id": user_id,
        "title": title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return ref.id


async def save_message(
    session_id: str,
    user_id: str,
    role: str,  # "user" | "assistant"
    content: str,
    species: Optional[str] = None,
) -> str:
    """Persiste un mensaje en la colección chatmessages."""
    db = _get_db()
    ref = db.collection("chat_messages").document()
    await ref.set({
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": content,
        "species": species,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return ref.id


async def get_sessions(user_id: str, limit: int = 20) -> list[dict]:
    """Lista las sesiones de chat del usuario."""
    db = _get_db()
    try:
        query = (
            db.collection("chat_sessions")
            .where("user_id", "==", user_id)
            .order_by("updated_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        docs = await query.get()
        return [doc.to_dict() | {"id": doc.id} for doc in docs]
    except Exception:
        return []


async def get_session_messages(session_id: str, limit: int = 50) -> list[dict]:
    """Lista los mensajes de una sesión."""
    db = _get_db()
    try:
        query = (
            db.collection("chat_messages")
            .where("session_id", "==", session_id)
            .order_by("created_at")
            .limit(limit)
        )
        docs = await query.get()
        return [doc.to_dict() | {"id": doc.id} for doc in docs]
    except Exception:
        return []


async def delete_user_history(user_id: str) -> int:
    """Elimina todos los mensajes del usuario. Retorna cantidad eliminada."""
    db = _get_db()
    query = db.collection("chat_messages").where("user_id", "==", user_id)
    docs = await query.get()
    count = 0
    for doc in docs:
        await doc.reference.delete()
        count += 1
    return count
