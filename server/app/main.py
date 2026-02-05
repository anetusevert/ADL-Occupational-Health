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
    
    # Run schema migrations - SIMPLIFIED: just try each migration, skip on error
    # This avoids the inspector.get_columns() call which can hang
    print("Running schema migrations (fire-and-forget)...", flush=True)
    try:
        with engine.connect() as conn:
            # List of all potential migrations - just try them all, errors are OK
            potential_migrations = [
                # country_deep_dives
                "ALTER TABLE country_deep_dives ADD COLUMN IF NOT EXISTS queue_position INTEGER",
                # agents - make legacy columns nullable
                "ALTER TABLE agents ALTER COLUMN category DROP NOT NULL",
                "ALTER TABLE agents ALTER COLUMN workflow DROP NOT NULL",
                "ALTER TABLE agents ALTER COLUMN input_schema DROP NOT NULL",
                "ALTER TABLE agents ALTER COLUMN output_schema DROP NOT NULL",
                # agents - add columns if missing (PostgreSQL 9.6+ supports IF NOT EXISTS)
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 100",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 100",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(50)",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS llm_model_name VARCHAR(100)",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS workflow_id VARCHAR(50)",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
                "ALTER TABLE agents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
            ]
            
            success = 0
            for sql in potential_migrations:
                try:
                    conn.execute(text(sql))
                    success += 1
                except Exception:
                    pass  # Column exists or other expected error
            
            conn.commit()
            print(f"Schema migrations: {success}/{len(potential_migrations)} applied", flush=True)
                
    except Exception as e:
        print(f"Migration error (non-fatal): {e}", flush=True)
    
    # Seed default agents on startup using RAW SQL to avoid ORM/schema mismatches
    # OPTIMIZED: Single transaction, upsert pattern, minimal commits
    print("Starting agent sync...", flush=True)
    try:
        from app.models.agent import DEFAULT_AGENTS
        import json
        
        print(f"Syncing {len(DEFAULT_AGENTS)} agents...", flush=True)
        with engine.connect() as conn:
            # Make legacy columns nullable in one transaction
            for col in ['category', 'workflow', 'input_schema', 'output_schema']:
                try:
                    conn.execute(text(f"ALTER TABLE agents ALTER COLUMN {col} DROP NOT NULL"))
                except Exception:
                    pass  # Column doesn't exist or already nullable
            
            # Use PostgreSQL UPSERT (ON CONFLICT) for efficient agent sync
            upsert_sql = text("""
                INSERT INTO agents (
                    id, name, description, system_prompt, user_prompt_template,
                    template_variables, icon, color, is_active, execution_count,
                    created_at, updated_at
                ) VALUES (
                    :id, :name, :description, :system_prompt, :user_prompt_template,
                    :template_variables, :icon, :color, TRUE, 0, NOW(), NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    system_prompt = EXCLUDED.system_prompt,
                    user_prompt_template = EXCLUDED.user_prompt_template,
                    template_variables = EXCLUDED.template_variables,
                    icon = EXCLUDED.icon,
                    color = EXCLUDED.color,
                    updated_at = NOW()
            """)
            
            for agent_data in DEFAULT_AGENTS:
                conn.execute(upsert_sql, {
                    "id": agent_data["id"],
                    "name": agent_data["name"],
                    "description": agent_data["description"],
                    "system_prompt": agent_data["system_prompt"],
                    "user_prompt_template": agent_data["user_prompt_template"],
                    "template_variables": json.dumps(agent_data["template_variables"]),
                    "icon": agent_data["icon"],
                    "color": agent_data["color"],
                })
            
            # Single commit for all operations
            conn.commit()
            print(f"Synced {len(DEFAULT_AGENTS)} agents successfully", flush=True)
                
    except Exception as e:
        print(f"Agent seeding error (non-fatal): {e}", flush=True)
    
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
