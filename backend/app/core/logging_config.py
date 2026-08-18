"""
Structured logging configuration.
IMPORTANT: Never log sensitive page content, passwords, or personal data.
"""

import logging
import logging.handlers
import sys
import json
from pathlib import Path
from datetime import datetime, timezone
from app.core.config import get_settings

settings = get_settings()


class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for production use."""

    SENSITIVE_KEYS = {
        "password", "passwd", "token", "cookie", "authorization",
        "secret", "key", "credential", "auth", "session"
    }

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Attach extra fields but filter sensitive keys
        for key, value in record.__dict__.items():
            if key.startswith("_") or key in (
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "funcName", "lineno", "created",
                "thread", "threadName", "process", "processName",
                "msecs", "relativeCreated", "stack_info", "exc_info",
                "exc_text", "message"
            ):
                continue
            if any(s in key.lower() for s in self.SENSITIVE_KEYS):
                log_data[key] = "[REDACTED]"
            else:
                log_data[key] = value

        return json.dumps(log_data)


def setup_logging() -> None:
    """Initialize application logging. Call once at startup."""
    log_dir = Path(settings.log_file).parent
    log_dir.mkdir(parents=True, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    # Console handler — plain text for readability in dev
    console = logging.StreamHandler(sys.stdout)
    if settings.debug:
        console.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
            datefmt="%H:%M:%S"
        ))
    else:
        console.setFormatter(JSONFormatter())
    root_logger.addHandler(console)

    # Rotating file handler
    file_handler = logging.handlers.RotatingFileHandler(
        settings.log_file,
        maxBytes=10 * 1024 * 1024,   # 10 MB
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(file_handler)

    # Silence noisy third-party loggers
    for noisy in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger(__name__).info(
        "Logging initialized",
        extra={"log_level": settings.log_level, "log_file": settings.log_file}
    )
