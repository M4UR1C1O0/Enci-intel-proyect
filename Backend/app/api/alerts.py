from fastapi import APIRouter, Depends
from app.dependencies.auth import require_roles

router = APIRouter()

roles_all = ["Admin", "Comercial", "Gerencia"]

@router.get("/")
def get_alerts(user=Depends(require_roles(roles_all))):
    return {
        "success": True,
        "data": [
            {
                "id": "alert_001",
                "title": "Zoetis redujo Cefalexina un 12%",
                "priority": "high",
                "read": False
            }
        ]
    }