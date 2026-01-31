"""
Migration: Create country_deep_dives table
Run: python migrations/create_deep_dives_table.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


def run_migration():
    """Create the country_deep_dives table."""
    print("Creating country_deep_dives table...")
    
    with engine.connect() as conn:
        # First, create the enum type if it doesn't exist
        try:
            conn.execute(text("CREATE TYPE deepdivestatus AS ENUM ('pending', 'processing', 'completed', 'failed')"))
            conn.commit()
            print("Created deepdivestatus enum type")
        except Exception as e:
            conn.rollback()
            print(f"Enum type already exists or error: {e}")
        
        # Create the table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS country_deep_dives (
            id VARCHAR(36) PRIMARY KEY,
            country_iso_code VARCHAR(3) NOT NULL UNIQUE REFERENCES countries(iso_code) ON DELETE CASCADE,
            
            status deepdivestatus NOT NULL DEFAULT 'pending',
            
            executive_summary TEXT,
            strategy_name VARCHAR(200),
            strategic_narrative TEXT,
            
            key_findings JSONB,
            health_profile TEXT,
            workforce_insights TEXT,
            
            strengths JSONB,
            weaknesses JSONB,
            opportunities JSONB,
            threats JSONB,
            
            strategic_recommendations JSONB,
            action_items JSONB,
            priority_interventions JSONB,
            
            peer_comparison TEXT,
            global_ranking_context TEXT,
            benchmark_countries JSONB,
            
            data_sources_used JSONB,
            external_research_summary TEXT,
            data_quality_notes TEXT,
            
            ai_provider VARCHAR(100),
            generation_log JSONB,
            generated_by_user_id VARCHAR(36),
            error_message TEXT,
            
            generated_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
        """
        conn.execute(text(create_table_sql))
        conn.commit()
        print("Created country_deep_dives table")
        
        # Create index
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_country_deep_dives_iso ON country_deep_dives(country_iso_code)"))
        conn.commit()
        print("Created index")
    
    print("✅ Migration complete!")


if __name__ == "__main__":
    run_migration()
