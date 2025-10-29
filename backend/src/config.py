"""Configuration management for the backend."""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration."""

    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Paths
    BASE_DIR: Path = Path(__file__).parent.parent
    CHROMA_DB_PATH: Path = BASE_DIR / os.getenv("CHROMA_DB_PATH", "chroma_db")
    UPLOADS_PATH: Path = BASE_DIR / os.getenv("UPLOADS_PATH", "uploads")

    CHROMA_DB_PATH.mkdir(parents=True, exist_ok=True)
    UPLOADS_PATH.mkdir(parents=True, exist_ok=True)

    # Chunking Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    @classmethod
    def validate(cls) -> None:
        """Validate required configuration."""
        if not cls.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in environment variables")


# Validate configuration on import
Config.validate()
