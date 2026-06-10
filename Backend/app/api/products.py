from fastapi import APIRouter, Depends
from app.dependencies.auth import require_roles

router = APIRouter()

roles_all = ["Admin", "Comercial", "Gerencia"]

@router.get("/")
def get_products(user=Depends(require_roles(roles_all))):
    return {
        "success": True,
        "data": [
            {
                "id": "prod_001",
                "name": "Producto real de backend",
                "category": "Antibiótico",
                "brand": "Encipharm",
                "price_clp": 12450,
                "stock": 84,
                "competitor_price_clp": 13990,
                "market_share_pct": 21.4
            },
            {
                "id": "prod_002",
                "name": "Ivermectina Plus",
                "category": "Antiparasitario",
                "brand": "Encipharm",
                "price_clp": 8750,
                "stock": 42,
                "competitor_price_clp": 9200,
                "market_share_pct": 16.7
            }
        ]
    }

@router.get("/{product_id}")
def get_product_detail(product_id: str, user=Depends(require_roles(roles_all))):
    return {
        "success": True,
        "data": {
            "id": product_id,
            "name": "Producto real de backend",
            "description": "Antibiótico veterinario de amplio espectro.",
            "category": "Antibiótico",
            "brand": "Encipharm",
            "price_clp": 12450,
            "stock": 84,
            "market_share_pct": 21.4,
            "competitors": [
                {
                    "brand": "Zoetis",
                    "price_clp": 13990
                },
                {
                    "brand": "Drag Pharma",
                    "price_clp": 13200
                }
            ]
        }
    }