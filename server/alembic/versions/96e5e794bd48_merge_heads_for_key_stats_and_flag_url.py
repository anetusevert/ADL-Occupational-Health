"""Merge heads for key_stats and flag_url

Revision ID: 96e5e794bd48
Revises: 22b15c2dba08, l1m2n3o4p5q6
Create Date: 2026-02-04 23:56:58.423019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96e5e794bd48'
down_revision: Union[str, Sequence[str], None] = ('22b15c2dba08', 'l1m2n3o4p5q6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
