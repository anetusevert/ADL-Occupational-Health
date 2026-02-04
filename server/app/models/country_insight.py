"""
GOHIP Platform - Country Insight Model
======================================

Stores AI-generated country insights with image data for the Country Dashboard.
Supports the central modal with "What is X?" and "What does this mean for OH?" sections.

Categories:
- Economic: labor-force, gdp-per-capita, population, unemployment
- Framework: governance, hazard-control, vigilance, restoration
- Country Insights: culture, oh-infrastructure, industry, urban, workforce, political
"""

from datetime import datetime
from typing import Optional
import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship, deferred

from app.core.database import Base


# ============================================================================
# ENUMS
# ============================================================================

class InsightCategory(str, enum.Enum):
    """Categories for country insights."""
    # Economic tiles
    labor_force = "labor-force"
    gdp_per_capita = "gdp-per-capita"
    population = "population"
    unemployment = "unemployment"
    # Framework pillars
    governance = "governance"
    hazard_control = "hazard-control"
    vigilance = "vigilance"
    restoration = "restoration"
    # Country insights
    culture = "culture"
    oh_infrastructure = "oh-infrastructure"
    industry = "industry"
    urban = "urban"
    workforce = "workforce"
    political = "political"


class InsightStatus(str, enum.Enum):
    """Status of insight generation."""
    pending = "pending"
    generating = "generating"
    completed = "completed"
    error = "error"


# ============================================================================
# COUNTRY INSIGHT MODEL
# ============================================================================

