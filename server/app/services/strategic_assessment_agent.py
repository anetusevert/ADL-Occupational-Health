"""
GOHIP Platform - Strategic Assessment Agent
============================================

Phase 26.6: Dedicated Agent for Country Strategic Assessments

This agent generates comprehensive strategic assessments for countries
based on the Sovereign OH Integrity Framework v3.0, using:
- All pillar data from the database
- AI via the orchestration layer (configured provider)
- A focused prompt designed for ministerial-level intelligence
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decrypt_api_key
from app.models.country import Country, CountryIntelligence
from app.models.user import AIConfig, AIProvider
from app.services.ai_orchestrator import get_llm_from_config
from app.services.ai_call_tracer import AICallTracer

logger = logging.getLogger(__name__)


# =============================================================================
# STRATEGIC ASSESSMENT AGENT PROMPT
# =============================================================================

STRATEGIC_ASSESSMENT_SYSTEM_PROMPT = """You are a Senior Occupational Health Strategy Advisor reporting directly to Ministers of Labor and Health. Your assessments inform billion-dollar policy decisions and national occupational health strategies.

You operate within the SOVEREIGN OH INTEGRITY FRAMEWORK v3.0, which classifies countries into maturity stages:

MATURITY CLASSIFICATION:
- Stage 1 Nascent (0-25%): Minimal regulatory framework, high fatality rates (>5.0/100k), no systematic surveillance, litigation-based compensation. Urgent foundational development needed.
- Stage 2 Developing (26-50%): Basic regulations but weak enforcement, elevated fatality rates (2.5-5.0/100k), emerging compensation systems.
- Stage 3 Compliant (51-75%): Solid regulatory framework with moderate enforcement, acceptable fatality rates (1.0-2.5/100k), risk-based surveillance, no-fault compensation.
- Stage 4 Resilient (76-90%): Comprehensive framework with strong enforcement, low fatality rates (0.5-1.0/100k), advanced surveillance, excellent rehabilitation access.
- Stage 5 Exemplary (91-100%): World-class framework, continuous improvement culture, minimal fatality rates (<0.5/100k), predictive surveillance, integrated return-to-work systems.

COMMUNICATION STANDARDS:
- Be direct, precise, and ruthlessly analytical
- Always reference the specific maturity stage classification
- Compare metrics against global benchmarks (provide specific comparisons)
- Identify 2-3 critical strengths and 2-3 critical gaps
- Provide actionable, specific recommendations
- Write for C-suite executives who demand strategic intelligence
- Use data-driven language with specific numbers

GLOBAL BENCHMARKS FOR COMPARISON:
- Fatal Accident Rate: World avg 3.2/100k, EU avg 1.4/100k, Best 0.5/100k
- Inspector Density: Target 1.0/10k workers, Best 2.5/10k
- Rehabilitation Access: World avg 45/100, Best 95/100
- Disease Detection: World avg 45/100k, Best 200/100k
- Return-to-Work Success: World avg 55%, Best 90%"""


STRATEGIC_ASSESSMENT_USER_PROMPT = """Generate a comprehensive strategic assessment for the following country. Use ALL provided data (framework metrics, intelligence indicators, and data quality notes).

===== COUNTRY PROFILE =====
Country: {country_name}
ISO Code: {iso_code}
Overall Maturity Score: {maturity_score}%
Data Coverage: {data_coverage}

===== GOVERNANCE LAYER =====
- ILO C187 (Promotional Framework) Ratified: {ilo_c187}
- ILO C155 (OSH Convention) Ratified: {ilo_c155}
- Labor Inspector Density: {inspector_density} per 10,000 workers
- Workplace Mental Health Policy: {mental_health_policy}
- Strategic Capacity Score: {governance_score}/100

===== PILLAR 1: HAZARD CONTROL =====
- Fatal Accident Rate: {fatal_rate} per 100,000 workers
- Carcinogen Exposure: {carcinogen_pct}% of workforce
- Heat Stress Regulation Type: {heat_stress_reg}
- OEL (Occupational Exposure Limit) Compliance: {oel_compliance}%
- Control Maturity Score: {hazard_score}/100

