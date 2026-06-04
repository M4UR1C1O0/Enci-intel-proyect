from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(request: LoginRequest):
    return {
        "success": True,
        "data": {
            "user": {
                "id": "user_001",
                "email": request.email,
                "role": "admin"
            },
            "token": "demo-token"
        }
    }

@router.get("/me")
def get_me():
    return {
        "success": True,
        "data": {
            "id": "user_001",
            "email": "admin@encipharm.cl",
            "role": "admin"
        }
    }