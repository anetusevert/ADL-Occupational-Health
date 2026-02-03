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

# Import saudi_analysis router with error handling
try:
    from app.api.endpoints.saudi_analysis import router as saudi_analysis_router
    logger.info("Saudi analysis router imported successfully")
except Exception as e:
    logger.error(f"Failed to import saudi_analysis router: {e}")
    saudi_analysis_router = None

# Import database_explorer router with error handling
try:
    from app.api.endpoints.database_explorer import router as database_explorer_router
    logger.info("Database explorer router imported successfully")
except Exception as e:
    logger.error(f"Failed to import database_explorer router: {e}")
    database_explorer_router = None

# Import comparison_reports router with error handling
try:
    from app.api.endpoints.comparison_reports import router as comparison_reports_router
    logger.info("Comparison reports router imported successfully")
except Exception as e:
    logger.error(f"Failed to import comparison_reports router: {e}")
    comparison_reports_router = None

# Import insights router with error handling
try:
    from app.api.endpoints.insights import router as insights_router
    logger.info("Insights router imported successfully")
except Exception as e:
    logger.error(f"Failed to import insights router: {e}")
    insights_router = None

# Import personas router with error handling
try:
    from app.api.endpoints.personas import router as personas_router
    logger.info("Personas router imported successfully")
except Exception as e:
    logger.error(f"Failed to import personas router: {e}")
    personas_router = None

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

# Include saudi_analysis router if it loaded successfully
if saudi_analysis_router:
    api_router.include_router(saudi_analysis_router)
    logger.info("Saudi analysis router registered at /api/v1/saudi-analysis")
else:
    logger.warning("Saudi analysis router not available")

# Include database_explorer router if it loaded successfully
if database_explorer_router:
    api_router.include_router(database_explorer_router)
    logger.info("Database explorer router registered at /api/v1/admin/database")
else:
    logger.warning("Database explorer router not available")

# Include comparison_reports router if it loaded successfully
if comparison_reports_router:
    api_router.include_router(comparison_reports_router)
    logger.info("Comparison reports router registered at /api/v1/comparison")
else:
    logger.warning("Comparison reports router not available")

# Include insights router if it loaded successfully
if insights_router:
    api_router.include_router(insights_router)
    logger.info("Insights router registered at /api/v1/insights")
else:
    logger.warning("Insights router not available")

# Include personas router if it loaded successfully
if personas_router:
    api_router.include_router(personas_router)
    logger.info("Personas router registered at /api/v1/personas")
else:
    logger.warning("Personas router not available")