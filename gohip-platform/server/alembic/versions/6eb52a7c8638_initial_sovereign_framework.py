"""Initial Sovereign Framework

Revision ID: 6eb52a7c8638
Revises: 
Create Date: 2026-01-28 15:00:39.055002

Sovereign OH Integrity Framework v3.0
Creates the 4-layer strategic framework:
- Countries (parent table)
- Governance Layer
- Pillar 1: Hazard Control
- Pillar 2: Health Vigilance
- Pillar 3: Restoration
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '6eb52a7c8638'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Enum types for the framework
heat_stress_reg_type = postgresql.ENUM(
    'Strict', 'Advisory', 'None',
    name='heatstressregulationtype'
)
surveillance_logic_type = postgresql.ENUM(
    'Risk-Based', 'Mandatory', 'None',
    name='surveillancelogictype'
)
payer_mechanism_type = postgresql.ENUM(
    'No-Fault', 'Litigation',
    name='payermechanismtype'
)


def upgrade() -> None:
    """Create all tables for the Sovereign OH Integrity Framework."""
    
    # Create ENUM types
    heat_stress_reg_type.create(op.get_bind(), checkfirst=True)
    surveillance_logic_type.create(op.get_bind(), checkfirst=True)
    payer_mechanism_type.create(op.get_bind(), checkfirst=True)
    
    # =========================================================================
    # COUNTRIES TABLE (Parent Entity)
    # =========================================================================
    op.create_table(
        'countries',
        sa.Column('iso_code', sa.String(3), primary_key=True, index=True),
        sa.Column('name', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('maturity_score', sa.Float, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=True, onupdate=sa.func.now()),
    )
    
    # =========================================================================
    # GOVERNANCE LAYER TABLE
    # =========================================================================
    op.create_table(
        'governance_layer',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column(
            'country_iso_code',
            sa.String(3),
            sa.ForeignKey('countries.iso_code', ondelete='CASCADE'),
            unique=True,
            nullable=False,
            index=True
        ),
        # ILO Convention Ratification Status
        sa.Column('ilo_c187_status', sa.Boolean, nullable=True,
                  comment='ILO C187 Promotional Framework ratified'),
        sa.Column('ilo_c155_status', sa.Boolean, nullable=True,
                  comment='ILO C155 Occupational Safety & Health ratified'),
        # Structural Indicators
        sa.Column('inspector_density', sa.Float, nullable=True,
                  comment='Inspectors per 10,000 workers'),
        sa.Column('mental_health_policy', sa.Boolean, nullable=True,
                  comment='National workplace mental health policy exists'),
        # Computed Score
        sa.Column('strategic_capacity_score', sa.Float, nullable=True,
                  comment='Aggregate governance capacity (0-100)'),
        # Source Documentation
        sa.Column('source_urls', postgresql.JSONB, nullable=True,
                  comment='Source URLs for all data points'),
        # Timestamps
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=True, onupdate=sa.func.now()),
    )
    
    # =========================================================================
    # PILLAR 1: HAZARD CONTROL TABLE
    # =========================================================================
    op.create_table(
        'pillar_1_hazard',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column(
            'country_iso_code',
            sa.String(3),
            sa.ForeignKey('countries.iso_code', ondelete='CASCADE'),
            unique=True,
            nullable=False,
            index=True
        ),
        # Core Metrics
        sa.Column('fatal_accident_rate', sa.Float, nullable=True,
                  comment='Fatal accidents per 100,000 workers'),
        sa.Column('carcinogen_exposure_pct', sa.Float, nullable=True,
                  comment='% workforce exposed to carcinogens'),
        # Regulatory Classification
        sa.Column('heat_stress_reg_type', heat_stress_reg_type, nullable=True,
                  comment='Heat stress regulation type'),
        # Computed Score
        sa.Column('control_maturity_score', sa.Float, nullable=True,
                  comment='Hazard control maturity (0-100)'),
        # Source Documentation
        sa.Column('source_urls', postgresql.JSONB, nullable=True,
                  comment='Source URLs for all data points'),
        # Timestamps
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=True, onupdate=sa.func.now()),
    )
    
    # =========================================================================
    # PILLAR 2: HEALTH VIGILANCE TABLE
    # =========================================================================
    op.create_table(
        'pillar_2_vigilance',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column(
            'country_iso_code',
            sa.String(3),
            sa.ForeignKey('countries.iso_code', ondelete='CASCADE'),
            unique=True,
            nullable=False,
            index=True
        ),
        # Surveillance Configuration
        sa.Column('surveillance_logic', surveillance_logic_type, nullable=True,
                  comment='Surveillance system logic type'),
        # Core Metrics
        sa.Column('disease_detection_rate', sa.Float, nullable=True,
                  comment='Occupational disease detection rate'),
        sa.Column('vulnerability_index', sa.Float, nullable=True,
                  comment='Worker vulnerability index (0-100)'),
        # Source Documentation
        sa.Column('source_urls', postgresql.JSONB, nullable=True,
                  comment='Source URLs for all data points'),
        # Timestamps
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=True, onupdate=sa.func.now()),
    )
    
    # =========================================================================
    # PILLAR 3: RESTORATION TABLE
    # =========================================================================
    op.create_table(
        'pillar_3_restoration',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column(
            'country_iso_code',
            sa.String(3),
            sa.ForeignKey('countries.iso_code', ondelete='CASCADE'),
            unique=True,
            nullable=False,
            index=True
        ),
        # Compensation Framework
        sa.Column('payer_mechanism', payer_mechanism_type, nullable=True,
                  comment='Compensation payer mechanism type'),
        # Legal Framework
        sa.Column('reintegration_law', sa.Boolean, nullable=True,
                  comment='Mandatory return-to-work legislation exists'),
        # Core Metrics
        sa.Column('sickness_absence_days', sa.Float, nullable=True,
                  comment='Average sickness absence days per worker per year'),
        sa.Column('rehab_access_score', sa.Float, nullable=True,
                  comment='Rehabilitation access score (0-100)'),
        # Source Documentation
        sa.Column('source_urls', postgresql.JSONB, nullable=True,
                  comment='Source URLs for all data points'),
        # Timestamps
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, nullable=True, onupdate=sa.func.now()),
    )


def downgrade() -> None:
    """Drop all tables and enum types."""
    
    # Drop tables in reverse order (children first)
    op.drop_table('pillar_3_restoration')
    op.drop_table('pillar_2_vigilance')
    op.drop_table('pillar_1_hazard')
    op.drop_table('governance_layer')
    op.drop_table('countries')
    
    # Drop ENUM types
    payer_mechanism_type.drop(op.get_bind(), checkfirst=True)
    surveillance_logic_type.drop(op.get_bind(), checkfirst=True)
    heat_stress_reg_type.drop(op.get_bind(), checkfirst=True)
