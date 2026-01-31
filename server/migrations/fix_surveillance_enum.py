"""
Fix SurveillanceLogicType enum values
Run: python migrations/fix_surveillance_enum.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    """Add all case variations of enum values."""
    print("Adding enum values to surveillancelogictype...")
    
    with engine.connect() as conn:
        # Add all variations that might be needed
        values = [
            'Fragmented', 'FRAGMENTED', 
            'Mixed', 'MIXED',
            'Integrated', 'INTEGRATED',
            'Risk-Based', 'RISK_BASED', 'RISK-BASED',
            'Mandatory', 'MANDATORY',
            'None', 'NONE'
        ]
        
        for value in values:
            try:
                conn.execute(text(f"ALTER TYPE surveillancelogictype ADD VALUE IF NOT EXISTS '{value}'"))
                print(f"  Added '{value}'")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    print(f"  {value}: {e}")
        
        conn.commit()
        print("Done!")


if __name__ == "__main__":
    run_migration()
