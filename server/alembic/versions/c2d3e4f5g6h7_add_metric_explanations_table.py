"""Add metric_explanations table

Revision ID: c2d3e4f5g6h7
Revises: b1c2d3e4f5g6
Create Date: 2026-01-28 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'c2d3e4f5g6h7'
down_revision: Union[str, None] = 'b1c2d3e4f5g6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create metric_explanations table."""
    op.create_table(
        'metric_explanations',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('country_iso_code', sa.String(3), nullable=False),
        sa.Column('pillar_id', sa.String(20), nullable=False),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('metric_value', sa.String(100), nullable=True),
        sa.Column('global_average', sa.Float(), nullable=True),
        sa.Column('percentile_rank', sa.Float(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('performance_analysis', sa.Text(), nullable=True),
        sa.Column('performance_rating', sa.String(20), nullable=False, server_default='moderate'),
        sa.Column('comparison_data', JSONB(), nullable=True),
        sa.Column('generated_by', sa.Integer(), nullable=True),
        sa.Column('ai_provider', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('country_iso_code', 'pillar_id', 'metric_name', name='uq_metric_explanation')
    )
    op.create_index('ix_metric_explanations_country_iso_code', 'metric_explanations', ['country_iso_code'])
    op.create_index('ix_metric_explanations_pillar_id', 'metric_explanations', ['pillar_id'])


def downgrade() -> None:
    """Drop metric_explanations table."""
    op.drop_index('ix_metric_explanations_pillar_id')
    op.drop_index('ix_metric_explanations_country_iso_code')
    op.drop_table('metric_explanations')
