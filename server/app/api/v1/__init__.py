"""
GOHIP Platform - API v1 Router
"""

import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)

from app.api.endpoints.countries import router as countries_router
from app.api.endpoints.etl import router as etl_router
from app.api.endpoints.ai import router as ai_router
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.ai_config import router as ai_config_router
from app.api.endpoints.intelligence import router as intelligence_router
from app.api.endpoints.country_data import router as country_data_router
from app.api.endpoints.metric_config import router as metric_config_router
from app.api.endpoints.simulator import router as simulator_router
from app.api.endpoints.orchestration import router as orchestration_router
from app.api.endpoints.strategic_deep_dive import router as strategic_deep_dive_router
from app.api.endpoints.best_practices import router as best_practices_router

# Import view_analysis router with error handling
try:
    from app.api.endpoints.view_analysis import router as view_analysis_router
    logger.info("View analysis router imported successfully")
except Exception as e:
    logger.error(f"Failed to import view_analysis router: {e}")
    view_analysis_router = None

# Import pillar_analysis routers with error handling
try:
    from app.api.endpoints.pillar_analysis import router as pillar_analysis_router
    from app.api.endpoints.pillar_analysis import summary_router as summary_report_router
    from app.api.endpoints.pillar_analysis import batch_router as batch_generation_router
    logger.info("Pillar analysis routers imported successfully")
except Exception as e:
    logger.error(f"Failed to import pillar_analysis routers: {e}")
    pillar_analysis_router = None
    summary_report_router = None
    batch_generation_router = None

# Create v1 router
api_router = APIRouter(prefix="/api/v1")

# Include endpoint routers
api_router.include_router(auth_router)
api_router.include_router(countries_router)
api_router.include_router(etl_router)
api_router.include_router(ai_router)
api_router.include_router(ai_config_router)
api_router.include_router(intelligence_router)
api_router.include_router(country_data_router)
api_router.include_router(metric_config_router, prefix="/admin/metric-config", tags=["Admin - Metric Calculator"])
api_router.include_router(simulator_router)
api_router.include_router(orchestration_router)
api_router.include_router(strategic_deep_dive_router)
api_router.include_router(best_practices_router)

# Include view_analysis router if it loaded successfully
if view_analysis_router:
    api_router.include_router(view_analysis_router)
    logger.info("View analysis router registered at /api/v1/view-analysis")
else:
    logger.warning("View analysis router not available")

# Include pillar_analysis routers if they loaded successfully
if pillar_analysis_router:
    api_router.include_router(pillar_analysis_router)
    logger.info("Pillar analysis router registered at /api/v1/pillar-analysis")
else:
    logger.warning("Pillar analysis router not available")

if summary_report_router:
    api_router.include_router(summary_report_router)
    logger.info("Summary report router registered at /api/v1/summary-report")
else:
    logger.warning("Summary report router not available")

if batch_generation_router:
    api_router.include_router(batch_generation_router)
    logger.info("Batch generation router registered at /api/v1/batch-generate")
else:
    logger.warning("Batch generation router not available")