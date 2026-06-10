from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth

from app.dependencies.auth import require_roles, VALID_ROLES

router = APIRouter(prefix="/admin", tags=["admin"])


class RoleAssign(BaseModel):
    uid: str
    role: str


@router.post("/set-role")
async def set_role(payload: RoleAssign, user=Depends(require_roles(["Admin"]))):
    if payload.role not in VALID_ROLES:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": {"code": "INVALID_ROLE", "message": "Role inválido."}},
        )
    try:
        firebase_auth.set_custom_user_claims(payload.uid, {"role": payload.role})
        return {"success": True, "uid": payload.uid, "role": payload.role}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": {"code": "INTERNAL_ERROR", "message": str(e)}},
        )
