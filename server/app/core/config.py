"""
GOHIP Platform - Configuration Management
Uses pydantic-settings for environment variable handling
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # Application
    PROJECT_NAME: str = "GOHIP"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/gohip_db"

    # CORS - Production origins (comma-separated string from env var)
    # Local dev origins are added in main.py
    CORS_ORIGINS: str = ""

    # API Keys (for future external data sourcing)
    EXTERNAL_API_KEY: str = ""

    # OpenAI API Key (for AI Consultant Agent) - Legacy, now managed via AIConfig
    OPENAI_API_KEY: Optional[str] = None

    # Authentication & Security
    SECRET_KEY: str = "gohip-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Admin User (initial setup)
    ADMIN_EMAIL: str = "utena.treves@gmail.com"
    ADMIN_PASSWORD: str = "admin"

    # Web Research APIs
    TAVILY_API_KEY: Optional[str] = None  # Primary: 1000 free/month
    SERPAPI_KEY: Optional[str] = None     # Backup: 100 free/month


# Global settings instance
settings = Settings()
