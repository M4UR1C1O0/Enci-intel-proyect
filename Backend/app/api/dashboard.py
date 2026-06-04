from fastapi import APIRouter

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary():
    return {
        "success": True,
        "data": {
            "agents": {
                "total": 5,
                "running": 5,
                "waiting": 1,
                "idle": 1
            },
            "alerts": {
                "unread_count": 17,
                "critical_count": 4
            },
            "market": {
                "encipharm_share_pct": 34.2,
                "trend": "up"
            }
        }
    }