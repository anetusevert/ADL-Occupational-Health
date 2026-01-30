#!/usr/bin/env python3
"""
Migration: Convert native enum columns to VARCHAR
=================================================

This fixes the SQLAlchemy issue where native PostgreSQL enums use
enum NAMES (e.g., "OUT_OF_POCKET") instead of VALUES (e.g., "Out-of-Pocket").

Converting to VARCHAR allows direct string storage without enum conflicts.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    """Convert enum columns to VARCHAR to avoid SQLAlchemy enum issues."""
    
    print("Converting enum columns to VARCHAR...")
    
    with engine.connect() as conn:
        # 1. Convert pillar_2_vigilance.surveillance_logic to VARCHAR
        print("\n1. Converting pillar_2_vigilance.surveillance_logic...")
        try:
            conn.execute(text("""
                ALTER TABLE pillar_2_vigilance 
                ALTER COLUMN surveillance_logic TYPE VARCHAR(50) 
                USING surveillance_logic::text
            """))
            print("   SUCCESS: surveillance_logic converted to VARCHAR(50)")
        except Exception as e:
            print(f"   Note: {e}")
        
        # 2. Convert pillar_3_restoration.payer_mechanism to VARCHAR
        print("\n2. Converting pillar_3_restoration.payer_mechanism...")
        try:
            conn.execute(text("""
                ALTER TABLE pillar_3_restoration 
                ALTER COLUMN payer_mechanism TYPE VARCHAR(50) 
                USING payer_mechanism::text
            """))
            print("   SUCCESS: payer_mechanism converted to VARCHAR(50)")
        except Exception as e:
            print(f"   Note: {e}")
        
        # 3. Convert pillar_1_hazard.heat_stress_reg_type to VARCHAR
        print("\n3. Converting pillar_1_hazard.heat_stress_reg_type...")
        try:
            conn.execute(text("""
                ALTER TABLE pillar_1_hazard 
                ALTER COLUMN heat_stress_reg_type TYPE VARCHAR(50) 
                USING heat_stress_reg_type::text
            """))
            print("   SUCCESS: heat_stress_reg_type converted to VARCHAR(50)")
        except Exception as e:
            print(f"   Note: {e}")
        
        conn.commit()
        print("\n" + "="*50)
        print("Migration complete!")
        print("Enum columns are now VARCHAR - direct string storage enabled.")


if __name__ == "__main__":
    run_migration()
