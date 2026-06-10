from fastapi import APIRouter
from app.api.firestore_service import get_dashboard_summary as _get_summary

router = APIRouter()

@router.get("/summary")
async def dashboard_summary():
    return await _get_summary()