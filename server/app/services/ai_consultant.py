"""
GOHIP Platform - AI Consultant Agent Service
=============================================

Phase 4: The Consultant Agent
Generates qualitative strategic assessments using LLM (OpenAI GPT-4o)
based on the Sovereign OH Integrity Framework v3.0

This service:
1. Reads raw metrics from the PostgreSQL database
2. Constructs a structured prompt with framework rules
3. Calls the LLM to generate strategic assessment
4. Saves the output back to the database
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.country import (
    Country,
    GovernanceLayer,
    Pillar1Hazard,
    Pillar2Vigilance,
    Pillar3Restoration,
)

# Configure logging
logger = logging.getLogger(__name__)


# =============================================================================
# SOVEREIGN OH INTEGRITY FRAMEWORK - MATURITY STAGE DEFINITIONS
# =============================================================================

MATURITY_STAGES = """
SOVEREIGN OH INTEGRITY FRAMEWORK - MATURITY CLASSIFICATION:

Stage 1 - Nascent (Score 0-25): 
  - Minimal regulatory framework, high fatality rates (>5.0/100k)
  - No systematic surveillance, litigation-based compensation
  - Urgent need for foundational policy development

Stage 2 - Developing (Score 26-50):
  - Basic regulations exist but enforcement is weak
  - Fatality rates elevated (2.5-5.0/100k)
  - Some surveillance capacity, compensation system emerging

Stage 3 - Compliant (Score 51-75):
  - Solid regulatory framework with moderate enforcement
  - Fatality rates acceptable (1.0-2.5/100k)
  - Risk-based surveillance, no-fault compensation

Stage 4 - Resilient (Score 76-90):
  - Comprehensive framework with strong enforcement
  - Low fatality rates (0.5-1.0/100k)
  - Advanced surveillance, excellent rehabilitation access

Stage 5 - Exemplary (Score 91-100):
  - World-class framework, continuous improvement culture
  - Minimal fatality rates (<0.5/100k)
  - Predictive surveillance, integrated return-to-work systems
"""

# =============================================================================
# PROMPT TEMPLATES
# =============================================================================

SYSTEM_PROMPT = """You are a Senior Occupational Health Strategy Advisor reporting directly to Ministers of Labor and Health. Your assessments are used to inform billion-dollar policy decisions.

{framework_rules}

Your communication style:
- Be direct and ruthless in your analysis
- Use comparative language (compare to global benchmarks)
- Reference specific framework stages (e.g., "Stage 3 Compliant", "Stage 4 Resilient")
- Highlight critical gaps and opportunities
- Write for C-suite executives who demand actionable intelligence
"""

ASSESSMENT_PROMPT = """Generate a strategic assessment for the following country:

COUNTRY: {country_name} ({iso_code})
MATURITY SCORE: {maturity_score}

GOVERNANCE LAYER:
- ILO C187 Ratified: {ilo_c187}
- ILO C155 Ratified: {ilo_c155}
- Inspector Density: {inspector_density} per 10,000 workers
- Mental Health Policy: {mental_health_policy}
- Strategic Capacity Score: {governance_score}

PILLAR 1 - HAZARD CONTROL:
- Fatal Accident Rate: {fatal_rate} per 100,000 workers
- Carcinogen Exposure: {carcinogen_pct}% of workforce
- Heat Stress Regulation: {heat_stress_reg}
- Control Maturity Score: {hazard_score}

PILLAR 2 - HEALTH VIGILANCE:
- Surveillance Logic: {surveillance_logic}
- Disease Detection Rate: {disease_detection} per 100,000
- Vulnerability Index: {vulnerability_index}

PILLAR 3 - RESTORATION:
- Payer Mechanism: {payer_mechanism}
- Reintegration Law: {reintegration_law}
- Sickness Absence Days: {sickness_days} days/worker/year
- Rehabilitation Access Score: {rehab_score}

