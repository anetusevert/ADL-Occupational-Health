#!/usr/bin/env python3
"""
Migration: Update ENUM types with additional values
===================================================

Adds missing enum values to:
- surveillancelogictype: Integrated, Fragmented, Mixed
- payermechanismtype: Social Insurance, Mixed, Out-of-Pocket
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    """Add new enum values to existing types."""
    
    with engine.connect() as conn:
        # Add new surveillance logic types
        surveillance_values = ["Integrated", "Fragmented", "Mixed"]
        for value in surveillance_values:
            try:
                conn.execute(text(f"ALTER TYPE surveillancelogictype ADD VALUE IF NOT EXISTS '{value}'"))
                print(f"Added '{value}' to surveillancelogictype")
            except Exception as e:
                print(f"Note: {value} - {e}")
        
        # Add new payer mechanism types  
        payer_values = ["Social Insurance", "Mixed", "Out-of-Pocket"]
        for value in payer_values:
            try:
                conn.execute(text(f"ALTER TYPE payermechanismtype ADD VALUE IF NOT EXISTS '{value}'"))
                print(f"Added '{value}' to payermechanismtype")
            except Exception as e:
                print(f"Note: {value} - {e}")
        
        conn.commit()
        print("\nMigration complete!")


if __name__ == "__main__":
    run_migration()
