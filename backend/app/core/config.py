"""
Core configuration using pydantic-settings.
All secrets come from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    app_name: str = "AI Security Assistant"
    app_version: str = "1.0.0"
    debug: bool = False

    # ── Server ───────────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000

    # ── CORS — allow the browser extension (chrome-extension://*) ───────────
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        # Chrome extensions use this origin:
        "chrome-extension://",
    ]
    allow_all_origins: bool = True   # Set False in production

    # ── Rate Limiting ────────────────────────────────────────────────────────
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 500

    # ── Request Limits ───────────────────────────────────────────────────────
    max_html_content_bytes: int = 512_000   # 512 KB
    max_text_content_bytes: int = 50_000    # 50 KB
    max_screenshot_bytes: int = 5_242_880   # 5 MB

    # ── Database (SQLite for dev) ────────────────────────────────────────────
    database_url: str = "sqlite:///./data/analysis.db"

    # ── AI / LLM Integration (optional) ─────────────────────────────────────
    gemini_api_key: str = ""
    openai_api_key: str = ""
    llm_provider: str = "none"   # "gemini" | "openai" | "none"
    llm_model: str = "gemini-1.5-flash"

    # ── Risk Engine Weights (must sum to 1.0) ────────────────────────────────
    weight_url: float = 0.25
    weight_page: float = 0.20
    weight_vision: float = 0.30
    weight_nlp: float = 0.15
    weight_behavior: float = 0.10

    # ── Thresholds ───────────────────────────────────────────────────────────
    safe_threshold: int = 30
    suspicious_threshold: int = 60
    dangerous_threshold: int = 80

    # ── Vision / Playwright ──────────────────────────────────────────────────
    playwright_timeout_ms: int = 15_000
    vision_model_path: str = ""   # Path to YOLO .pt weights file (placeholder)

    # ── Logging ──────────────────────────────────────────────────────────────
    log_level: str = "INFO"
    log_file: str = "logs/app.log"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
