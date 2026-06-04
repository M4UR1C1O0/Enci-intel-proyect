from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    dashboard,
    alerts,
    agents,
    products,
    market,
    chat,
)

app = FastAPI(
    title="Enci-Intel API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://enci-intel-frontend.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dashboard
app.include_router(
    dashboard.router,
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)

# Alerts
app.include_router(
    alerts.router,
    prefix="/api/v1/alerts",
    tags=["Alerts"]
)

# Agents
app.include_router(
    agents.router,
    prefix="/api/v1/agents",
    tags=["Agents"]
)

# Products
app.include_router(
    products.router,
    prefix="/api/v1/products",
    tags=["Products"]
)

# Market
app.include_router(
    market.router,
    prefix="/api/v1/market",
    tags=["Market"]
)

# Chat
app.include_router(
    chat.router,
    prefix="/api/v1/chat",
    tags=["Chat"]
)

# Health Check
@app.get("/health")
def health():
    return {
        "success": True,
        "status": "ok"
    }
# Chat
app.include_router(
    chat.router,
    prefix="/api/v1/chat",
    tags=["Chat"]
)

@app.get("/")
def root():
    return {
        "message": "Enci-Intel Backend funcionando"
    }
