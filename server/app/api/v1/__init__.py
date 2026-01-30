"""
GOHIP Platform - API v1 Router
"""

from fastapi import APIRouter

from app.api.endpoints.assessment import router as assessment_router
from app.api.endpoints.countries import router as countries_router
from app.api.endpoints.etl import router as etl_router
from app.api.endpoints.ai import router as ai_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.ai_config import router as ai_config_router
from app.api.endpoints.intelligence import router as intelligence_router
from app.api.endpoints.strategic_deep_dive import router as strategic_deep_dive_router
from app.api.endpoints.country_data import router as country_data_router
from app.api.endpoints.metric_config import router as metric_config_router

# Create v1 router
api_router = APIRouter(prefix="/api/v1")

# Include endpoint routers
api_router.include_router(auth_router)
api_router.include_router(assessment_router)
api_router.include_router(countries_router)
api_router.include_router(etl_router)
api_router.include_router(ai_router)
api_router.include_router(ai_config_router)
api_router.include_router(intelligence_router)
api_router.include_router(strategic_deep_dive_router)
api_router.include_router(country_data_router)
api_router.include_router(metric_config_router, prefix="/admin/metric-config", tags=["Admin - Metric Calculator"])
