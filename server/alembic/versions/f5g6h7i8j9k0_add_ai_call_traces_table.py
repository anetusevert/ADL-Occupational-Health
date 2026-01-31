"""Add ai_call_traces table for persistent AI API call logging

Revision ID: f5g6h7i8j9k0
Revises: e4f5g6h7i8j9
Create Date: 2026-01-31 10:00:00.000000

Phase 28: AI Call Tracing
- Create ai_call_traces table to store all AI provider API calls
- Adds indexes for efficient querying by timestamp, provider, success
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f5g6h7i8j9k0'
down_revision = 'e4f5g6h7i8j9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the ai_call_traces table
    op.create_table(
        'ai_call_traces',
        sa.Column('id', sa.String(36), primary_key=True, comment='Unique identifier for the trace'),
        sa.Column('timestamp', sa.DateTime, nullable=False, comment='When the API call was made'),
        sa.Column('provider', sa.String(50), nullable=False, comment='AI provider (openai, anthropic, google, etc.)'),
        sa.Column('model_name', sa.String(100), nullable=False, comment='Model identifier (gpt-4o, claude-3-opus, etc.)'),
        sa.Column('endpoint', sa.String(200), nullable=True, comment='API endpoint that triggered the call'),
        sa.Column('operation_type', sa.String(50), nullable=False, comment='Type of operation (deep_dive, assessment, test, metric_explanation)'),
        sa.Column('country_iso_code', sa.String(3), nullable=True, comment='Country ISO code if applicable'),
        sa.Column('topic', sa.String(200), nullable=True, comment='Topic or subject of the AI call'),
        sa.Column('latency_ms', sa.Integer, nullable=True, comment='Response time in milliseconds'),
        sa.Column('success', sa.Boolean, nullable=False, default=True, comment='Whether the call succeeded'),
        sa.Column('error_message', sa.Text, nullable=True, comment='Error message if the call failed'),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=True, comment='User who initiated the call'),
    )
    
    # Create indexes for common query patterns
    op.create_index('ix_ai_call_traces_timestamp', 'ai_call_traces', ['timestamp'])
    op.create_index('ix_ai_call_traces_provider', 'ai_call_traces', ['provider'])
    op.create_index('ix_ai_call_traces_success', 'ai_call_traces', ['success'])
    op.create_index('ix_ai_call_traces_country_iso_code', 'ai_call_traces', ['country_iso_code'])
    op.create_index('ix_ai_call_traces_timestamp_desc', 'ai_call_traces', [sa.text('timestamp DESC')])
    op.create_index('ix_ai_call_traces_provider_timestamp', 'ai_call_traces', ['provider', 'timestamp'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_ai_call_traces_provider_timestamp', 'ai_call_traces')
    op.drop_index('ix_ai_call_traces_timestamp_desc', 'ai_call_traces')
    op.drop_index('ix_ai_call_traces_country_iso_code', 'ai_call_traces')
    op.drop_index('ix_ai_call_traces_success', 'ai_call_traces')
    op.drop_index('ix_ai_call_traces_provider', 'ai_call_traces')
    op.drop_index('ix_ai_call_traces_timestamp', 'ai_call_traces')
    
    # Drop the table
    op.drop_table('ai_call_traces')
