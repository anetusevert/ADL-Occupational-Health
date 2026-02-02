"""Add cached_pillar_reports and cached_summary_reports tables

Revision ID: j9k0l1m2n3o4
Revises: i8j9k0l1m2n3
Create Date: 2026-02-02 12:00:00.000000

Persistent caching for pillar analysis and summary reports.
- Reports are generated once by admins
- Cached and served instantly to all users
- Admin can regenerate with force_regenerate flag
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'j9k0l1m2n3o4'
down_revision = 'i8j9k0l1m2n3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create cached_pillar_reports table
    op.create_table(
        'cached_pillar_reports',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('iso_code', sa.String(3), sa.ForeignKey('countries.iso_code', ondelete='CASCADE'), 
                  nullable=False, index=True),
        sa.Column('pillar_id', sa.String(50), nullable=False, index=True,
                  comment='governance, hazard-control, vigilance, restoration'),
        sa.Column('report_json', sa.Text, nullable=False, 
                  comment='Full JSON response from LLM'),
        sa.Column('generated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('generated_by_id', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), 
                  nullable=True),
        
        # Unique constraint: one report per country-pillar combination
        sa.UniqueConstraint('iso_code', 'pillar_id', name='uq_cached_pillar_report'),
    )
    
    # Create cached_summary_reports table
    op.create_table(
        'cached_summary_reports',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('iso_code', sa.String(3), sa.ForeignKey('countries.iso_code', ondelete='CASCADE'), 
                  nullable=False, unique=True, index=True),
        sa.Column('report_json', sa.Text, nullable=False,
                  comment='Full JSON response from LLM'),
        sa.Column('generated_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('generated_by_id', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), 
                  nullable=True),
    )


def downgrade() -> None:
    op.drop_table('cached_summary_reports')
    op.drop_table('cached_pillar_reports')
