"""Add comparison_reports table for cached AI comparisons

Revision ID: k0l1m2n3o4p5
Revises: j9k0l1m2n3o4
Create Date: 2026-02-02 14:00:00.000000

Stores cached AI-generated comparison reports between Saudi Arabia
and benchmark countries. Reports are generated once and cached,
with admin-only regeneration capability.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'k0l1m2n3o4p5'
down_revision = 'j9k0l1m2n3o4'
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    # Create comparison_reports table (idempotent)
    if table_exists('comparison_reports'):
        return  # Already exists
    
    op.create_table(
        'comparison_reports',
        sa.Column('id', sa.String(10), primary_key=True, 
                  comment='Format: SAU_DEU, SAU_FRA, etc.'),
        sa.Column('primary_iso', sa.String(3), 
                  sa.ForeignKey('countries.iso_code', ondelete='CASCADE'),
                  nullable=False, default='SAU'),
        sa.Column('comparison_iso', sa.String(3), 
                  sa.ForeignKey('countries.iso_code', ondelete='CASCADE'),
                  nullable=False, index=True),
        
        # AI-generated content
        sa.Column('executive_summary', sa.Text, nullable=True,
                  comment='500-word strategic overview'),
        sa.Column('framework_analysis', JSONB, nullable=True,
                  comment='Per-pillar analysis array'),
        sa.Column('socioeconomic_comparison', JSONB, nullable=True,
                  comment='GDP, population, health metrics comparison'),
        sa.Column('metric_comparisons', JSONB, nullable=True,
                  comment='Detailed metric-by-metric comparison'),
        sa.Column('strategic_recommendations', JSONB, nullable=True,
                  comment='Prioritized recommendations array'),
        sa.Column('sources_cited', JSONB, nullable=True,
                  comment='Data sources used'),
        
        # Metadata
        sa.Column('created_at', sa.DateTime, nullable=False, 
                  server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=True,
                  onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(100), nullable=True,
                  comment='User email who generated'),
        sa.Column('version', sa.Integer, nullable=False, default=1),
        sa.Column('generation_time_seconds', sa.Float, nullable=True,
                  comment='Time taken to generate report'),
    )
    
    # Index for quick lookups by comparison country
    op.create_index(
        'ix_comparison_reports_comparison_iso',
        'comparison_reports',
        ['comparison_iso']
    )


def downgrade() -> None:
    op.drop_index('ix_comparison_reports_comparison_iso', 'comparison_reports')
    op.drop_table('comparison_reports')
