from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    species: str | None = None


@router.post("/query")
def chat_query(request: ChatRequest):
    return {
        "success": True,
        "data": {
            "question": request.question,
            "species": request.species,
            "answer": (
                "Respuesta simulada IA: "
                "Se recomienda revisar ficha técnica, "
                "especie objetivo, normativa vigente y "
                "protocolos clínicos asociados."
            ),
            "sources": [
                {
                    "title": "Ficha técnica veterinaria",
                    "type": "document"
                },
                {
                    "title": "Guía clínica SAG",
                    "type": "regulation"
                }
            ]
        }
    }


@router.get("/history")
def get_chat_history():
    return {
        "success": True,
        "data": [
            {
                "question": "¿Qué antibiótico usar para bovinos?",
                "species": "Rumiantes",
                "answer": "Respuesta IA simulada.",
                "created_at": "2026-03-17T10:00:00Z"
            },
            {
                "question": "¿Cómo prevenir Salmonella en aves?",
                "species": "Aves",
                "answer": "Respuesta IA simulada.",
                "created_at": "2026-03-17T11:20:00Z"
            }
        ]
    }