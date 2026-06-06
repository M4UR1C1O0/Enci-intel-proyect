import os
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

bearer_scheme = HTTPBearer(auto_error=False)

if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()

def normalize_role(email: str | None) -> str:
    if not email:
        return "Comercial"

    if email == "admin@encipharm.cl":
        return "Admin"

    if email == "gerencia@encipharm.cl":
        return "Gerencia"

    return "Comercial"

async def get_current_user(
    credentials_data: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials_data or credentials_data.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Bearer token ausente.",
                },
            },
        )

    token = credentials_data.credentials

    try:
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get("email")
        uid = decoded_token.get("uid")
        role = normalize_role(email)

        return {
            "uid": uid,
            "email": email,
            "role": role,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Token inválido o expirado.",
                },
            },
        )

def require_roles(allowed_roles: list[str]):
    async def dependency(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "No tienes permisos para este recurso.",
                    },
                },
            )
        return user

    return dependency