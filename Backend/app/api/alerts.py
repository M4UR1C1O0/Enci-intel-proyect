from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_alerts():
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