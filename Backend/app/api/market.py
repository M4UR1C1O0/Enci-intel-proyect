from fastapi import APIRouter

router = APIRouter()

@router.get("/share")
def get_market_share():
    return {
        "success": True,
        "data": {
            "period": "Q1-2026",
            "total_market_usd": 4200000,
            "competitors": [
                {"id": "encipharm", "name": "Encipharm", "share_pct": 34.0, "trend": "up"},
                {"id": "zoetis", "name": "Zoetis", "share_pct": 28.0, "trend": "down"},
                {"id": "drag_pharma", "name": "Drag Pharma", "share_pct": 21.0, "trend": "up"},
                {"id": "agrovet", "name": "Agrovet", "share_pct": 17.0, "trend": "stable"}
            ]
        }
    }


@router.get("/import-trends")
def get_import_trends():
    return {
        "success": True,
        "data": {
            "months": ["2026-01", "2026-02", "2026-03"],
            "series": [
                {
                    "competitor_id": "encipharm",
                    "competitor_name": "Encipharm",
                    "values_kg": [42000, 55000, 61000],
                    "trend_pct": 18.5
                },
                {
                    "competitor_id": "zoetis",
                    "competitor_name": "Zoetis",
                    "values_kg": [32000, 38000, 44000],
                    "trend_pct": 10.2
                },
                {
                    "competitor_id": "drag_pharma",
                    "competitor_name": "Drag Pharma",
                    "values_kg": [24000, 29000, 35000],
                    "trend_pct": 12.8
                }
            ],
            "source": "SAG_DIN",
            "last_updated": "2026-03-01T00:00:00Z"
        }
    }


@router.get("/positioning-matrix")
def get_positioning_matrix():
    return {
        "success": True,
        "data": {
            "axes": {
                "x": {"label": "Velocidad Regulatoria ISP", "unit": "días promedio"},
                "y": {"label": "Precio Promedio de Portafolio", "unit": "CLP"}
            },
            "points": [
                {"competitor_id": "encipharm", "name": "Encipharm", "x": 45, "y": 18500, "size": 34},
                {"competitor_id": "zoetis", "name": "Zoetis", "x": 70, "y": 24500, "size": 28},
                {"competitor_id": "drag_pharma", "name": "Drag Pharma", "x": 58, "y": 21000, "size": 21},
                {"competitor_id": "agrovet", "name": "Agrovet", "x": 62, "y": 19800, "size": 17}
            ]
        }
    }