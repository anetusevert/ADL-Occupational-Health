"""Create orchestration tables (workflows, agents, agent_connections)

Revision ID: h7i8j9k0l1m2
Revises: g6h7i8j9k0l1
Create Date: 2026-01-29 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = 'h7i8j9k0l1m2'
down_revision = 'f5g6h7i8j9k0'  # Skip the success_count migration, we include it in table creation
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get connection to check if tables exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    # Create workflows table if not exists
    if 'workflows' not in existing_tables:
        op.create_table(
            'workflows',
            sa.Column('id', sa.String(50), primary_key=True),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('color', sa.String(20), nullable=True, server_default='cyan'),
            sa.Column('lane_order', sa.Integer, nullable=True, server_default='0'),
            sa.Column('is_default', sa.Boolean, nullable=False, server_default='false'),
            sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
            sa.Column('execution_count', sa.Integer, nullable=False, server_default='0'),
            sa.Column('success_count', sa.Integer, nullable=False, server_default='0'),
            sa.Column('last_run_at', sa.DateTime, nullable=True),
            sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        )
        print("Created 'workflows' table")
    else:
        # Add missing columns to existing workflows table
        existing_cols = [c['name'] for c in inspector.get_columns('workflows')]
        if 'success_count' not in existing_cols:
            op.add_column('workflows', sa.Column('success_count', sa.Integer, nullable=False, server_default='0'))
            print("Added 'success_count' column to workflows")
        if 'is_active' not in existing_cols:
            op.add_column('workflows', sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'))
        if 'execution_count' not in existing_cols:
            op.add_column('workflows', sa.Column('execution_count', sa.Integer, nullable=False, server_default='0'))
        if 'last_run_at' not in existing_cols:
            op.add_column('workflows', sa.Column('last_run_at', sa.DateTime, nullable=True))
    
    # Create agents table if not exists
    if 'agents' not in existing_tables:
        op.create_table(
            'agents',
            sa.Column('id', sa.String(50), primary_key=True),
            sa.Column('name', sa.String(100), nullable=False),
            sa.Column('description', sa.Text, nullable=True),
            sa.Column('category', sa.String(20), nullable=False, server_default='analysis'),
            sa.Column('workflow_id', sa.String(50), sa.ForeignKey('workflows.id'), nullable=True),
            sa.Column('system_prompt', sa.Text, nullable=True),
            sa.Column('user_prompt_template', sa.Text, nullable=True),
            sa.Column('icon', sa.String(50), nullable=True, server_default='bot'),
            sa.Column('color', sa.String(20), nullable=True, server_default='cyan'),
            sa.Column('order_in_workflow', sa.Integer, nullable=True, server_default='0'),
            sa.Column('position_x', sa.Float, nullable=True, server_default='0'),
            sa.Column('position_y', sa.Float, nullable=True, server_default='0'),
            sa.Column('llm_provider', sa.String(50), nullable=True),
            sa.Column('llm_model_name', sa.String(100), nullable=True),
            sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
            sa.Column('template_variables', JSONB, nullable=True),
            sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        )
        print("Created 'agents' table")
    
    # Create agent_connections table if not exists
    if 'agent_connections' not in existing_tables:
        op.create_table(
            'agent_connections',
            sa.Column('id', sa.String(100), primary_key=True),
            sa.Column('source_agent_id', sa.String(50), nullable=False),
            sa.Column('target_agent_id', sa.String(50), nullable=False),
            sa.Column('workflow_id', sa.String(50), nullable=True),
            sa.Column('connection_type', sa.String(20), nullable=True, server_default='data'),
            sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        )
        print("Created 'agent_connections' table")


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()
    
    if 'agent_connections' in existing_tables:
        op.drop_table('agent_connections')
    if 'agents' in existing_tables:
        op.drop_table('agents')
    if 'workflows' in existing_tables:
        op.drop_table('workflows')
