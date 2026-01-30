"""Add strategic_summary_text column

Revision ID: a1b2c3d4e5f6
Revises: 6eb52a7c8638
Create Date: 2026-01-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '6eb52a7c8638'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add strategic_summary_text column to countries table."""
    op.add_column(
        'countries',
        sa.Column(
            'strategic_summary_text',
            sa.Text(),
            nullable=True,
            comment='AI-generated qualitative strategic assessment from the Consultant Agent'
        )
    )


def downgrade() -> None:
    """Remove strategic_summary_text column from countries table."""
    op.drop_column('countries', 'strategic_summary_text')
