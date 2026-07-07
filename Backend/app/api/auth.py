import os
from fastapi import Header, HTTPException


def require_admin(authorization: str | None = Header(default=None)):
    """Dependency that returns the current admin user or raises 401/403.
    In dev mode (ADMIN_AUTH_REQUIRED=false) bypasses Firebase verification.
    Uses its own env var (separate from CHAT_AUTH_REQUIRED) so disabling
    guest chat access can't accidentally leave the admin panel unprotected."""
    auth_required = os.environ.get("ADMIN_AUTH_REQUIRED", "true").lower() != "false"
    if not auth_required:
        return {"uid": "dev-local", "email": "dev@local.cl", "role": "Admin"}

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no enviado")

    token = authorization.replace("Bearer ", "")
    try:
        from firebase_admin import auth as firebase_auth
        decoded = firebase_auth.verify_id_token(token, check_revoked=True)
        uid   = decoded.get("uid")
        email = decoded.get("email", "")
        role  = decoded.get("role", "")
        if not role:
            try:
                from app.firebase_config import db
                doc = db.collection("users").document(uid).get()
                role = doc.to_dict().get("rol", "") if doc.exists else ""
            except Exception:
                role = ""
        if role.lower() not in ("admin", "administrador"):
            raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
        return {"uid": uid, "email": email, "role": role}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
