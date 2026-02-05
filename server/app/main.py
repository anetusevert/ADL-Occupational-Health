"""
GOHIP - Global Occupational Health Intelligence Platform
Main FastAPI Application Entry Point
"""

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1 import api_router
from app.core.database import engine, Base, SessionLocal

# Static files directory
STATIC_DIR = Path(__file__).parent.parent / "static"

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Sovereign Data Intelligence Platform for Occupational Health",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend communication
# Production origins from environment variable (comma-separated)
# Strip trailing slashes to ensure origin matching works correctly
production_origins = [
    origin.strip().rstrip("/") 
    for origin in os.getenv("CORS_ORIGINS", "").split(",") 
    if origin.strip()
]

# Debug: Print loaded origins at startup
print(f"CORS Production Origins: {production_origins}")

# Local development origins
local_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Known Railway deployment origins (fallback if not in env)
railway_origins = [
    "https://front-end-production-79cb.up.railway.app",
    "https://adl-occupational-health-production.up.railway.app",
]

# Combine production, railway, and local origins
CORS_ORIGINS = production_origins + railway_origins + local_origins

# Railway subdomain regex pattern for dynamic matching
# Matches any *.up.railway.app subdomain
RAILWAY_ORIGIN_REGEX = r"https://.*\.up\.railway\.app"

print(f"CORS Origins List: {CORS_ORIGINS}")
print(f"CORS Origin Regex: {RAILWAY_ORIGIN_REGEX}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=RAILWAY_ORIGIN_REGEX,  # Allow any Railway subdomain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Global exception handler to ensure CORS headers are sent even for unhandled errors
# This prevents CORS errors in the browser when the backend crashes with 500
from fastapi import Request
from fastapi.responses import JSONResponse
import logging
import traceback

logger = logging.getLogger(__name__)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler that ensures proper error responses with CORS headers.
    
    When an unhandled exception occurs, FastAPI may not add CORS headers,
    causing the browser to report a CORS error instead of the actual error.
    This handler ensures a proper JSON error response is returned.
    """
    # Log the full exception for debugging
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    
    # Get the origin from the request to return proper CORS header
    origin = request.headers.get("origin", "*")
    
    # Check if origin matches our allowed patterns
    if origin not in CORS_ORIGINS and not origin.endswith(".up.railway.app"):
        origin = "*"
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
        },
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


# Mount static files directory for serving flag images
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Include API v1 router
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """Create missing database tables and run migrations on startup."""
    import sys
    
    # Force flush prints immediately
    print("=" * 60, flush=True)
    print("GOHIP Platform starting up...", flush=True)
    print(f"Python version: {sys.version}", flush=True)
    print(f"Database URL: {settings.DATABASE_URL[:50]}...", flush=True)
    print("=" * 60, flush=True)
    
    from sqlalchemy import text, inspect
    
    # Import all models to ensure they're registered with Base
    print("Importing models...", flush=True)
    from app.models import metric_config  # noqa: F401
    from app.models import country  # noqa: F401 - includes CountryDeepDive
    from app.models import user  # noqa: F401
    from app.models import agent  # noqa: F401 - AI Agent Registry
    print("Models imported successfully", flush=True)
    
    # Create tables that don't exist yet
    print("Creating database tables...", flush=True)
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created/verified successfully", flush=True)
    except Exception as e:
        print(f"ERROR creating database tables: {e}", flush=True)
    
    # SKIP schema migrations - they cause connection hangs
    # Base.metadata.create_all() already handles table creation
    # Alembic migrations handle schema changes
    print("Skipping schema migrations (handled by Alembic)", flush=True)
    
    # SKIP agent seeding during startup - it causes connection hangs
    # Agents will be seeded on first API request if needed
    print("Skipping agent seeding during startup (will sync on first request)", flush=True)
    
    print("=" * 60, flush=True)
    print("STARTUP COMPLETE - Application ready!", flush=True)
    print("=" * 60, flush=True)


@app.get("/health", tags=["System"])
async def health_check():
    """
    Health Check Endpoint
    Returns the current status and version of the GOHIP Platform.
    """
    return {
        "status": "active",
        "version": settings.VERSION,
        "platform": settings.PROJECT_NAME,
        "ai_consultant": "enabled",
    }


@app.get("/", tags=["System"])
async def root():
    """Root endpoint with platform information."""
    return {
        "message": "Welcome to GOHIP - Global Occupational Health Intelligence Platform",
        "docs": "/docs",
        "health": "/health",
        "api": "/api/v1",
        "assessment": "/api/v1/assessment",
    }
