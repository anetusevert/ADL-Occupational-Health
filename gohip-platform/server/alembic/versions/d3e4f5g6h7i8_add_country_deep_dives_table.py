"""Add country_deep_dives table for strategic analysis

Revision ID: d3e4f5g6h7i8
Revises: c2d3e4f5g6h7
Create Date: 2026-01-29 10:00:00.000000

Phase 27: Strategic Deep Dive Feature
- Stores AI-generated strategic country analyses
- Admin-only feature for comprehensive health policy reports
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd3e4f5g6h7i8'
down_revision = 'c2d3e4f5g6h7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum type for deep dive status
    deep_dive_status = postgresql.ENUM(
        'pending', 'processing', 'completed', 'failed',
        name='deepdivestatus',
        create_type=False
    )
    deep_dive_status.create(op.get_bind(), checkfirst=True)
    
    # Create country_deep_dives table
    op.create_table(
        'country_deep_dives',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('country_iso_code', sa.String(3), sa.ForeignKey('countries.iso_code', ondelete='CASCADE'), 
                  nullable=False, unique=True, index=True),
        
        # Status
        sa.Column('status', postgresql.ENUM('pending', 'processing', 'completed', 'failed', 
                  name='deepdivestatus', create_type=False), 
                  nullable=False, server_default='pending'),
        
        # Executive Summary & Narrative
        sa.Column('executive_summary', sa.Text, nullable=True),
        sa.Column('strategy_name', sa.String(200), nullable=True),
        sa.Column('strategic_narrative', sa.Text, nullable=True),
        
        # Key Findings & Insights
        sa.Column('key_findings', postgresql.JSONB, nullable=True),
        sa.Column('health_profile', sa.Text, nullable=True),
        sa.Column('workforce_insights', sa.Text, nullable=True),
        
        # SWOT Analysis
        sa.Column('strengths', postgresql.JSONB, nullable=True),
        sa.Column('weaknesses', postgresql.JSONB, nullable=True),
        sa.Column('opportunities', postgresql.JSONB, nullable=True),
        sa.Column('threats', postgresql.JSONB, nullable=True),
        
        # Recommendations & Action Items
        sa.Column('strategic_recommendations', postgresql.JSONB, nullable=True),
        sa.Column('action_items', postgresql.JSONB, nullable=True),
        sa.Column('priority_interventions', postgresql.JSONB, nullable=True),
        
        # Benchmarking & Comparisons
        sa.Column('peer_comparison', sa.Text, nullable=True),
        sa.Column('global_ranking_context', sa.Text, nullable=True),
        sa.Column('benchmark_countries', postgresql.JSONB, nullable=True),
        
        # Data Provenance & Sources
        sa.Column('data_sources_used', postgresql.JSONB, nullable=True),
        sa.Column('external_research_summary', sa.Text, nullable=True),
        sa.Column('data_quality_notes', sa.Text, nullable=True),
        
        # Generation Metadata
        sa.Column('ai_provider', sa.String(100), nullable=True),
        sa.Column('generation_log', postgresql.JSONB, nullable=True),
        sa.Column('generated_by_user_id', sa.String(36), nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        
        # Timestamps
        sa.Column('generated_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now(), 
                  onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('country_deep_dives')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS deepdivestatus')
