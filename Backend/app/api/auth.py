from typing import Literal

from firebase_admin import auth as firebase_auth
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import VALID_ROLES, get_current_user, require_roles

router = APIRouter()


class RoleUpdateRequest(BaseModel):
    role: Literal["Admin", "Comercial", "Gerencia"]


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    return {
        "success": True,
        "data": user,
    }


@router.get("/roles")
def get_roles(user=Depends(get_current_user)):
    return {
        "success": True,
        "data": {
            "roles": sorted(VALID_ROLES),
            "default_role": "Comercial",
        },
    }


@router.put("/users/by-email/{email}/role")
def update_user_role_by_email(
    email: str,
    payload: RoleUpdateRequest,
    user=Depends(require_roles(["Admin"])),
):
    try:
        user_record = firebase_auth.get_user_by_email(email)
        firebase_auth.set_custom_user_claims(user_record.uid, {"role": payload.role})
        return {
            "success": True,
            "data": {
                "uid": user_record.uid,
                "email": user_record.email,
                "role": payload.role,
            },
        }
    except firebase_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "USER_NOT_FOUND",
                    "message": "No se encontró un usuario con ese correo.",
                },
            },
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "ROLE_UPDATE_FAILED",
                    "message": "No se pudo actualizar el rol del usuario.",
                },
            },
        )