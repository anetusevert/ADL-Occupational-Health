"""
GOHIP Platform - View Analysis API Endpoints
=============================================

AI-powered deep qualitative analysis for Country Profile visualization views.

Endpoints:
- POST /api/v1/view-analysis/{iso_code}/{view_type} - Generate analysis for a view
- GET /api/v1/view-analysis/{iso_code}/{view_type} - Get cached analysis
"""

import logging
import json
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.models.user import User, AIConfig
from app.models.country import Country
from app.models.agent import Agent
from app.services.agent_runner import AgentRunner
from app.services.country_data_provider import CountryDataProvider


# Create router
router = APIRouter(prefix="/view-analysis", tags=["View Analysis"])

logger.info("View Analysis router initialized successfully")


# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================

@router.get("/health", summary="Health check", description="Check if view analysis API is available")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "view-analysis", "timestamp": datetime.utcnow().isoformat()}


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ViewAnalysisRequest(BaseModel):
    """Request for view analysis."""
    comparison_iso: Optional[str] = Field(None, description="ISO code of comparison country")
    
    class Config:
        json_schema_extra = {
            "example": {
                "comparison_iso": "DEU"
            }
        }


class KeyInsight(BaseModel):
    """A key insight from the analysis."""
    insight: str
    implication: str


class Recommendation(BaseModel):
    """A strategic recommendation."""
    action: str
    rationale: str
    expected_impact: str


class ViewAnalysisResponse(BaseModel):
    """Response with view analysis."""
    iso_code: str
    country_name: str
    view_type: str
    title: str
    analysis_paragraphs: List[str]
    key_insights: List[KeyInsight]
    recommendations: List[Recommendation]
    comparison_note: Optional[str] = None
    generated_at: str
    cached: bool = False


class ViewAnalysisError(BaseModel):
    """Error response."""
    error: str
    details: Optional[str] = None


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_ai_config(db: Session) -> Optional[AIConfig]:
    """Get AI configuration from database."""
    try:
        return db.query(AIConfig).first()
    except Exception:
        return None


def get_country_data(db: Session, iso_code: str) -> Optional[Country]:
    """Fetch country with all relationships."""
    try:
        country = db.query(Country).filter(Country.iso_code == iso_code.upper()).first()
        return country
    except Exception as e:
        logger.error(f"Error fetching country {iso_code}: {e}")
        return None


