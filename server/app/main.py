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
    from app.models import agent  # noqa: F401 - AI Agent Registry
    
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
            table_names = inspector.get_table_names()
            
            # Check if country_deep_dives table exists
            if 'country_deep_dives' in table_names:
                columns = [col['name'] for col in inspector.get_columns('country_deep_dives')]
                
                # Add queue_position column if missing
                if 'queue_position' not in columns:
                    print("Adding missing column: queue_position")
                    conn.execute(text("ALTER TABLE country_deep_dives ADD COLUMN queue_position INTEGER"))
                    conn.commit()
                    print("Added queue_position column successfully")
            
            # Migrate agents table - add new columns for visual workflow builder
            if 'agents' in table_names:
                columns = [col['name'] for col in inspector.get_columns('agents')]
                
                # Make category column nullable if it exists (legacy column from old schema)
                # This fixes: "null value in column category violates not-null constraint"
                if 'category' in columns:
                    print("Making category column nullable (legacy fix)...")
                    conn.execute(text("ALTER TABLE agents ALTER COLUMN category DROP NOT NULL"))
                    conn.commit()
                
                # Add position columns
                if 'position_x' not in columns:
                    print("Adding missing column to agents: position_x")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN position_x FLOAT DEFAULT 100"))
                    conn.commit()
                
                if 'position_y' not in columns:
                    print("Adding missing column to agents: position_y")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN position_y FLOAT DEFAULT 100"))
                    conn.commit()
                
                # Add LLM override columns
                if 'llm_provider' not in columns:
                    print("Adding missing column to agents: llm_provider")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN llm_provider VARCHAR(50)"))
                    conn.commit()
                
                if 'llm_model_name' not in columns:
                    print("Adding missing column to agents: llm_model_name")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN llm_model_name VARCHAR(100)"))
                    conn.commit()
                
                # Add workflow_id column (replacing workflow enum)
                if 'workflow_id' not in columns:
                    print("Adding missing column to agents: workflow_id")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN workflow_id VARCHAR(50)"))
                    conn.commit()
                
                # Add execution_count if missing
                if 'execution_count' not in columns:
                    print("Adding missing column to agents: execution_count")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN execution_count INTEGER DEFAULT 0 NOT NULL"))
                    conn.commit()
                
                # Add last_run_at if missing
                if 'last_run_at' not in columns:
                    print("Adding missing column to agents: last_run_at")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN last_run_at TIMESTAMP"))
                    conn.commit()
                
                # Add is_active if missing
                if 'is_active' not in columns:
                    print("Adding missing column to agents: is_active")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL"))
                    conn.commit()
                
                # Add created_at if missing
                if 'created_at' not in columns:
                    print("Adding missing column to agents: created_at")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL"))
                    conn.commit()
                
                # Add updated_at if missing
                if 'updated_at' not in columns:
                    print("Adding missing column to agents: updated_at")
                    conn.execute(text("ALTER TABLE agents ADD COLUMN updated_at TIMESTAMP DEFAULT NOW() NOT NULL"))
                    conn.commit()
                
                print("Agents table migration complete")
            else:
                # Agents table doesn't exist - create it explicitly
                print("Agents table not found, creating...")
                from app.models.agent import Agent
                Agent.__table__.create(bind=engine, checkfirst=True)
                print("Agents table created successfully")
            
            print("All migrations completed successfully")
                
    except Exception as e:
        print(f"Migration error (non-fatal): {e}")
        import traceback
        traceback.print_exc()
    
    # Seed default agents on startup using RAW SQL to avoid ORM/schema mismatches
    try:
        from app.models.agent import DEFAULT_AGENTS
        import json
        
        with engine.connect() as conn:
            # First, make ALL potentially problematic columns nullable
            legacy_columns = ['category', 'workflow', 'input_schema', 'output_schema']
            for col in legacy_columns:
                try:
                    conn.execute(text(f"ALTER TABLE agents ALTER COLUMN {col} DROP NOT NULL"))
                    conn.commit()
                    print(f"Made column {col} nullable")
                except Exception:
                    pass  # Column doesn't exist or already nullable
            
            # ALWAYS sync agents with DEFAULT_AGENTS - update prompts if changed
            print("Syncing agents with DEFAULT_AGENTS (insert or update)...")
            
            for agent_data in DEFAULT_AGENTS:
                # Check if this agent exists
                check = conn.execute(text("SELECT id FROM agents WHERE id = :id"), {"id": agent_data["id"]})
                exists = check.fetchone()
                
                if exists:
                    # UPDATE existing agent with latest prompts from code
                    update_sql = text("""
                        UPDATE agents SET
                            name = :name,
                            description = :description,
                            system_prompt = :system_prompt,
                            user_prompt_template = :user_prompt_template,
                            template_variables = :template_variables,
                            icon = :icon,
                            color = :color,
                            updated_at = NOW()
                        WHERE id = :id
                    """)
                    conn.execute(update_sql, {
                        "id": agent_data["id"],
                        "name": agent_data["name"],
                        "description": agent_data["description"],
                        "system_prompt": agent_data["system_prompt"],
                        "user_prompt_template": agent_data["user_prompt_template"],
                        "template_variables": json.dumps(agent_data["template_variables"]),
                        "icon": agent_data["icon"],
                        "color": agent_data["color"],
                    })
                    conn.commit()
                    print(f"  Updated agent: {agent_data['id']}")
                else:
                    # INSERT new agent
                    insert_sql = text("""
                        INSERT INTO agents (
                            id, name, description, system_prompt, user_prompt_template,
                            template_variables, icon, color, is_active, execution_count,
                            created_at, updated_at
                        ) VALUES (
                            :id, :name, :description, :system_prompt, :user_prompt_template,
                            :template_variables, :icon, :color, :is_active, :execution_count,
                            NOW(), NOW()
                        )
                    """)
                    conn.execute(insert_sql, {
                        "id": agent_data["id"],
                        "name": agent_data["name"],
                        "description": agent_data["description"],
                        "system_prompt": agent_data["system_prompt"],
                        "user_prompt_template": agent_data["user_prompt_template"],
                        "template_variables": json.dumps(agent_data["template_variables"]),
                        "icon": agent_data["icon"],
                        "color": agent_data["color"],
                        "is_active": True,
                        "execution_count": 0,
                    })
                    conn.commit()
                    print(f"  Added agent: {agent_data['id']}")
            
            print(f"Successfully synced {len(DEFAULT_AGENTS)} agents with latest prompts")
                
    except Exception as e:
        print(f"Agent seeding error on startup: {e}")
        import traceback
        traceback.print_exc()


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
