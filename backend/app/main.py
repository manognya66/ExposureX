"""ExposureX - Continuous Exposure Management & Risk Intelligence Platform
Main FastAPI Application Entrypoint
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.websocket.manager import pulse_manager

# Import API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.assets import router as assets_router
from app.api.v1.identities import router as identities_router
from app.api.v1.credentials import router as credentials_router
from app.api.v1.vulnerabilities import router as vulns_router
from app.api.v1.findings import router as findings_router
from app.api.v1.cases import router as cases_router
from app.api.v1.risk import router as risk_router
from app.api.v1.vendors import router as vendors_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.providers import router as providers_router
from app.api.v1.audit import router as audit_router
from app.api.v1.scope import router as scope_router
from app.api.v1.search import router as search_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize schema
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ExposureX Continuous Exposure Management and Risk Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Endpoint for Real-time Security Pulse
@app.websocket("/ws/pulse")
async def websocket_pulse_endpoint(websocket: WebSocket):
    await pulse_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for ping/pong or client acknowledgments
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        pulse_manager.disconnect(websocket)
    except Exception:
        pulse_manager.disconnect(websocket)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(assets_router, prefix=settings.API_V1_STR)
app.include_router(identities_router, prefix=settings.API_V1_STR)
app.include_router(credentials_router, prefix=settings.API_V1_STR)
app.include_router(vulns_router, prefix=settings.API_V1_STR)
app.include_router(findings_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(risk_router, prefix=settings.API_V1_STR)
app.include_router(vendors_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(providers_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(scope_router, prefix=settings.API_V1_STR)
app.include_router(search_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "product": "ExposureX",
        "tagline": settings.TAGLINE,
        "mode": "Continuous Exposure Management & Risk Intelligence"
    }

@app.get("/")
def root():
    return {
        "product": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": "1.0.0",
        "documentation": "/docs"
    }

