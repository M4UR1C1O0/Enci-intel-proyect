from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from firebase_admin import auth

from app.firebase_config import db
from app.api.auth import require_admin

router = APIRouter()

ROLES_VALIDOS = ["Admin", "Gerencia", "Comercial", "Pendiente"]


class UpdateRoleRequest(BaseModel):
    email: str
    role: str


@router.patch("/role")
def update_user_role(
    request: UpdateRoleRequest,
    current_user=Depends(require_admin)
):
    if request.role not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol no válido")

    try:
        user = auth.get_user_by_email(request.email)

        auth.set_custom_user_claims(
            user.uid,
            {"role": request.role}
        )

        db.collection("users").document(request.email).update({
            "role": request.role
        })

        return {
            "success": True,
            "message": "Rol actualizado correctamente",
            "data": {
                "email": request.email,
                "uid": user.uid,
                "role": request.role,
                "updated_by": current_user["email"],
            }
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo actualizar el rol: {str(error)}"
        )