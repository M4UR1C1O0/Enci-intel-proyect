import os
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter()

_AUTH_REQUIRED = os.environ.get("CHAT_AUTH_REQUIRED", "true").lower() != "false"


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(request: LoginRequest):
    return {
        "success": True,
        "data": {
            "user": {
                "id": "user_001",
                "email": request.email,
                "role": "admin"
            },
            "token": "demo-token"
        }
    }


@router.get("/me")
def get_me():
    return {
        "success": True,
        "data": {
            "id": "user_001",
            "email": "admin@encipharm.cl",
            "role": "admin"
        }
    }


def require_admin(authorization: str | None = Header(default=None)):
    """Dependency that returns the current admin user or raises 401/403.
    In dev mode (CHAT_AUTH_REQUIRED=false) bypasses Firebase verification."""
    if not _AUTH_REQUIRED:
        return {"uid": "dev-local", "email": "dev@local.cl", "role": "Admin"}

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no enviado")

    token = authorization.replace("Bearer ", "")
    try:
        from firebase_admin import auth as firebase_auth
        decoded = firebase_auth.verify_id_token(token)
        uid   = decoded.get("uid")
        email = decoded.get("email", "")
        role  = decoded.get("role", "")
        if not role:
            try:
                from app.firebase_config import db
                doc = db.collection("users").document(email).get()
                role = doc.to_dict().get("role", "Pendiente") if doc.exists else "Pendiente"
            except Exception:
                role = "Pendiente"
        if role != "Admin":
            raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
        return {"uid": uid, "email": email, "role": role}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