Write a 3-sentence strategic assessment for the Minister. Be direct, comparative, and reference the specific framework maturity stage. Focus on:
1. Current state classification with key metric highlights
2. Critical strength or vulnerability
3. Priority strategic recommendation
"""


# =============================================================================
# DATA EXTRACTION HELPERS
# =============================================================================

def extract_country_data(country: Country) -> Dict[str, Any]:
    """
    Extract all relevant data from a Country object and its relationships.
    
    Args:
        country: Country model instance with loaded relationships
        
    Returns:
        Dict containing all metrics for prompt construction
    """
    data = {
        "country_name": country.name,
        "iso_code": country.iso_code,
        "maturity_score": country.maturity_score or "Not calculated",
    }
    
    # Governance Layer
    gov = country.governance
    if gov:
        data.update({
            "ilo_c187": "Yes" if gov.ilo_c187_status else "No",
            "ilo_c155": "Yes" if gov.ilo_c155_status else "No",
            "inspector_density": gov.inspector_density or "Unknown",
            "mental_health_policy": "Yes" if gov.mental_health_policy else "No",
            "governance_score": gov.strategic_capacity_score or "Not calculated",
        })
    else:
        data.update({
            "ilo_c187": "Unknown",
            "ilo_c155": "Unknown",
            "inspector_density": "Unknown",
            "mental_health_policy": "Unknown",
            "governance_score": "Not calculated",
        })
    
    # Pillar 1: Hazard Control
    p1 = country.pillar_1_hazard
    if p1:
        data.update({
            "fatal_rate": p1.fatal_accident_rate or "Unknown",
            "carcinogen_pct": p1.carcinogen_exposure_pct or "Unknown",
            "heat_stress_reg": p1.heat_stress_reg_type if p1.heat_stress_reg_type else "Unknown",
            "hazard_score": p1.control_maturity_score or "Not calculated",
        })
    else:
        data.update({
            "fatal_rate": "Unknown",
            "carcinogen_pct": "Unknown",
            "heat_stress_reg": "Unknown",
            "hazard_score": "Not calculated",
        })
    
    # Pillar 2: Health Vigilance
    p2 = country.pillar_2_vigilance
    if p2:
        data.update({
            "surveillance_logic": p2.surveillance_logic if p2.surveillance_logic else "Unknown",
            "disease_detection": p2.disease_detection_rate or "Unknown",
            "vulnerability_index": p2.vulnerability_index or "Unknown",
        })
    else:
        data.update({
            "surveillance_logic": "Unknown",
            "disease_detection": "Unknown",
            "vulnerability_index": "Unknown",
        })
    
    # Pillar 3: Restoration
    p3 = country.pillar_3_restoration
    if p3:
        data.update({
            "payer_mechanism": p3.payer_mechanism if p3.payer_mechanism else "Unknown",
            "reintegration_law": "Yes" if p3.reintegration_law else "No",
            "sickness_days": p3.sickness_absence_days or "Unknown",
            "rehab_score": p3.rehab_access_score or "Not calculated",
        })
    else:
        data.update({
            "payer_mechanism": "Unknown",
            "reintegration_law": "Unknown",
            "sickness_days": "Unknown",
            "rehab_score": "Not calculated",
        })
    
    return data


# =============================================================================
# MOCK RESPONSE GENERATOR (When no API key available)
# =============================================================================

def generate_mock_assessment(data: Dict[str, Any]) -> str:
    """
    Generate a high-quality mock assessment when OpenAI API is unavailable.
    
    This provides realistic testing data based on actual metrics.
    
    Args:
        data: Country data dictionary
        
    Returns:
        Mock strategic assessment text
    """
    country_name = data["country_name"]
    iso_code = data["iso_code"]
    fatal_rate = data["fatal_rate"]
    maturity_score = data["maturity_score"]
    payer_mechanism = data["payer_mechanism"]
    
    # Determine maturity stage based on score
    if isinstance(maturity_score, (int, float)):
        if maturity_score >= 91:
            stage = "Stage 5 Exemplary"
        elif maturity_score >= 76:
            stage = "Stage 4 Resilient"
        elif maturity_score >= 51:
            stage = "Stage 3 Compliant"
        elif maturity_score >= 26:
            stage = "Stage 2 Developing"
        else:
            stage = "Stage 1 Nascent"
    else:
        # Infer from fatal rate if maturity score unavailable
        if isinstance(fatal_rate, (int, float)):
            if fatal_rate < 0.5:
                stage = "Stage 5 Exemplary"
            elif fatal_rate < 1.0:
                stage = "Stage 4 Resilient"
            elif fatal_rate < 2.5:
                stage = "Stage 3 Compliant"
            elif fatal_rate < 5.0:
                stage = "Stage 2 Developing"
            else:
                stage = "Stage 1 Nascent"
        else:
            stage = "Unclassified"
    
    # Generate country-specific assessments
    if iso_code == "DEU":
        return (
            f"{country_name} operates at {stage} within the Sovereign OH Integrity Framework, "
            f"demonstrating exceptional hazard control with a fatal accident rate of {fatal_rate}/100,000—"
            f"among the lowest globally and 75% below the EU average. "
            f"The nation's {payer_mechanism} compensation system, combined with mandatory return-to-work "
            f"legislation and 91.0% rehabilitation access, creates a comprehensive worker protection ecosystem "
            f"that should serve as the benchmark for industrialized economies. "
            f"Priority recommendation: Export this model to EU accession states and leverage inspector density "
            f"(0.9/10k workers) as a training resource for developing OECD partners."
        )
    
    elif iso_code == "SAU":
        return (
            f"{country_name} classifies as {stage}, with a fatal accident rate of {fatal_rate}/100,000 "
            f"that is approximately 4x higher than mature European systems like Germany (0.84/100k)—"
            f"a critical gap for a G20 economy undergoing rapid industrial diversification under Vision 2030. "
            f"While recent ILO engagement signals intent, the absence of C187 ratification and "
            f"litigation-based compensation create structural barriers to worker protection advancement. "
            f"Priority recommendation: Immediate focus on inspector capacity building and transition to "
            f"no-fault compensation to reduce fatal accident rate by 50% within 5 years."
        )
    
    elif iso_code == "SGP":
        return (
            f"{country_name} achieves {stage} status with a fatal accident rate of {fatal_rate}/100,000, "
            f"reflecting strong regulatory enforcement despite high industrial concentration in maritime "
            f"and petrochemical sectors. "
            f"The city-state's compact geography enables exceptional inspector density and rapid regulatory "
            f"response, though mental health surveillance remains an emerging priority. "
            f"Priority recommendation: Develop predictive analytics for heat stress management given "
            f"climate exposure, and expand mental health framework to maintain competitive workforce resilience."
        )
    
    elif iso_code == "GBR":
        return (
            f"{country_name} demonstrates {stage} performance within the Framework, with fatal rates "
            f"of {fatal_rate}/100,000 reflecting post-industrial economic transition and mature HSE governance. "
            f"The Health and Safety Executive's risk-based approach delivers strong outcomes, though Brexit-era "
            f"regulatory divergence from EU-OSHA standards creates monitoring complexity for multinational employers. "
            f"Priority recommendation: Strengthen bilateral recognition agreements with key trading partners "
            f"to maintain workforce mobility while preserving regulatory sovereignty."
        )
    
    else:
        # Generic assessment for other countries
        return (
            f"{country_name} ({iso_code}) currently operates at {stage} within the Sovereign OH Integrity Framework, "
            f"with a fatal accident rate of {fatal_rate}/100,000 workers. "
            f"The {payer_mechanism} compensation mechanism and current surveillance infrastructure "
            f"require strategic investment to advance maturity classification. "
            f"Priority recommendation: Conduct comprehensive gap analysis against Stage 4 Resilient "
            f"benchmarks to identify highest-impact intervention points."
        )


# =============================================================================
# LLM INTEGRATION
# =============================================================================

def call_openai_llm(system_prompt: str, user_prompt: str) -> Optional[str]:
    """
    Call OpenAI GPT-4o to generate assessment.
    
    Args:
        system_prompt: System context with framework rules
        user_prompt: User prompt with country data
        
    Returns:
        Generated assessment text or None if API call fails
    """
    if not settings.OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set - using mock response generator")
        return None
    
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import SystemMessage, HumanMessage
        
        # Initialize the LLM
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0.7,
            api_key=settings.OPENAI_API_KEY,
        )
        
        # Create messages
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
        
        # Generate response
        response = llm.invoke(messages)
        
        return response.content
        
    except ImportError as e:
        logger.error(f"LangChain/OpenAI import error: {e}")
        return None
    except Exception as e:
        logger.error(f"OpenAI API call failed: {e}")
        return None


# =============================================================================
# MAIN SERVICE FUNCTION
# =============================================================================

def generate_country_assessment(iso_code: str, db: Session) -> Dict[str, Any]:
    """
    Generate a qualitative strategic assessment for a country.
    
    This is the main entry point for the AI Consultant service.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        db: SQLAlchemy database session
        
    Returns:
        Dict containing:
        - success: bool
        - iso_code: str
        - country_name: str
        - assessment: str (the generated text)
        - source: str ("openai" or "mock")
        - error: str (if success is False)
    """
    logger.info(f"Generating assessment for country: {iso_code}")
    
    # Query the country with all relationships
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    
    if not country:
        logger.error(f"Country not found: {iso_code}")
        return {
            "success": False,
            "iso_code": iso_code,
            "country_name": None,
            "assessment": None,
            "source": None,
            "error": f"Country with ISO code '{iso_code}' not found in database",
        }
    
    # Extract all country data
    data = extract_country_data(country)
    logger.info(f"Extracted data for {country.name}: fatal_rate={data['fatal_rate']}")
    
    # Construct prompts
    system_prompt = SYSTEM_PROMPT.format(framework_rules=MATURITY_STAGES)
    user_prompt = ASSESSMENT_PROMPT.format(**data)
    
    # Try OpenAI first, fall back to mock
    assessment = call_openai_llm(system_prompt, user_prompt)
    
    if assessment:
        source = "openai"
        logger.info(f"Generated OpenAI assessment for {country.name}")
    else:
        assessment = generate_mock_assessment(data)
        source = "mock"
        logger.info(f"Generated mock assessment for {country.name}")
    
    # Save to database
    country.strategic_summary_text = assessment
    country.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        logger.info(f"Saved assessment to database for {country.name}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save assessment: {e}")
        return {
            "success": False,
            "iso_code": iso_code,
            "country_name": country.name,
            "assessment": assessment,
            "source": source,
            "error": f"Failed to save to database: {e}",
        }
    
    return {
        "success": True,
        "iso_code": iso_code,
        "country_name": country.name,
        "assessment": assessment,
        "source": source,
        "error": None,
    }


def get_country_assessment(iso_code: str, db: Session) -> Optional[str]:
    """
    Retrieve the existing strategic assessment for a country.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        db: SQLAlchemy database session
        
    Returns:
        The assessment text or None if not found
    """
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    
    if country:
        return country.strategic_summary_text
    return None
