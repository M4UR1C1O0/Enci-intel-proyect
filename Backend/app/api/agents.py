from fastapi import APIRouter, Depends
from app.dependencies.auth import require_roles

router = APIRouter()

roles_all = ["Admin", "Comercial", "Gerencia"]
roles_admin = ["Admin"]

@router.get("/")
def get_agents(user=Depends(require_roles(roles_all))):
    return {
        "success": True,
        "data": [
            {
                "id": "agent_isp_surveillance",
                "name": "Agente de Vigilancia ISP",
                "description": "Monitorea boletines, registros y aprobaciones del ISP.",
                "status": "running",
                "last_run_status": "success",
                "alerts_generated_today": 3,
                "schedule": "0 6 * * *"
            },
            {
                "id": "agent_customs_intelligence",
                "name": "Agente de Inteligencia Aduanera",
                "description": "Analiza importaciones, DIN mensuales y datos SAG.",
                "status": "waiting",
                "last_run_status": "success",
                "alerts_generated_today": 1,
                "schedule": "0 8 * * *"
            },
            {
                "id": "agent_competitive_monitoring",
                "name": "Agente de Monitoreo Competitivo",
                "description": "Monitorea noticias, LinkedIn y movimientos de competidores.",
                "status": "idle",
                "last_run_status": "success",
                "alerts_generated_today": 2,
                "schedule": "0 9 * * *"
            },
            {
                "id": "agent_price_benchmark",
                "name": "Agente de Benchmarking de Precios",
                "description": "Compara precios por SKU y detecta cambios relevantes.",
                "status": "running",
                "last_run_status": "success",
                "alerts_generated_today": 5,
                "schedule": "0 7 * * *"
            },
            {
                "id": "agent_alert_engine",
                "name": "Motor de Alertas Estratégicas",
                "description": "Clasifica eventos y prioriza alertas para el dashboard.",
                "status": "running",
                "last_run_status": "success",
                "alerts_generated_today": 6,
                "schedule": "*/30 * * * *"
            }
        ]
    }

@router.get("/{agent_id}")
def get_agent_detail(agent_id: str, user=Depends(require_roles(roles_all))):
    return {
        "success": True,
        "data": {
            "id": agent_id,
            "name": "Detalle de agente",
            "status": "running",
            "config": {
                "competitors": ["zoetis", "drag_pharma", "agrovet"],
                "alert_threshold_pct": 15,
                "keywords": ["antibiótico", "vacuna", "antiparasitario"],
                "notifications_enabled": True,
                "schedule": "0 8 * * *"
            },
            "stats": {
                "total_skus_tracked": 234,
                "alerts_last_7d": 12,
                "avg_run_duration_sec": 38,
                "success_rate_pct": 98.5
            }
        }
    }

@router.put("/{agent_id}/config")
def update_agent_config(agent_id: str, user=Depends(require_roles(roles_admin))):
    return {
        "success": True,
        "data": {
            "id": agent_id,
            "message": "Configuración actualizada correctamente",
            "updated_at": "2026-03-17T15:30:00Z"
        }
    }

@router.get("/{agent_id}/logs")
def get_agent_logs(agent_id: str, user=Depends(require_roles(["Admin", "Gerencia"]))):
    return {
        "success": True,
        "data": [
            {
                "run_id": "run_001",
                "agent_id": agent_id,
                "status": "success",
                "items_processed": 89,
                "alerts_generated": 3,
                "duration_sec": 42
            },
            {
                "run_id": "run_002",
                "agent_id": agent_id,
                "status": "success",
                "items_processed": 104,
                "alerts_generated": 5,
                "duration_sec": 51
            }
        ]
    }