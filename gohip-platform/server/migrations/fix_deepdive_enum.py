"""
Fix DeepDiveStatus enum values
Run: python migrations/fix_deepdive_enum.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    """Add uppercase enum values to match Python enum names."""
    print("Adding uppercase enum values to deepdivestatus...")
    
    with engine.connect() as conn:
        values = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
        
        for value in values:
            try:
                conn.execute(text(f"ALTER TYPE deepdivestatus ADD VALUE IF NOT EXISTS '{value}'"))
                print(f"  Added '{value}'")
            except Exception as e:
                print(f"  {value}: {e}")
        
        conn.commit()
        print("Done!")


if __name__ == "__main__":
    run_migration()
