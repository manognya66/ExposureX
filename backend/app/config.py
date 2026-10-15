from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from pathlib import Path
from dotenv import load_dotenv
import os

# Automatically discover and load .env file from backend or root directory
_backend_dir = Path(__file__).resolve().parent.parent
_root_dir = _backend_dir.parent

if (_backend_dir / ".env").exists():
    load_dotenv(dotenv_path=_backend_dir / ".env")
elif (_root_dir / ".env").exists():
    load_dotenv(dotenv_path=_root_dir / ".env")
else:
    load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "ExposureX"
    TAGLINE: str = "SEE EXPOSURE. REDUCE RISK. STAY AHEAD."
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "exposurex-super-secret-production-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database: SQLite by default with absolute path for reliable execution from any working directory
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{(_backend_dir / 'exposurex.db').resolve().as_posix()}")
    
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    
    # Intelligence Provider API Keys (Fetched from .env)
    NVD_API_KEY: str = os.getenv("NVD_API_KEY", "")
    
    # Free Credential & Infostealer Intelligence API Keys (Keyless mode active; optional keys from .env)
    XPOSEDORNOT_API_KEY: str = os.getenv("XPOSEDORNOT_API_KEY", "")
    LEAKCHECK_API_KEY: str = os.getenv("LEAKCHECK_API_KEY", "")
    HUDSON_ROCK_API_KEY: str = os.getenv("HUDSON_ROCK_API_KEY", "")

    # Registered Enterprise SSO Domains (Optional explicit allowed domains, comma-separated, e.g., company.com)
    REGISTERED_DOMAINS: str = os.getenv("REGISTERED_DOMAINS", "")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

