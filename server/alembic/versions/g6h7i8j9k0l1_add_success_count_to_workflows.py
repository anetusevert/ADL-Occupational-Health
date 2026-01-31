"""Add success_count to workflows table

Revision ID: g6h7i8j9k0l1
Revises: f5g6h7i8j9k0
Create Date: 2026-01-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g6h7i8j9k0l1'
down_revision = 'f5g6h7i8j9k0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add success_count column to workflows table if it doesn't exist
    # Using batch mode for SQLite compatibility
    try:
        op.add_column('workflows', sa.Column('success_count', sa.Integer(), nullable=False, server_default='0'))
    except Exception as e:
        print(f"Column may already exist: {e}")


def downgrade() -> None:
    try:
        op.drop_column('workflows', 'success_count')
    except Exception as e:
        print(f"Column may not exist: {e}")
