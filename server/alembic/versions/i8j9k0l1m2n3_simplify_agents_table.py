"""Simplify agents table - remove workflow dependencies

Revision ID: i8j9k0l1m2n3
Revises: h7i8j9k0l1m2
Create Date: 2026-01-29 15:00:00.000000

This migration simplifies the agents table by:
1. Dropping the old tables (workflows, agents, agent_connections)
2. Recreating a simple agents table without workflow dependencies
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


revision = 'i8j9k0l1m2n3'
down_revision = 'h7i8j9k0l1m2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Drop old tables in correct order (foreign key dependencies)
    if 'agent_connections' in existing_tables:
        op.drop_table('agent_connections')
        print("Dropped 'agent_connections' table")
    
    # Check if agents table has workflow_id column (old schema)
    needs_recreate = False
    if 'agents' in existing_tables:
        cols = [c['name'] for c in inspector.get_columns('agents')]
        if 'workflow_id' in cols:
            needs_recreate = True
            op.drop_table('agents')
            print("Dropped old 'agents' table")
    
    if 'workflows' in existing_tables:
        op.drop_table('workflows')
        print("Dropped 'workflows' table")
    
    # Create new simplified agents table (only if we dropped it or it doesn't exist)
    existing_tables = inspector.get_table_names()  # Refresh
    if 'agents' in existing_tables:
        return  # Already exists with new schema
    
    op.create_table(
        'agents',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('system_prompt', sa.Text, nullable=True),
        sa.Column('user_prompt_template', sa.Text, nullable=True),
        sa.Column('template_variables', JSONB, nullable=True),
        sa.Column('icon', sa.String(50), nullable=True, server_default='bot'),
        sa.Column('color', sa.String(20), nullable=True, server_default='cyan'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('execution_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('last_run_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    print("Created new simplified 'agents' table")


def downgrade() -> None:
    # Drop new table
    op.drop_table('agents')
    
    # Recreate old structure (simplified - won't have all data)
    op.create_table(
        'workflows',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    
    op.create_table(
        'agents',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('workflow_id', sa.String(50), sa.ForeignKey('workflows.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
