"""
GOHIP Platform - Best Practices Models
Best Practices Compendium for Occupational Health Framework

Stores AI-generated best practice content organized by framework pillars and questions.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class BestPractice(Base):
    """
    Stores best practice overview content for each strategic question.
    
    One record per question across the 4 framework pillars (16 total questions).
    Content is AI-generated in McKinsey Senior Partner style.
    """
    __tablename__ = "best_practices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Question identification
    pillar = Column(
        String(50), 
        nullable=False, 
        comment="Framework pillar: governance, hazard, vigilance, restoration"
    )
    question_id = Column(
        String(50), 
        nullable=False, 
        unique=True,
        comment="Unique question ID: gov-q1, haz-q2, etc."
    )
    question_title = Column(
        String(200), 
        nullable=False,
        comment="Short question title"
    )
    question_text = Column(
        Text, 
        nullable=False,
        comment="Full strategic question text"
    )
    
    # AI-generated content (McKinsey-grade)
    best_practice_overview = Column(
        Text,
        nullable=True,
        comment="3-4 paragraph deep analysis of best practices"
    )
    key_principles = Column(
        JSONB,
        nullable=True,
        comment="Array of {title, description} principle objects"
    )
    implementation_elements = Column(
        JSONB,
        nullable=True,
        comment="Array of {element, description, examples} implementation guidance"
    )
    success_factors = Column(
        JSONB,
        nullable=True,
        comment="Array of critical success factors"
    )
    common_pitfalls = Column(
        JSONB,
        nullable=True,
        comment="Array of common mistakes to avoid"
    )
    
    # Top countries (cached for performance)
    top_countries = Column(
        JSONB,
        nullable=True,
        comment="Array of {iso_code, name, rank, score, summary} top performers"
    )
    
    # Metadata
    status = Column(
        String(20), 
        default="pending",
        comment="pending, generating, completed, failed"
    )
    error_message = Column(Text, nullable=True)
    generated_at = Column(DateTime, nullable=True)
    ai_provider = Column(String(100), nullable=True)
    generation_time_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<BestPractice {self.question_id}: {self.question_title}>"


class CountryBestPractice(Base):
    """
    Stores country-specific best practice analysis.
    
    One record per country per question, explaining how that specific
    country implements best practices for that question area.
    """
    __tablename__ = "country_best_practices"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign keys
    country_iso_code = Column(
        String(3), 
        ForeignKey("countries.iso_code", ondelete="CASCADE"),
        nullable=False
    )
    question_id = Column(
        String(50),
        ForeignKey("best_practices.question_id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Pillar for easy filtering (denormalized)
    pillar = Column(
        String(50), 
        nullable=False,
        comment="Framework pillar for this question"
    )
    
    # AI-generated content for this specific country
    approach_description = Column(
        Text,
        nullable=True,
        comment="How this country addresses the question - 2-3 paragraphs"
    )
    why_best_practice = Column(
        Text,
        nullable=True,
        comment="Why this approach is considered best practice - 2 paragraphs"
    )
    key_metrics = Column(
        JSONB,
        nullable=True,
        comment="Array of {metric, value, context} supporting data points"
    )
    policy_highlights = Column(
        JSONB,
        nullable=True,
        comment="Array of {policy, description, year_enacted} notable policies"
    )
    lessons_learned = Column(
        Text,
        nullable=True,
        comment="Key lessons from this country's experience"
    )
    transferability = Column(
        Text,
        nullable=True,
        comment="How other countries can adopt these practices"
    )
    
    # Country rank for this question (cached)
    rank = Column(Integer, nullable=True)
    score = Column(Integer, nullable=True)  # 0-100
    
    # Metadata
    status = Column(
        String(20), 
        default="pending",
        comment="pending, generating, completed, failed"
    )
    error_message = Column(Text, nullable=True)
    generated_at = Column(DateTime, nullable=True)
    ai_provider = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    country = relationship("Country", backref="best_practices")
    best_practice = relationship("BestPractice", backref="country_practices")
    
    __table_args__ = (
        UniqueConstraint('country_iso_code', 'question_id', name='uq_country_question'),
    )
    
    def __repr__(self):
        return f"<CountryBestPractice {self.country_iso_code}/{self.question_id}>"


# Strategic Questions Definition - matches frontend structure
STRATEGIC_QUESTIONS = [
    # Governance Pillar
    {
        "pillar": "governance",
        "question_id": "gov-q1",
        "question_title": "Legal Foundation",
        "question_text": "Does the country have comprehensive OH legislation aligned with ILO conventions?",
        "related_metrics": ["ilo_c155_ratified", "ilo_c187_ratified", "osh_act_enacted"],
    },
    {
        "pillar": "governance",
        "question_id": "gov-q2",
        "question_title": "Institutional Architecture",
        "question_text": "Are there dedicated institutions with clear mandates for OH policy and enforcement?",
        "related_metrics": ["national_oh_council", "ministry_dedicated_unit"],
    },
    {
        "pillar": "governance",
        "question_id": "gov-q3",
        "question_title": "Enforcement Capacity",
        "question_text": "Does the country have sufficient inspection resources to enforce OH standards?",
        "related_metrics": ["inspector_density", "inspections_per_year"],
    },
    {
        "pillar": "governance",
        "question_id": "gov-q4",
        "question_title": "Strategic Planning",
        "question_text": "Is there a current national OH strategy with measurable targets?",
        "related_metrics": ["national_oh_strategy", "strategy_current"],
    },
    
    # Hazard Control Pillar
    {
        "pillar": "hazard",
        "question_id": "haz-q1",
        "question_title": "Exposure Standards",
        "question_text": "Are occupational exposure limits set and enforced for key hazards?",
        "related_metrics": ["oel_compliance_rate", "chemical_registry"],
    },
    {
        "pillar": "hazard",
        "question_id": "haz-q2",
        "question_title": "Risk Assessment Systems",
        "question_text": "Is workplace risk assessment mandatory and systematically implemented?",
        "related_metrics": ["risk_assessment_mandatory", "risk_assessment_coverage"],
    },
    {
        "pillar": "hazard",
        "question_id": "haz-q3",
        "question_title": "Prevention Infrastructure",
        "question_text": "Are prevention services available and accessible to all workplaces?",
        "related_metrics": ["oh_service_coverage", "prevention_program_exists"],
    },
    {
        "pillar": "hazard",
        "question_id": "haz-q4",
        "question_title": "Safety Outcomes",
        "question_text": "What is the country's performance on preventing workplace injuries and fatalities?",
        "related_metrics": ["fatal_accident_rate", "non_fatal_injury_rate"],
    },
    
    # Vigilance Pillar
    {
        "pillar": "vigilance",
        "question_id": "vig-q1",
        "question_title": "Surveillance Architecture",
        "question_text": "Is there a systematic approach to detecting and recording occupational diseases?",
        "related_metrics": ["surveillance_system_exists", "disease_registry"],
    },
    {
        "pillar": "vigilance",
        "question_id": "vig-q2",
        "question_title": "Detection Capacity",
        "question_text": "How effectively are occupational diseases identified and attributed to work?",
        "related_metrics": ["disease_detection_rate", "attribution_accuracy"],
    },
    {
        "pillar": "vigilance",
        "question_id": "vig-q3",
        "question_title": "Data Quality",
        "question_text": "Is OH surveillance data comprehensive, reliable, and used for policy?",
        "related_metrics": ["data_completeness", "reporting_rate"],
    },
    {
        "pillar": "vigilance",
        "question_id": "vig-q4",
        "question_title": "Vulnerable Populations",
        "question_text": "Are high-risk and informal sector workers adequately monitored?",
        "related_metrics": ["informal_sector_coverage", "migrant_worker_coverage"],
    },
    
    # Restoration Pillar
    {
        "pillar": "restoration",
        "question_id": "rest-q1",
        "question_title": "Payer Architecture",
        "question_text": "Who finances workplace injury and disease compensation, and is coverage universal?",
        "related_metrics": ["compensation_coverage_rate", "insurance_type"],
    },
    {
        "pillar": "restoration",
        "question_id": "rest-q2",
        "question_title": "Benefit Adequacy",
        "question_text": "Are compensation benefits sufficient to maintain living standards during recovery?",
        "related_metrics": ["benefit_replacement_rate", "benefit_duration"],
    },
    {
        "pillar": "restoration",
        "question_id": "rest-q3",
        "question_title": "Rehabilitation Chain",
        "question_text": "Is there an integrated pathway from injury through treatment to return-to-work?",
        "related_metrics": ["rehab_program_exists", "rtw_support"],
    },
    {
        "pillar": "restoration",
        "question_id": "rest-q4",
        "question_title": "Recovery Outcomes",
        "question_text": "What percentage of injured workers successfully return to productive employment?",
        "related_metrics": ["rtw_success_rate", "rehab_participation_rate"],
    },
]


def get_questions_by_pillar(pillar: str) -> list:
    """Get all questions for a specific pillar."""
    return [q for q in STRATEGIC_QUESTIONS if q["pillar"] == pillar]


def get_question_by_id(question_id: str) -> dict | None:
    """Get a specific question by its ID."""
    for q in STRATEGIC_QUESTIONS:
        if q["question_id"] == question_id:
            return q
    return None
