"""Centralized application settings via pydantic-settings."""

from pathlib import Path

from pydantic_settings import BaseSettings

_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent


class Settings(BaseSettings):
    database_url: str = "sqlite:///./chart_chat.db"
    cors_origins: str = "http://localhost:5173"
    uploads_dir: str = "uploads"
    litellm_api_key: str = ""
    litellm_base_url: str = "http://localhost:4000"
    litellm_model: str = "claude-sonnet"
    vega_lite_docs_dir: str = str(_PROJECT_ROOT / "vega-lite-docs")

    model_config = {"env_file": ".env"}


settings = Settings()
