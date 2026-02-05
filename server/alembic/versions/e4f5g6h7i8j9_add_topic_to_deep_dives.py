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


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def constraint_exists(table_name: str, constraint_name: str) -> bool:
    """Check if a constraint exists on a table."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    try:
        constraints = inspector.get_unique_constraints(table_name)
        return any(c['name'] == constraint_name for c in constraints)
    except Exception:
        return False


def upgrade() -> None:
    # 1. Add the topic column with a default value for existing records (idempotent)
    if not column_exists('country_deep_dives', 'topic'):
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
    
    # 2. Create index on topic for efficient queries (idempotent)
    try:
        op.create_index('ix_country_deep_dives_topic', 'country_deep_dives', ['topic'])
    except Exception:
        pass  # Index might already exist
    
    # 3. Drop the old unique constraint on country_iso_code
    # The constraint name might vary, try different names
    try:
        op.drop_constraint('country_deep_dives_country_iso_code_key', 'country_deep_dives', type_='unique')
    except Exception:
        pass  # Constraint might have different name or not exist
    
    # 4. Add composite unique constraint on (country_iso_code, topic) (idempotent)
    if not constraint_exists('country_deep_dives', 'uq_country_topic'):
        try:
            op.create_unique_constraint(
                'uq_country_topic', 
                'country_deep_dives', 
                ['country_iso_code', 'topic']
            )
        except Exception:
            pass  # Constraint might already exist


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
