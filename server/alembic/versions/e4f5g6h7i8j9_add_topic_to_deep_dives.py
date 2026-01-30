"""Add topic column to country_deep_dives for per-topic reports

Revision ID: e4f5g6h7i8j9
Revises: d3e4f5g6h7i8
Create Date: 2026-01-29 12:00:00.000000

Phase 27: Topic-Based Report Storage
- Add topic column to store which analysis topic the report covers
- Remove unique constraint on country_iso_code (now allows multiple reports per country)
- Add composite unique constraint on (country_iso_code, topic)
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e4f5g6h7i8j9'
down_revision = 'd3e4f5g6h7i8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add the topic column with a default value for existing records
    op.add_column(
        'country_deep_dives',
        sa.Column(
            'topic', 
            sa.String(100), 
            nullable=False,
            server_default='Comprehensive Occupational Health Assessment',
            comment='Analysis topic this report covers'
        )
    )
    
    # 2. Create index on topic for efficient queries
    op.create_index('ix_country_deep_dives_topic', 'country_deep_dives', ['topic'])
    
    # 3. Drop the old unique constraint on country_iso_code
    # The constraint name might vary, try different names
    try:
        op.drop_constraint('country_deep_dives_country_iso_code_key', 'country_deep_dives', type_='unique')
    except Exception:
        pass  # Constraint might have different name or not exist
    
    # 4. Add composite unique constraint on (country_iso_code, topic)
    op.create_unique_constraint(
        'uq_country_topic', 
        'country_deep_dives', 
        ['country_iso_code', 'topic']
    )


def downgrade() -> None:
    # 1. Drop the composite unique constraint
    op.drop_constraint('uq_country_topic', 'country_deep_dives', type_='unique')
    
    # 2. Drop the topic index
    op.drop_index('ix_country_deep_dives_topic', 'country_deep_dives')
    
    # 3. Drop the topic column
    op.drop_column('country_deep_dives', 'topic')
    
    # 4. Re-add the unique constraint on country_iso_code
    op.create_unique_constraint(
        'country_deep_dives_country_iso_code_key',
        'country_deep_dives',
        ['country_iso_code']
    )