class CountryInsight(Base):
    """
    Stores AI-generated insights for country dashboard tiles.
    
    Each insight includes:
    - Multiple images for slideshow
    - "What is [Category]?" analysis (3-4 paragraphs)
    - "What does this mean for OH?" implications (3-4 paragraphs)
    - Generation metadata
    """
    __tablename__ = "country_insights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Country and Category
    country_iso = Column(
        String(3),
        nullable=False,
        index=True,
        comment="ISO 3166-1 alpha-3 country code"
    )
    category = Column(
        Enum(InsightCategory, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
        comment="Insight category (economic, framework, or country insight tile)"
    )
    
    # Images for slideshow
    images = Column(
        JSONB,
        nullable=True,
        comment="Array of image objects: [{url, thumbnailUrl, alt, photographer}]"
    )
    
    # AI-Generated Content (consulting-style, 3-4 paragraphs each)
    what_is_analysis = Column(
        Text,
        nullable=True,
        comment="'What is [Category]?' section - 3-4 paragraphs, factual, informative"
    )
    oh_implications = Column(
        Text,
        nullable=True,
        comment="'What does this mean for OH?' section - 3-4 paragraphs, no recommendations"
    )
    
    # Structured Key Stats (6 stats per category for tile display)
    # NOTE: Using deferred() to prevent "column does not exist" errors if migration hasn't run
    # The column will only be loaded when explicitly accessed
    key_stats = deferred(Column(
        JSONB,
        nullable=True,
        comment="Array of key stats: [{label, value, description}] - 6 stats per category"
    ))
    
    # Generation Status
    status = Column(
        Enum(InsightStatus, values_callable=lambda x: [e.value for e in x]),
        default=InsightStatus.pending,
        nullable=False,
        comment="Current status of insight generation"
    )
    error_message = Column(
        Text,
        nullable=True,
        comment="Error message if generation failed"
    )
    
    # Metadata
    generated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        comment="User ID who triggered generation (admin only)"
    )
    ai_provider = Column(
        String(50),
        nullable=True,
        comment="AI provider used for generation"
    )
    ai_model = Column(
        String(100),
        nullable=True,
        comment="AI model used for generation"
    )
    generation_tokens = Column(
        Integer,
        nullable=True,
        comment="Total tokens used for generation"
    )
    
    # Timestamps
    generated_at = Column(
        DateTime,
        nullable=True,
        comment="When the insight was last generated"
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
    
    # Unique constraint per country/category
    __table_args__ = (
        UniqueConstraint(
            'country_iso',
            'category',
            name='uq_country_insight'
        ),
    )
    
    # Relationships
    generated_by_user = relationship(
        "User",
        foreign_keys=[generated_by],
        lazy="joined"
    )
    
    def __repr__(self):
        return f"<CountryInsight(country='{self.country_iso}', category='{self.category.value}', status='{self.status.value}')>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        # Safely access key_stats (column may not exist in older databases)
        try:
            key_stats_value = self.key_stats or []
        except Exception:
            key_stats_value = []
        
        return {
            "id": self.id,
            "country_iso": self.country_iso,
            "category": self.category.value if self.category else None,
            "images": self.images or [],
            "what_is_analysis": self.what_is_analysis,
            "oh_implications": self.oh_implications,
            "key_stats": key_stats_value,
            "status": self.status.value if self.status else None,
            "error_message": self.error_message,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "generated_by": self.generated_by,
        }


# ============================================================================
# CATEGORY METADATA
# ============================================================================

CATEGORY_METADATA = {
    InsightCategory.labor_force: {
        "title": "Labor Force",
        "description": "Labor force participation, employment dynamics, and workforce composition",
        "image_queries": ["workforce", "office workers", "factory workers", "labor market"],
    },
    InsightCategory.gdp_per_capita: {
        "title": "Economic Output",
        "description": "GDP, economic growth, industrial composition, and productivity",
        "image_queries": ["economy", "business district", "trade", "industry"],
    },
    InsightCategory.population: {
        "title": "Demographics",
        "description": "Population structure, age distribution, urbanization, and life expectancy",
        "image_queries": ["population", "city crowd", "urban life", "demographics"],
    },
    InsightCategory.unemployment: {
        "title": "Employment Status",
        "description": "Unemployment rates, job market conditions, and employment challenges",
        "image_queries": ["job market", "employment", "career", "job seekers"],
    },
    InsightCategory.governance: {
        "title": "Governance",
        "description": "OH governance framework, regulatory bodies, and policy implementation",
        "image_queries": ["government building", "parliament", "regulatory", "policy"],
    },
    InsightCategory.hazard_control: {
        "title": "Hazard Control",
        "description": "Workplace hazard identification, risk assessment, and control measures",
        "image_queries": ["workplace safety", "industrial safety", "protective equipment", "hazard control"],
    },
    InsightCategory.vigilance: {
        "title": "Vigilance",
        "description": "Occupational health surveillance, monitoring systems, and reporting",
        "image_queries": ["health monitoring", "medical checkup", "surveillance", "health data"],
    },
    InsightCategory.restoration: {
        "title": "Restoration",
        "description": "Injury compensation, rehabilitation services, and return-to-work programs",
        "image_queries": ["rehabilitation", "physical therapy", "recovery", "medical care"],
    },
    InsightCategory.culture: {
        "title": "Culture & Society",
        "description": "Cultural norms, workplace culture, and social factors affecting OH",
        "image_queries": ["culture", "society", "traditions", "social life"],
    },
    InsightCategory.oh_infrastructure: {
        "title": "OH Infrastructure",
        "description": "Rehabilitation centers, OH institutions, research facilities, and service coverage",
        "image_queries": ["hospital", "medical facility", "rehabilitation center", "health infrastructure"],
    },
    InsightCategory.industry: {
        "title": "Industry & Economy",
        "description": "High-risk industries, accident-prone sectors, and economic drivers",
        "image_queries": ["industry", "factory", "construction", "manufacturing"],
    },
    InsightCategory.urban: {
        "title": "Urban Development",
        "description": "Urban infrastructure, facility distribution, and regional OH coverage",
        "image_queries": ["cityscape", "urban development", "city infrastructure", "modern city"],
    },
    InsightCategory.workforce: {
        "title": "Workforce Demographics",
        "description": "Migrant workers, vulnerable populations, informal employment, and demographics",
        "image_queries": ["workers", "labor force", "diverse workforce", "working people"],
    },
    InsightCategory.political: {
        "title": "Political Capacity",
        "description": "Government capacity to drive OH change, regulatory framework, and policy priorities",
        "image_queries": ["government", "politics", "policy making", "administration"],
    },
}
