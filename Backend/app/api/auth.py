from fastapi import APIRouter, Header, HTTPException, Depends
from firebase_admin import auth as firebase_auth

from app.firebase_config import db

router = APIRouter()


def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token no enviado")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Formato de token inválido")

    token = authorization.replace("Bearer ", "")

    try:
        decoded_token = firebase_auth.verify_id_token(token)

        email = decoded_token.get("email")
        uid = decoded_token.get("uid")
        role = decoded_token.get("role")

        if not role and email:
            user_doc = db.collection("users").document(email).get()
            if user_doc.exists:
                role = user_doc.to_dict().get("role", "Pendiente")
            else:
                role = "Pendiente"

        return {
            "uid": uid,
            "email": email,
            "role": role,
        }

    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


def require_admin(current_user=Depends(get_current_user)):
    if current_user["role"] != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")

    return current_user


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "success": True,
        "data": current_user,
    }