===== PILLAR 2: HEALTH VIGILANCE =====
- Surveillance System Type: {surveillance_logic}
- Occupational Disease Detection Rate: {disease_detection} per 100,000
- Workforce Vulnerability Index: {vulnerability_index}/100
- Migrant Worker Percentage: {migrant_pct}%

===== PILLAR 3: RESTORATION =====
- Compensation Payer Mechanism: {payer_mechanism}
- Mandatory Reintegration Law: {reintegration_law}
- Average Sickness Absence: {sickness_days} days/worker/year
- Rehabilitation Access Score: {rehab_score}/100
- Return-to-Work Success Rate: {rtw_success}%

===== INTELLIGENCE INDICATORS =====
{intelligence_text}

===== DATA QUALITY =====
{data_quality_notes}

===== INSTRUCTIONS =====
Write a strategic assessment (6-10 sentences) that includes:
1. Framework maturity stage classification with key metric highlights
2. Two critical strengths compared to global benchmarks
3. Two critical gaps or vulnerabilities requiring attention
4. One specific, actionable priority recommendation
5. A brief data confidence note based on data quality

Be direct, use specific numbers, and reference global comparisons. Do not use headings or bullet points."""


# =============================================================================
# DATA EXTRACTION
# =============================================================================

def extract_assessment_data(country: Country) -> Dict[str, Any]:
    """Extract all data needed for strategic assessment."""
    data = {
        "country_name": country.name,
        "iso_code": country.iso_code,
        "maturity_score": country.maturity_score or "Not calculated",
        "data_coverage": "High" if country.maturity_score else "Partial",
    }
    
    # Governance Layer
    gov = country.governance
    if gov:
        data.update({
            "ilo_c187": "Yes" if gov.ilo_c187_status else "No",
            "ilo_c155": "Yes" if gov.ilo_c155_status else "No",
            "inspector_density": f"{gov.inspector_density:.2f}" if gov.inspector_density else "Unknown",
            "mental_health_policy": "Yes" if gov.mental_health_policy else "No",
            "governance_score": gov.strategic_capacity_score or "N/A",
        })
    else:
        data.update({
            "ilo_c187": "Unknown", "ilo_c155": "Unknown",
            "inspector_density": "Unknown", "mental_health_policy": "Unknown",
            "governance_score": "N/A",
        })
    
    # Pillar 1: Hazard Control
    p1 = country.pillar_1_hazard
    if p1:
        data.update({
            "fatal_rate": f"{p1.fatal_accident_rate:.2f}" if p1.fatal_accident_rate else "Unknown",
            "carcinogen_pct": f"{p1.carcinogen_exposure_pct:.1f}" if p1.carcinogen_exposure_pct else "Unknown",
            "heat_stress_reg": p1.heat_stress_reg_type if p1.heat_stress_reg_type else "Unknown",
            "oel_compliance": f"{p1.oel_compliance_pct:.0f}" if p1.oel_compliance_pct else "Unknown",
            "hazard_score": p1.control_maturity_score or "N/A",
        })
    else:
        data.update({
            "fatal_rate": "Unknown", "carcinogen_pct": "Unknown",
            "heat_stress_reg": "Unknown", "oel_compliance": "Unknown",
            "hazard_score": "N/A",
        })
    
    # Pillar 2: Health Vigilance
    p2 = country.pillar_2_vigilance
    if p2:
        data.update({
            "surveillance_logic": p2.surveillance_logic if p2.surveillance_logic else "Unknown",
            "disease_detection": f"{p2.disease_detection_rate:.1f}" if p2.disease_detection_rate else "Unknown",
            "vulnerability_index": f"{p2.vulnerability_index:.0f}" if p2.vulnerability_index else "Unknown",
            "migrant_pct": f"{p2.migrant_worker_pct:.1f}" if p2.migrant_worker_pct else "Unknown",
        })
    else:
        data.update({
            "surveillance_logic": "Unknown", "disease_detection": "Unknown",
            "vulnerability_index": "Unknown", "migrant_pct": "Unknown",
        })
    
    # Pillar 3: Restoration
    p3 = country.pillar_3_restoration
    if p3:
        data.update({
            "payer_mechanism": p3.payer_mechanism if p3.payer_mechanism else "Unknown",
            "reintegration_law": "Yes" if p3.reintegration_law else "No",
            "sickness_days": f"{p3.sickness_absence_days:.1f}" if p3.sickness_absence_days else "Unknown",
            "rehab_score": p3.rehab_access_score or "N/A",
            "rtw_success": f"{p3.return_to_work_success_pct:.0f}" if p3.return_to_work_success_pct else "Unknown",
        })
    else:
        data.update({
            "payer_mechanism": "Unknown", "reintegration_law": "Unknown",
            "sickness_days": "Unknown", "rehab_score": "N/A",
            "rtw_success": "Unknown",
        })
    
    return data


# =============================================================================
# INTELLIGENCE CONTEXT
# =============================================================================

def extract_intelligence_context(intelligence: Optional[CountryIntelligence]) -> str:
    """Extract and format intelligence data for LLM consumption."""
    if not intelligence:
        return "No intelligence data available for this country."
    
    lines = []
    
    # Governance Intelligence
    gov_parts = []
    if intelligence.corruption_perception_index is not None:
        gov_parts.append(
            f"Corruption Perception Index: {intelligence.corruption_perception_index}/100"
        )
    if intelligence.rule_of_law_index is not None:
        gov_parts.append(f"Rule of Law Index: {intelligence.rule_of_law_index:.2f}")
    if intelligence.government_effectiveness is not None:
        gov_parts.append(
            f"Government Effectiveness: {intelligence.government_effectiveness:.2f} (WB)"
        )
    if intelligence.regulatory_enforcement_score is not None:
        gov_parts.append(
            f"Regulatory Enforcement: {intelligence.regulatory_enforcement_score:.2f}"
        )
    if gov_parts:
        lines.append("Governance: " + "; ".join(gov_parts))
    
    # Hazard Control Intelligence
    hazard_parts = []
    if intelligence.daly_occupational_total is not None:
        hazard_parts.append(
            f"Occupational DALYs: {intelligence.daly_occupational_total:.1f}/100k"
        )
    if intelligence.deaths_occupational_total is not None:
        hazard_parts.append(
            f"Occupational Deaths: {intelligence.deaths_occupational_total:.1f}/100k"
        )
    if intelligence.epi_score is not None:
        hazard_parts.append(f"EPI Score: {intelligence.epi_score:.1f}/100")
    if hazard_parts:
        lines.append("Hazard: " + "; ".join(hazard_parts))
    
    # Health Vigilance Intelligence
    vigilance_parts = []
    if intelligence.uhc_service_coverage_index is not None:
        vigilance_parts.append(
            f"UHC Coverage: {intelligence.uhc_service_coverage_index:.1f}/100"
        )
    if intelligence.health_workforce_density is not None:
        vigilance_parts.append(
            f"Health Workers: {intelligence.health_workforce_density:.1f}/10k"
        )
    if intelligence.life_expectancy_at_birth is not None:
        vigilance_parts.append(
            f"Life Expectancy: {intelligence.life_expectancy_at_birth:.1f} years"
        )
    if vigilance_parts:
        lines.append("Vigilance: " + "; ".join(vigilance_parts))
    
    # Restoration Intelligence
    restoration_parts = []
    if intelligence.hdi_score is not None:
        restoration_parts.append(
            f"HDI: {intelligence.hdi_score:.3f}"
        )
    if intelligence.education_index is not None:
        restoration_parts.append(
            f"Education Index: {intelligence.education_index:.3f}"
        )
    if intelligence.unemployment_rate is not None:
        restoration_parts.append(
            f"Unemployment Rate: {intelligence.unemployment_rate:.1f}%"
        )
    if restoration_parts:
        lines.append("Restoration: " + "; ".join(restoration_parts))
    
    # Economic Context
    economic_parts = []
    if intelligence.gdp_per_capita_ppp is not None:
        economic_parts.append(
            f"GDP per Capita (PPP): ${intelligence.gdp_per_capita_ppp:,.0f}"
        )
    if intelligence.population_total is not None:
        economic_parts.append(
            f"Population: {intelligence.population_total:,.0f}"
        )
    if intelligence.urban_population_pct is not None:
        economic_parts.append(
            f"Urban Population: {intelligence.urban_population_pct:.1f}%"
        )
    if economic_parts:
        lines.append("Economic: " + "; ".join(economic_parts))
    
    return " | ".join(lines) if lines else "No intelligence data available for this country."


def summarize_data_quality(
    country_data: Dict[str, Any],
    intelligence: Optional[CountryIntelligence]
) -> str:
    """Summarize data coverage and freshness for the assessment."""
    missing_fields = [
        key for key, value in country_data.items()
        if value in ("Unknown", "N/A", "Not calculated")
    ]
    total_fields = len(country_data)
    populated_fields = total_fields - len(missing_fields)
    coverage_note = f"Framework data coverage: {populated_fields}/{total_fields} fields populated."
    
    if intelligence:
        update_dates = [
            intelligence.last_ilostat_update,
            intelligence.last_worldbank_update,
            intelligence.last_who_update,
            intelligence.last_ihme_update,
            intelligence.last_epi_update,
            intelligence.last_cpi_update,
            intelligence.last_wjp_update,
            intelligence.last_undp_update,
            intelligence.last_oecd_update,
        ]
        update_dates = [d for d in update_dates if d]
        if update_dates:
            latest_update = max(update_dates).date().isoformat()
            freshness_note = f"Latest intelligence update: {latest_update}."
        else:
            freshness_note = "Intelligence update dates are not available."
        intelligence_note = "Intelligence layer data available."
    else:
        intelligence_note = "No intelligence layer data available."
        freshness_note = "Intelligence update dates are not available."
    
    return f"{coverage_note} {intelligence_note} {freshness_note}"


# =============================================================================
# LLM INTEGRATION
# =============================================================================

def get_llm_from_ai_config(config: AIConfig):
    """Get LangChain LLM from AI configuration."""
    api_key = None
    if config.api_key_encrypted:
        api_key = decrypt_api_key(config.api_key_encrypted)
    
    provider = config.provider
    model = config.model_name
    temperature = config.temperature
    
    logger.info(f"Initializing LLM: provider={provider.value}, model={model}")
    
    try:
        if provider == AIProvider.openai:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=model,
                temperature=temperature,
                api_key=api_key,
                max_tokens=config.max_tokens or 2000,
                request_timeout=60,  # 60 second timeout
            )
        
        elif provider == AIProvider.anthropic:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=model,
                temperature=temperature,
                api_key=api_key,
                max_tokens=config.max_tokens or 2000,
            )
        
        elif provider == AIProvider.google:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=model,
                temperature=temperature,
                google_api_key=api_key,
                max_output_tokens=config.max_tokens or 2000,
            )
        
        elif provider == AIProvider.azure_openai:
            from langchain_openai import AzureChatOpenAI
            return AzureChatOpenAI(
                deployment_name=model,
                temperature=temperature,
                api_key=api_key,
                azure_endpoint=config.api_endpoint,
                api_version="2024-02-01",
            )
        
        elif provider == AIProvider.mistral:
            from langchain_mistralai import ChatMistralAI
            return ChatMistralAI(
                model=model,
                temperature=temperature,
                api_key=api_key,
            )
        
        elif provider == AIProvider.ollama:
            from langchain_community.chat_models import ChatOllama
            return ChatOllama(
                model=model,
                temperature=temperature,
                base_url=config.api_endpoint or "http://localhost:11434",
            )
        
        else:
            raise ValueError(f"Unsupported AI provider: {provider}")
            
    except ImportError as e:
        logger.error(f"Failed to import LLM library for {provider}: {e}")
        raise
    except Exception as e:
        logger.error(f"Failed to initialize LLM: {e}")
        raise


def generate_assessment_with_llm(
    config: AIConfig,
    country_data: Dict[str, Any],
    intelligence_text: str,
    data_quality_notes: str,
    db: Optional[Session] = None,
    user_id: Optional[int] = None,
) -> Optional[str]:
    """Generate strategic assessment using orchestrated LLM configuration."""
    import time
    start_time = time.time()
    success = False
    error_message = None
    
    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        
        llm = get_llm_from_config(config)
        
        user_prompt = STRATEGIC_ASSESSMENT_USER_PROMPT.format(
            **country_data,
            intelligence_text=intelligence_text,
            data_quality_notes=data_quality_notes
        )
        
        messages = [
            SystemMessage(content=STRATEGIC_ASSESSMENT_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]
        
        logger.info(f"Calling LLM for strategic assessment of {country_data['country_name']}")
        
        response = llm.invoke(messages)
        
        success = True
        return response.content.strip()
        
    except Exception as e:
        logger.error(f"LLM assessment generation failed: {e}")
        error_message = str(e)
        raise
    finally:
        # Log the trace if db session is available
        if db:
            latency_ms = int((time.time() - start_time) * 1000)
            try:
                AICallTracer.trace(
                    db=db,
                    provider=config.provider.value,
                    model_name=config.model_name,
                    operation_type="strategic_assessment",
                    success=success,
                    latency_ms=latency_ms,
                    endpoint="/api/v1/countries/{iso}/strategic-assessment",
                    country_iso_code=country_data.get("iso_code"),
                    topic="Strategic Assessment",
                    error_message=error_message,
                    user_id=user_id,
                )
            except Exception as trace_error:
                logger.warning(f"Failed to log AI call trace: {trace_error}")


# =============================================================================
# FALLBACK ASSESSMENT GENERATOR
# =============================================================================

def generate_fallback_assessment(data: Dict[str, Any]) -> str:
    """Generate high-quality assessment without LLM (fallback)."""
    country_name = data["country_name"]
    iso_code = data["iso_code"]
    maturity_score = data["maturity_score"]
    fatal_rate = data.get("fatal_rate", "Unknown")
    rehab_score = data.get("rehab_score", "N/A")
    governance_score = data.get("governance_score", "N/A")
    payer_mechanism = data.get("payer_mechanism", "Unknown")
    ilo_c187 = data.get("ilo_c187", "Unknown")
    inspector_density = data.get("inspector_density", "Unknown")
    
    # Determine stage
    if isinstance(maturity_score, (int, float)):
        if maturity_score >= 91:
            stage = "Stage 5 Exemplary"
            stage_desc = "world-class occupational health governance"
        elif maturity_score >= 76:
            stage = "Stage 4 Resilient"
            stage_desc = "comprehensive and well-enforced occupational health framework"
        elif maturity_score >= 51:
            stage = "Stage 3 Compliant"
            stage_desc = "solid regulatory framework with moderate enforcement"
        elif maturity_score >= 26:
            stage = "Stage 2 Developing"
            stage_desc = "emerging occupational health infrastructure requiring strengthening"
        else:
            stage = "Stage 1 Nascent"
            stage_desc = "foundational development urgently needed"
    else:
        stage = "Unclassified"
        stage_desc = "requiring comprehensive assessment"
    
    # Build assessment
    assessment_parts = []
    
    # Opening classification
    assessment_parts.append(
        f"{country_name} operates at {stage} within the Sovereign OH Integrity Framework, "
        f"demonstrating {stage_desc}."
    )
    
    # Metrics analysis
    if fatal_rate != "Unknown":
        try:
            fatal_val = float(fatal_rate)
            if fatal_val < 1.0:
                assessment_parts.append(
                    f"The fatal accident rate of {fatal_rate}/100,000 workers is significantly "
                    f"below the global average of 3.2/100,000, reflecting strong hazard control."
                )
            elif fatal_val < 2.5:
                assessment_parts.append(
                    f"The fatal accident rate of {fatal_rate}/100,000 workers is within acceptable "
                    f"range but remains above best-practice benchmarks of 0.5-1.0/100,000."
                )
            else:
                assessment_parts.append(
                    f"The fatal accident rate of {fatal_rate}/100,000 workers exceeds global averages "
                    f"and requires immediate intervention to reduce workplace fatalities."
                )
        except:
            pass
    
    # Governance strength or gap
    if ilo_c187 == "Yes":
        assessment_parts.append(
            f"ILO C187 ratification demonstrates commitment to the international promotional framework."
        )
    else:
        assessment_parts.append(
            f"The absence of ILO C187 ratification represents a governance gap that limits "
            f"alignment with international best practices."
        )
    
    # Recommendation
    if isinstance(maturity_score, (int, float)) and maturity_score < 75:
        assessment_parts.append(
            f"Priority recommendation: Focus on strengthening inspector capacity and transitioning "
            f"to a {payer_mechanism if payer_mechanism != 'No-Fault' else 'comprehensive'} "
            f"compensation system to accelerate maturity advancement."
        )
    else:
        assessment_parts.append(
            f"Priority recommendation: Maintain excellence through continuous improvement and "
            f"serve as a benchmark model for regional partners."
        )
    
    return " ".join(assessment_parts)


# =============================================================================
# MAIN SERVICE FUNCTION
# =============================================================================

def generate_strategic_assessment(
    iso_code: str,
    db: Session,
    force_regenerate: bool = False
) -> Dict[str, Any]:
    """
    Generate a comprehensive strategic assessment for a country.
    
    This is the main entry point for the Strategic Assessment Agent.
    Uses the configured AI provider from the orchestration layer.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        db: SQLAlchemy database session
        force_regenerate: If True, regenerate even if exists
        
    Returns:
        Dict with success status, assessment, and metadata
    """
    logger.info(f"Strategic Assessment Agent: Generating for {iso_code}")
    
    iso_code = iso_code.upper()
    
    # Get country
    country = db.query(Country).filter(Country.iso_code == iso_code).first()
    if not country:
        return {
            "success": False,
            "iso_code": iso_code,
            "country_name": None,
            "assessment": None,
            "source": None,
            "error": f"Country with ISO code '{iso_code}' not found in database",
        }
    
    # Check if assessment already exists and not forcing regeneration
    if country.strategic_summary_text and not force_regenerate:
        logger.info(f"Using existing assessment for {country.name}")
        return {
            "success": True,
            "iso_code": iso_code,
            "country_name": country.name,
            "assessment": country.strategic_summary_text,
            "source": "cached",
            "generated_at": country.updated_at.isoformat() if country.updated_at else None,
        }
    
    # Extract data for assessment
    country_data = extract_assessment_data(country)
    logger.info(f"Extracted data for {country.name}: maturity={country_data['maturity_score']}")
    
    # Pull intelligence data for richer context
    intelligence = db.query(CountryIntelligence).filter(
        CountryIntelligence.country_iso_code == iso_code
    ).first()
    intelligence_text = extract_intelligence_context(intelligence)
    data_quality_notes = summarize_data_quality(country_data, intelligence)
    
    # Get AI configuration
    ai_config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    
    assessment = None
    source = None
    
    if ai_config and ai_config.is_configured:
        try:
            provider_name = f"{ai_config.provider.value}/{ai_config.model_name}"
            logger.info(f"Using AI provider: {provider_name}")
            
            assessment = generate_assessment_with_llm(
                ai_config,
                country_data,
                intelligence_text,
                data_quality_notes,
                db=db,
            )
            source = f"{provider_name} (orchestrated)"
            logger.info(f"Successfully generated AI assessment for {country.name}")
            
        except Exception as e:
            logger.warning(f"AI generation failed, using fallback: {e}")
            assessment = generate_fallback_assessment(country_data)
            source = "fallback"
    else:
        logger.info("No AI config, using fallback generator")
        assessment = generate_fallback_assessment(country_data)
        source = "fallback"
    
    # Save to database
    country.strategic_summary_text = assessment
    country.updated_at = datetime.utcnow()
    
    try:
        db.commit()
        logger.info(f"Saved strategic assessment for {country.name}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save assessment: {e}")
        return {
            "success": False,
            "iso_code": iso_code,
            "country_name": country.name,
            "assessment": assessment,
            "source": source,
            "error": f"Failed to save to database: {str(e)}",
        }
    
    return {
        "success": True,
        "iso_code": iso_code,
        "country_name": country.name,
        "assessment": assessment,
        "source": source,
        "generated_at": datetime.utcnow().isoformat(),
    }
