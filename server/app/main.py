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
from app.core.database import engine, Base

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

# Mount static files directory for serving flag images
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Include API v1 router
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """Create missing database tables and run migrations on startup."""
    from sqlalchemy import text, inspect
    
    # Import all models to ensure they're registered with Base
    from app.models import metric_config  # noqa: F401
    from app.models import country  # noqa: F401 - includes CountryDeepDive
    from app.models import user  # noqa: F401
    
    print("GOHIP Platform starting up...")
    print(f"Database URL: {settings.DATABASE_URL[:50]}...")
    
    # Create tables that don't exist yet
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created/verified successfully")
    except Exception as e:
        print(f"ERROR creating database tables: {e}")
    
    # Run migrations for missing columns
    try:
        with engine.connect() as conn:
            inspector = inspect(engine)
            
            # Check if country_deep_dives table exists
            if 'country_deep_dives' in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns('country_deep_dives')]
                
                # Add queue_position column if missing
                if 'queue_position' not in columns:
                    print("Adding missing column: queue_position")
                    conn.execute(text("ALTER TABLE country_deep_dives ADD COLUMN queue_position INTEGER"))
                    conn.commit()
                    print("Added queue_position column successfully")
                else:
                    print("queue_position column already exists")
            else:
                print("country_deep_dives table does not exist yet")
                
    except Exception as e:
        print(f"Migration error (non-fatal): {e}")


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
