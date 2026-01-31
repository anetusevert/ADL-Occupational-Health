"""
GOHIP Platform - Assessment API Endpoints
==========================================

Phase 4: The Consultant Agent API
Exposes endpoints for AI-powered strategic assessment generation.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.ai_consultant import (
    generate_country_assessment,
    get_country_assessment,
)
from app.models.country import Country

# Create router
router = APIRouter(prefix="/assessment", tags=["Assessment"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class AssessmentResponse(BaseModel):
    """Response schema for assessment generation."""
    success: bool
    iso_code: str
    country_name: Optional[str]
    assessment: Optional[str]
    source: Optional[str]  # "openai" or "mock"
    error: Optional[str]

    class Config:
        from_attributes = True


class AssessmentGetResponse(BaseModel):
    """Response schema for getting existing assessment."""
    iso_code: str
    country_name: str
    assessment: Optional[str]
    has_assessment: bool

    class Config:
        from_attributes = True


class BatchAssessmentRequest(BaseModel):
    """Request schema for batch assessment generation."""
    iso_codes: list[str]


class BatchAssessmentResponse(BaseModel):
    """Response schema for batch assessment generation."""
    total: int
    successful: int
    failed: int
    results: list[AssessmentResponse]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/{iso_code}/generate",
    response_model=AssessmentResponse,
    summary="Generate Strategic Assessment",
    description="""
    Generate an AI-powered strategic assessment for a specific country.
    
    The assessment is generated using the Sovereign OH Integrity Framework v3.0
    and considers all four strategic layers (Governance + 3 Pillars).
    
    If OpenAI API key is configured, uses GPT-4o for generation.
    Otherwise, generates a high-quality mock response for testing.
    """
)
async def generate_assessment(
    iso_code: str,
    db: Session = Depends(get_db)
):
    """
    Generate a new strategic assessment for the specified country.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code (e.g., DEU, SAU, SGP, GBR)
        
    Returns:
        AssessmentResponse with generated assessment text
    """
    # Normalize ISO code to uppercase
    iso_code = iso_code.upper()
    
    # Validate ISO code format
    if len(iso_code) != 3 or not iso_code.isalpha():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ISO code format: '{iso_code}'. Must be 3-letter alpha code."
        )
    
    # Generate assessment
    result = generate_country_assessment(iso_code, db)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    
    return AssessmentResponse(**result)


@router.get(
    "/{iso_code}",
    response_model=AssessmentGetResponse,
    summary="Get Existing Assessment",
    description="Retrieve the existing strategic assessment for a country."
)
async def get_assessment(
    iso_code: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve the existing strategic assessment for a country.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        
    Returns:
        AssessmentGetResponse with assessment text if available
    """
    # Normalize ISO code to uppercase
    iso_code = iso_code.upper()
    
    # Query country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country with ISO code '{iso_code}' not found"
        )
    
    return AssessmentGetResponse(
        iso_code=country.iso_code,
        country_name=country.name,
        assessment=country.strategic_summary_text,
        has_assessment=country.strategic_summary_text is not None
    )


@router.post(
    "/batch/generate",
    response_model=BatchAssessmentResponse,
    summary="Batch Generate Assessments",
    description="Generate assessments for multiple countries in a single request."
)
async def batch_generate_assessments(
    request: BatchAssessmentRequest,
    db: Session = Depends(get_db)
):
    """
    Generate assessments for multiple countries.
    
    Args:
        request: BatchAssessmentRequest with list of ISO codes
        
    Returns:
        BatchAssessmentResponse with results for all countries
    """
    results = []
    successful = 0
    failed = 0
    
    for iso_code in request.iso_codes:
        iso_code = iso_code.upper()
        
        # Skip invalid codes
        if len(iso_code) != 3 or not iso_code.isalpha():
            results.append(AssessmentResponse(
                success=False,
                iso_code=iso_code,
                country_name=None,
                assessment=None,
                source=None,
                error=f"Invalid ISO code format: '{iso_code}'"
            ))
            failed += 1
            continue
        
        # Generate assessment
        result = generate_country_assessment(iso_code, db)
        results.append(AssessmentResponse(**result))
        
        if result["success"]:
            successful += 1
        else:
            failed += 1
    
    return BatchAssessmentResponse(
        total=len(request.iso_codes),
        successful=successful,
        failed=failed,
        results=results
    )


@router.get(
    "/",
    summary="List All Countries with Assessments",
    description="Get a list of all countries and their assessment status."
)
async def list_assessments(db: Session = Depends(get_db)):
    """
    List all countries with their assessment status.
    
    Returns:
        List of countries with assessment availability
    """
    countries = db.query(Country).all()
    
    return {
        "total": len(countries),
        "countries": [
            {
                "iso_code": c.iso_code,
                "name": c.name,
                "has_assessment": c.strategic_summary_text is not None,
                "maturity_score": c.maturity_score,
                "flag_url": c.flag_url,
            }
            for c in countries
        ]
    }
