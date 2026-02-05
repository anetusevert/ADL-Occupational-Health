"""Add user and AI config tables

Revision ID: b1c2d3e4f5g6
Revises: a1b2c3d4e5f6
Create Date: 2024-01-28 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b1c2d3e4f5g6'
down_revision = '30a72d216fde'
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    # Create UserRole enum (if not exists)
    connection = op.get_bind()
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'userrole'"))
    if not result.fetchone():
        user_role_enum = postgresql.ENUM('admin', 'user', 'viewer', name='userrole', create_type=False)
        user_role_enum.create(op.get_bind(), checkfirst=True)
    
    # Create AIProvider enum (if not exists)
    result = connection.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = 'aiprovider'"))
    if not result.fetchone():
        ai_provider_enum = postgresql.ENUM(
            'openai', 'anthropic', 'google', 'local', 'azure_openai', 'mistral', 'cohere', 'ollama',
            name='aiprovider', create_type=False
        )
        ai_provider_enum.create(op.get_bind(), checkfirst=True)
    
    # Create users table (idempotent)
    if not table_exists('users'):
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('hashed_password', sa.String(length=255), nullable=False),
            sa.Column('full_name', sa.String(length=255), nullable=True),
            sa.Column('role', postgresql.ENUM('admin', 'user', 'viewer', name='userrole', create_type=False), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
            sa.Column('is_verified', sa.Boolean(), nullable=False, default=False),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.Column('last_login', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    
    # Create ai_config table (idempotent)
    if not table_exists('ai_config'):
        op.create_table(
            'ai_config',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('provider', postgresql.ENUM(
                'openai', 'anthropic', 'google', 'local', 'azure_openai', 'mistral', 'cohere', 'ollama',
                name='aiprovider', create_type=False
            ), nullable=False),
            sa.Column('model_name', sa.String(length=100), nullable=False),
            sa.Column('api_key_encrypted', sa.Text(), nullable=True),
            sa.Column('api_endpoint', sa.String(length=500), nullable=True),
            sa.Column('temperature', sa.Float(), nullable=False, default=0.7),
            sa.Column('max_tokens', sa.Integer(), nullable=True),
            sa.Column('extra_settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
            sa.Column('is_configured', sa.Boolean(), nullable=False, default=False),
            sa.Column('configured_by', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['configured_by'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_ai_config_id'), 'ai_config', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ai_config_id'), table_name='ai_config')
    op.drop_table('ai_config')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS aiprovider')
    op.execute('DROP TYPE IF EXISTS userrole')
