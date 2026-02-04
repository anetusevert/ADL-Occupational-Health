"""Add key_stats column to country_insights table

Revision ID: l1m2n3o4p5q6
Revises: k0l1m2n3o4p5
Create Date: 2026-02-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = 'l1m2n3o4p5q6'
down_revision: Union[str, None] = 'k0l1m2n3o4p5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add key_stats JSONB column to country_insights table
    # This stores structured key statistics for each insight:
    # [{label: str, value: str, description: str}, ...]
    op.add_column(
        'country_insights',
        sa.Column(
            'key_stats',
            JSONB,
            nullable=True,
            comment='Array of key stats: [{label, value, description}] - 6 stats per category'
        )
    )


def downgrade() -> None:
    op.drop_column('country_insights', 'key_stats')
