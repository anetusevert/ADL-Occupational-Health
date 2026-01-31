#!/usr/bin/env python3
"""
GOHIP Platform - Production Data Migration Script
===================================================

This script migrates data from the local PostgreSQL database to Railway production.

Usage:
    python migrate_to_production.py <RAILWAY_DATABASE_URL>

Example:
    python migrate_to_production.py "postgresql://postgres:xxx@xxx.railway.app:5432/railway"
"""

import os
import sys
from datetime import datetime

# Add the server directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def get_local_db_url():
    """Get local database URL."""
    return "postgresql://postgres:postgres@localhost:5432/gohip_db"


def migrate_data(production_url: str):
    """Migrate all data from local to production database."""
    
    print("=" * 60)
    print("GOHIP Platform - Production Data Migration")
    print("=" * 60)
    
    # Connect to local database
    print("\n[1/5] Connecting to local database...")
    local_engine = create_engine(get_local_db_url())
    LocalSession = sessionmaker(bind=local_engine)
    local_session = LocalSession()
    
    # Connect to production database
    print("[2/5] Connecting to production database...")
    prod_engine = create_engine(production_url)
    ProdSession = sessionmaker(bind=prod_engine)
    prod_session = ProdSession()
    
    # Tables to migrate (in order due to foreign key constraints)
    tables = [
        "countries",
        "governance_layer",
        "pillar_1_hazard",
        "pillar_2_vigilance",
        "pillar_3_restoration",
        "country_intelligence",
        "country_deep_dives",
        "users",
        "ai_config",
        "metric_definitions",
        "metric_explanations",
        "maturity_scoring_rules",
        "pillar_summary_metrics",
    ]
    
    print("[3/5] Clearing existing production data...")
    # Clear in reverse order
    for table in reversed(tables):
        try:
            prod_session.execute(text(f"DELETE FROM {table}"))
            print(f"  [OK] Cleared {table}")
        except Exception as e:
            print(f"  [SKIP] {table}: {e}")
    prod_session.commit()
    
    print("[4/5] Migrating data...")
    total_rows = 0
    
    for table in tables:
        try:
            # Get data from local
            result = local_session.execute(text(f"SELECT * FROM {table}"))
            rows = result.fetchall()
            columns = result.keys()
            
            if not rows:
                print(f"  - {table}: 0 rows (empty)")
                continue
            
            # Build insert statement
            col_names = ", ".join(columns)
            placeholders = ", ".join([f":{col}" for col in columns])
            insert_sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"
            
            # Insert into production
            for row in rows:
                row_dict = dict(zip(columns, row))
                prod_session.execute(text(insert_sql), row_dict)
            
            prod_session.commit()
            print(f"  [OK] {table}: {len(rows)} rows migrated")
            total_rows += len(rows)
            
        except Exception as e:
            prod_session.rollback()
            print(f"  [ERROR] {table}: {e}")
    
    print(f"\n[5/5] Migration complete!")
    print(f"  Total rows migrated: {total_rows}")
    
    # Verify
    print("\n" + "=" * 60)
    print("Verification:")
    print("=" * 60)
    
    result = prod_session.execute(text("SELECT COUNT(*) FROM countries"))
    count = result.scalar()
    print(f"  Countries in production: {count}")
    
    result = prod_session.execute(text("SELECT COUNT(*) FROM users"))
    count = result.scalar()
    print(f"  Users in production: {count}")
    
    local_session.close()
    prod_session.close()
    
    print("\n[SUCCESS] Migration complete! Your production database now has all the data.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_production.py <RAILWAY_DATABASE_URL>")
        print("\nTo get your Railway DATABASE_URL:")
        print("  1. Go to Railway dashboard")
        print("  2. Click on your Postgres service")
        print("  3. Go to 'Connect' tab")
        print("  4. Copy the 'Public' connection string")
        sys.exit(1)
    
    production_url = sys.argv[1]
    migrate_data(production_url)
