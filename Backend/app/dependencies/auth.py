import os
from pathlib import Path

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

bearer_scheme = HTTPBearer(auto_error=False)

DEFAULT_SERVICE_ACCOUNT_PATH = Path(__file__).resolve().parents[2] / "serviceAccountKey.json"

if not firebase_admin._apps:
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
    elif DEFAULT_SERVICE_ACCOUNT_PATH.exists():
        firebase_admin.initialize_app(credentials.Certificate(str(DEFAULT_SERVICE_ACCOUNT_PATH)))
    else:
        firebase_admin.initialize_app()

VALID_ROLES = {"Admin", "Comercial", "Gerencia"}


def get_role_from_claims(decoded_token: dict) -> str:
    role = decoded_token.get("role")
    if role in VALID_ROLES:
        return role
    return "Comercial"


async def get_current_user(
    credentials_data: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    if not credentials_data or credentials_data.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {"code": "UNAUTHORIZED", "message": "Bearer token ausente."},
            },
        )

    try:
        decoded_token = auth.verify_id_token(credentials_data.credentials)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "role": get_role_from_claims(decoded_token),
            "claims": decoded_token,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {"code": "UNAUTHORIZED", "message": "Token inválido o expirado."},
            },
        )


def require_roles(allowed_roles: list[str]):
    async def dependency(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {"code": "FORBIDDEN", "message": "No tienes permisos para este recurso."},
                },
            )
        return user

    return dependency