def parse_agent_response(response_text: str) -> Dict[str, Any]:
    """Parse JSON response from agent."""
    try:
        # Try to extract JSON from the response
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        return json.loads(response_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse agent response: {e}")
        # Return a fallback structure
        return {
            "title": "Analysis Unavailable",
            "analysis_paragraphs": [response_text[:500] if response_text else "Unable to generate analysis."],
            "key_insights": [],
            "recommendations": [],
            "comparison_note": None
        }


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post(
    "/{iso_code}/{view_type}",
    response_model=ViewAnalysisResponse,
    responses={
        404: {"model": ViewAnalysisError, "description": "Country not found"},
        500: {"model": ViewAnalysisError, "description": "Analysis generation failed"},
    },
    summary="Generate view analysis",
    description="Generate AI-powered deep qualitative analysis for a specific visualization view.",
)
async def generate_view_analysis(
    iso_code: str,
    view_type: str,
    request: ViewAnalysisRequest = ViewAnalysisRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Generate in-depth analysis for a country profile view."""
    
    # Validate view type
    valid_views = ["layers", "flow", "radar", "summary"]
    if view_type not in valid_views:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid view_type. Must be one of: {', '.join(valid_views)}"
        )
    
    # Get country data
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {iso_code}"
        )
    
    # Get comparison country if specified
    comparison_context = "No comparison country selected."
    if request.comparison_iso:
        comparison_country = get_country_data(db, request.comparison_iso)
        if comparison_country:
            data_provider = CountryDataProvider(db)
            comparison_context = data_provider.get_database_context(request.comparison_iso)
    
    # Get AI config
    ai_config = get_ai_config(db)
    if not ai_config:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI configuration not found. Please configure AI settings."
        )
    
    # Check if agent exists
    agent = db.query(Agent).filter(Agent.id == "view-analysis").first()
    if not agent:
        # Try to seed default agents
        from app.models.agent import DEFAULT_AGENTS
        for agent_data in DEFAULT_AGENTS:
            if agent_data["id"] == "view-analysis":
                agent = Agent(**agent_data)
                db.add(agent)
                db.commit()
                break
        
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="View analysis agent not available."
            )
    
    try:
        # Create agent runner
        runner = AgentRunner(db, ai_config)
        
        # Run the agent
        logger.info(f"Running view-analysis agent for {iso_code}, view: {view_type}")
        
        result = await runner.run(
            agent_id="view-analysis",
            variables={
                "ISO_CODE": iso_code.upper(),
                "VIEW_TYPE": view_type,
                "COMPARISON_COUNTRY": comparison_context,
            },
            enable_web_search=True,  # Enable web search for real insights
        )
        
        # Parse the response
        parsed = parse_agent_response(result.get("output", ""))
        
        # Build response
        return ViewAnalysisResponse(
            iso_code=iso_code.upper(),
            country_name=country.name,
            view_type=view_type,
            title=parsed.get("title", f"{country.name} - {view_type.title()} Analysis"),
            analysis_paragraphs=parsed.get("analysis_paragraphs", []),
            key_insights=[
                KeyInsight(**insight) for insight in parsed.get("key_insights", [])
            ],
            recommendations=[
                Recommendation(**rec) for rec in parsed.get("recommendations", [])
            ],
            comparison_note=parsed.get("comparison_note"),
            generated_at=datetime.utcnow().isoformat(),
            cached=False,
        )
        
    except Exception as e:
        logger.error(f"View analysis generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis generation failed: {str(e)}"
        )


@router.get(
    "/{iso_code}/{view_type}/fallback",
    response_model=ViewAnalysisResponse,
    summary="Get fallback analysis",
    description="Get a quick database-driven analysis without AI (for fast loading).",
)
async def get_fallback_analysis(
    iso_code: str,
    view_type: str,
    db: Session = Depends(get_db),
):
    """Get a quick fallback analysis based on database metrics only."""
    
    # Validate view type
    valid_views = ["layers", "flow", "radar", "summary"]
    if view_type not in valid_views:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid view_type. Must be one of: {', '.join(valid_views)}"
        )
    
    # Get country data
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {iso_code}"
        )
    
    # Generate quick analysis based on view type and available data
    analysis = generate_fallback_analysis(country, view_type)
    
    return ViewAnalysisResponse(
        iso_code=iso_code.upper(),
        country_name=country.name,
        view_type=view_type,
        title=analysis["title"],
        analysis_paragraphs=analysis["paragraphs"],
        key_insights=[KeyInsight(**i) for i in analysis["insights"]],
        recommendations=[Recommendation(**r) for r in analysis["recommendations"]],
        comparison_note=None,
        generated_at=datetime.utcnow().isoformat(),
        cached=True,
    )


def generate_fallback_analysis(country: Country, view_type: str) -> Dict[str, Any]:
    """Generate quick fallback analysis from database metrics."""
    
    gov = country.governance
    p1 = country.pillar_1_hazard
    p2 = country.pillar_2_vigilance
    p3 = country.pillar_3_restoration
    
    if view_type == "layers":
        # National OH System Layers analysis
        policy_score = gov.strategic_capacity_score if gov else None
        ilo_ratified = (gov.ilo_c187_status if gov else False) or (gov.ilo_c155_status if gov else False)
        inspector_density = gov.inspector_density if gov else None
        fatal_rate = p1.fatal_accident_rate if p1 else None
        
        paragraphs = []
        
        # Policy layer
        if policy_score:
            paragraphs.append(
                f"At the national policy layer, {country.name} demonstrates a strategic capacity score of {policy_score:.1f}%, "
                f"{'having ratified key ILO conventions' if ilo_ratified else 'with room for improvement in international convention adoption'}. "
                f"This foundation shapes the entire occupational health ecosystem."
            )
        
        # Infrastructure layer
        if inspector_density:
            paragraphs.append(
                f"The institutional infrastructure layer shows an inspector density of {inspector_density:.2f} per 10,000 workers. "
                f"The ILO recommends 1 inspector per 10,000 workers, meaning {country.name} "
                f"{'meets or exceeds' if inspector_density >= 1.0 else 'falls short of'} this benchmark."
            )
        
        # Workplace layer
        if fatal_rate:
            paragraphs.append(
                f"At the workplace implementation layer, the fatal accident rate of {fatal_rate:.1f} per 100,000 workers "
                f"reflects the practical outcomes of policy and infrastructure investments. "
                f"{'This rate indicates effective workplace safety systems.' if fatal_rate < 2 else 'Significant improvement is needed to protect workers.'}"
            )
        
        if not paragraphs:
            paragraphs = ["Data is limited for comprehensive layer analysis. Additional metrics would enable deeper insights."]
        
        return {
            "title": f"{country.name}: National OH System Layer Assessment",
            "paragraphs": paragraphs,
            "insights": [
                {"insight": f"Strategic capacity: {policy_score:.1f}%" if policy_score else "Strategic capacity data unavailable", 
                 "implication": "Foundational policy strength determines system effectiveness"},
                {"insight": f"Inspector density: {inspector_density:.2f}/10k" if inspector_density else "Inspector data unavailable",
                 "implication": "Enforcement capacity directly impacts compliance rates"},
            ],
            "recommendations": [
                {"action": "Strengthen inspection capacity", "rationale": "Critical for policy enforcement", "expected_impact": "Improved workplace compliance"}
            ]
        }
    
    elif view_type == "flow":
        # System Logic Flow analysis
        paragraphs = [
            f"The system flow analysis for {country.name} examines how inputs (laws, funding, conventions) transform through "
            f"operational processes (inspections, services, training) into health outcomes (accident rates, disease detection, recovery)."
        ]
        
        if p1 and p1.fatal_accident_rate and gov and gov.strategic_capacity_score:
            efficiency = gov.strategic_capacity_score / max(p1.fatal_accident_rate * 10, 1)
            paragraphs.append(
                f"System efficiency can be approximated by comparing input investment to outcome achievement. "
                f"With a governance score of {gov.strategic_capacity_score:.1f}% and fatal rate of {p1.fatal_accident_rate:.1f}, "
                f"the system shows {'effective' if efficiency > 5 else 'moderate' if efficiency > 2 else 'limited'} conversion efficiency."
            )
        
        return {
            "title": f"{country.name}: Input-Process-Outcome Flow Analysis",
            "paragraphs": paragraphs,
            "insights": [
                {"insight": "Input-to-outcome conversion varies by pillar", "implication": "Targeted process improvements needed"}
            ],
            "recommendations": [
                {"action": "Identify process bottlenecks", "rationale": "Key to improving efficiency", "expected_impact": "Better resource utilization"}
            ]
        }
    
    elif view_type == "radar":
        # Benchmark comparison analysis
        score = country.maturity_score or 2.0
        paragraphs = [
            f"{country.name}'s radar profile reveals the balance across five key dimensions: Governance, Financing, Capacity, Implementation, and Impact. "
            f"With an overall OHI score of {score:.1f}, the country demonstrates {'strong' if score >= 3.0 else 'developing' if score >= 2.0 else 'nascent'} occupational health capabilities."
        ]
        
        return {
            "title": f"{country.name}: 5-Dimension Benchmark Analysis",
            "paragraphs": paragraphs,
            "insights": [
                {"insight": f"OHI Score: {score:.1f}/4.0", "implication": "Overall system maturity indicator"}
            ],
            "recommendations": [
                {"action": "Focus on lowest-scoring dimension", "rationale": "Balanced improvement strategy", "expected_impact": "Holistic system strengthening"}
            ]
        }
    
    else:  # summary
        paragraphs = [
            f"This summary synthesizes {country.name}'s occupational health landscape across all framework dimensions. "
            f"The country demonstrates {'robust' if (country.maturity_score or 0) >= 3.0 else 'developing'} systems overall."
        ]
        
        return {
            "title": f"{country.name}: Comprehensive OH System Summary",
            "paragraphs": paragraphs,
            "insights": [
                {"insight": "Multi-dimensional assessment completed", "implication": "Strategic priorities identified"}
            ],
            "recommendations": [
                {"action": "Develop integrated improvement roadmap", "rationale": "Coordinated approach maximizes impact", "expected_impact": "Sustained system improvement"}
            ]
        }


# =============================================================================
# ELEMENT ANALYSIS ENDPOINT
# =============================================================================

class ElementAnalysisRequest(BaseModel):
    """Request for element analysis."""
    comparison_iso: Optional[str] = Field(None, description="ISO code of comparison country")


class ElementAnalysisResponse(BaseModel):
    """Response with element-specific analysis."""
    iso_code: str
    country_name: str
    element_type: str
    element_name: str
    insight: str
    strengths: List[str]
    gaps: List[str]
    comparison_note: Optional[str] = None
    generated_at: str


@router.post(
    "/{iso_code}/element/{element_type}/{element_name}",
    response_model=ElementAnalysisResponse,
    summary="Generate element analysis",
    description="Generate AI analysis for a specific element (layer, stage, dimension).",
)
async def generate_element_analysis(
    iso_code: str,
    element_type: str,
    element_name: str,
    request: ElementAnalysisRequest = ElementAnalysisRequest(),
    db: Session = Depends(get_db),
):
    """Generate insight for a specific OH system element."""
    
    # Validate element type
    valid_types = ["layer", "stage", "dimension", "pillar"]
    if element_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid element_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Get country data
    country = get_country_data(db, iso_code)
    if not country:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Country not found: {iso_code}"
        )
    
    # Generate element-specific analysis from database
    analysis = generate_element_fallback(country, element_type, element_name, request.comparison_iso, db)
    
    return ElementAnalysisResponse(
        iso_code=iso_code.upper(),
        country_name=country.name,
        element_type=element_type,
        element_name=element_name,
        insight=analysis["insight"],
        strengths=analysis["strengths"],
        gaps=analysis["gaps"],
        comparison_note=analysis.get("comparison_note"),
        generated_at=datetime.utcnow().isoformat(),
    )


def generate_element_fallback(
    country: Country, 
    element_type: str, 
    element_name: str,
    comparison_iso: Optional[str],
    db: Session
) -> Dict[str, Any]:
    """Generate element-specific analysis from database."""
    
    gov = country.governance
    p1 = country.pillar_1_hazard
    p2 = country.pillar_2_vigilance
    p3 = country.pillar_3_restoration
    
    # Get comparison country if specified
    comparison_country = get_country_data(db, comparison_iso) if comparison_iso else None
    comp_gov = comparison_country.governance if comparison_country else None
    
    if element_type == "layer":
        if element_name == "policy":
            ilo_c187 = gov.ilo_c187_status if gov else False
            ilo_c155 = gov.ilo_c155_status if gov else False
            mental_health = gov.mental_health_policy if gov else False
            capacity = gov.strategic_capacity_score if gov else None
            
            strengths = []
            gaps = []
            
            if mental_health:
                strengths.append("Mental health policy framework in place")
            else:
                gaps.append("No dedicated mental health policy")
            
            if ilo_c187:
                strengths.append("ILO C187 (OH Framework) ratified")
            else:
                gaps.append("ILO C187 not ratified - limits international alignment")
            
            if ilo_c155:
                strengths.append("ILO C155 (OH & Safety) ratified")
            else:
                gaps.append("ILO C155 not ratified")
            
            if capacity and capacity >= 70:
                strengths.append(f"Strong strategic capacity ({capacity:.0f}%)")
            elif capacity:
                gaps.append(f"Strategic capacity at {capacity:.0f}% - room for improvement")
            
            insight = f"{country.name}'s national policy layer {'provides a solid foundation' if len(strengths) > len(gaps) else 'requires strengthening'} for occupational health governance. "
            if capacity:
                insight += f"With a strategic capacity score of {capacity:.0f}%, "
            insight += f"the country has {'ratified key ILO conventions' if ilo_c187 or ilo_c155 else 'yet to ratify core ILO conventions'}."
            
            return {"insight": insight, "strengths": strengths, "gaps": gaps}
        
        elif element_name == "infrastructure":
            inspector = gov.inspector_density if gov else None
            surveillance = p2.surveillance_logic if p2 else None
            rehab = p3.rehab_access_score if p3 else None
            
            strengths = []
            gaps = []
            
            if inspector and inspector >= 1.0:
                strengths.append(f"Inspector density ({inspector:.2f}/10k) meets ILO benchmark")
            elif inspector:
                gaps.append(f"Inspector density ({inspector:.2f}/10k) below ILO 1.0/10k benchmark")
            
            if surveillance == "Risk-Based":
                strengths.append("Risk-based surveillance system in place")
            elif surveillance:
                gaps.append(f"Surveillance uses {surveillance} approach - could upgrade to risk-based")
            
            if rehab and rehab >= 60:
                strengths.append(f"Good rehabilitation access ({rehab:.0f}/100)")
            elif rehab:
                gaps.append(f"Rehabilitation access score ({rehab:.0f}/100) needs improvement")
            
            insight = f"Institutional infrastructure in {country.name} "
            if inspector:
                insight += f"operates with {inspector:.2f} inspectors per 10,000 workers"
                insight += f" ({'meeting' if inspector >= 1.0 else 'below'} ILO standards). "
            if surveillance:
                insight += f"The {surveillance.lower()} surveillance approach "
                insight += f"{'positions the country well' if surveillance == 'Risk-Based' else 'could be enhanced'}."
            
            return {"insight": insight, "strengths": strengths, "gaps": gaps}
        
        else:  # workplace
            oel = p1.oel_compliance_pct if p1 else None
            fatal = p1.fatal_accident_rate if p1 else None
            rtw = p3.return_to_work_success_pct if p3 else None
            
            strengths = []
            gaps = []
            
            if oel and oel >= 80:
                strengths.append(f"High OEL compliance ({oel:.0f}%)")
            elif oel:
                gaps.append(f"OEL compliance at {oel:.0f}% - improvement needed")
            
            if fatal and fatal < 2:
                strengths.append(f"Low fatal accident rate ({fatal:.1f}/100k)")
            elif fatal:
                gaps.append(f"Fatal accident rate ({fatal:.1f}/100k) above best practices")
            
            if rtw and rtw >= 70:
                strengths.append(f"Strong return-to-work success ({rtw:.0f}%)")
            elif rtw:
                gaps.append(f"RTW success at {rtw:.0f}% - could improve")
            
            insight = f"Workplace implementation in {country.name} shows "
            if oel:
                insight += f"{oel:.0f}% OEL compliance. "
            if fatal:
                insight += f"The fatal accident rate of {fatal:.1f} per 100,000 workers "
                insight += f"{'reflects effective safety measures' if fatal < 2 else 'indicates room for improvement'}."
            
            return {"insight": insight, "strengths": strengths, "gaps": gaps}
    
    elif element_type == "stage":
        if element_name == "inputs":
            ilo_count = (1 if (gov and gov.ilo_c187_status) else 0) + (1 if (gov and gov.ilo_c155_status) else 0)
            capacity = gov.strategic_capacity_score if gov else None
            reintegration = p3.reintegration_law if p3 else False
            
            strengths = []
            gaps = []
            
            if ilo_count == 2:
                strengths.append("Both key ILO conventions ratified")
            elif ilo_count == 1:
                gaps.append("Only 1 of 2 key ILO conventions ratified")
            else:
                gaps.append("No key ILO conventions ratified")
            
            if capacity and capacity >= 70:
                strengths.append(f"Strong strategic capacity ({capacity:.0f}%)")
            elif capacity:
                gaps.append(f"Strategic capacity at {capacity:.0f}%")
            
            if reintegration:
                strengths.append("Reintegration law in place")
            else:
                gaps.append("No formal reintegration law")
            
            insight = f"{country.name}'s input framework includes {ilo_count}/2 key ILO conventions"
            if capacity:
                insight += f" and {capacity:.0f}% strategic capacity"
            insight += f". {'Strong legal foundations support the system.' if len(strengths) > len(gaps) else 'Additional legal frameworks would strengthen the system.'}"
            
            return {"insight": insight, "strengths": strengths, "gaps": gaps}
        
        elif element_name == "processes":
            inspector = gov.inspector_density if gov else None
            surveillance = p2.surveillance_logic if p2 else None
            rehab = p3.rehab_access_score if p3 else None
            
            strengths = []
            gaps = []
            
            if inspector and inspector >= 1.0:
                strengths.append(f"Adequate inspector density ({inspector:.2f}/10k)")
            elif inspector:
                gaps.append(f"Inspector density ({inspector:.2f}/10k) below benchmark")
            
            if surveillance == "Risk-Based":
                strengths.append("Risk-based surveillance approach")
            elif surveillance:
                gaps.append(f"{surveillance} surveillance - not risk-based")
            
            if rehab and rehab >= 60:
                strengths.append(f"Good rehab access ({rehab:.0f}/100)")
            elif rehab:
                gaps.append(f"Limited rehab access ({rehab:.0f}/100)")
            
            insight = f"Operational processes in {country.name} "
            if inspector:
                insight += f"leverage {inspector:.2f} inspectors per 10,000 workers"
            if surveillance:
                insight += f" with {surveillance.lower()} surveillance"
            insight += f". {'Processes are well-structured.' if len(strengths) > len(gaps) else 'Process improvements would enhance outcomes.'}"
            
            return {"insight": insight, "strengths": strengths, "gaps": gaps}
        
        else:  # outcomes
            fatal = p1.fatal_accident_rate if p1 else None
            detection = p2.disease_detection_rate if p2 else None
            rtw = p3.return_to_work_success_pct if p3 else None
            
            strengths = []
            gaps = []
            
            if fatal and fatal < 2:
                strengths.append(f"Low fatal rate ({fatal:.1f}/100k)")
            elif fatal:
                gaps.append(f"Fatal rate ({fatal:.1f}/100k) above best practice")
            
            if detection and detection >= 50:
                strengths.append(f"Good disease detection ({detection:.0f}%)")
            elif detection:
                gaps.append(f"Disease detection at {detection:.0f}%")
            else:
                gaps.append("Disease detection data unavailable")
            
            if rtw and rtw >= 70:
                strengths.append(f"Strong RTW success ({rtw:.0f}%)")
            elif rtw:
                gaps.append(f"RTW success at {rtw:.0f}%")
            
            insight = f"Health outcomes in {country.name} show "
            parts = []
            if fatal:
                parts.append(f"a fatal rate of {fatal:.1f}/100k")
            if rtw:
                parts.append(f"{rtw:.0f}% RTW success")
            insight += ", ".join(parts) if parts else "limited data"
            insight += f". {'Outcomes reflect system effectiveness.' if len(strengths) > len(gaps) else 'Outcome improvements are needed.'}"
            
            return {"insight": insight, "strengths": strengths, "gaps": gaps}
    
    # Default fallback
    return {
        "insight": f"Analysis for {element_name} in {country.name} is being developed.",
        "strengths": [],
        "gaps": []
    }
