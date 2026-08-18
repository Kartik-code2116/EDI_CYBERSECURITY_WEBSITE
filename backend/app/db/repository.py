"""
SQLite repository for storing non-sensitive analysis metadata.

PRIVACY:
  - Only stores: timestamp, domain, risk_score, severity, model_version
  - Never stores: page content, HTML, form data, user info, passwords
"""

import sqlite3
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@dataclass
class AnalysisRecord:
    id: str
    timestamp: str
    domain: str
    risk_score: int
    severity: str
    model_version: str
    scan_duration_ms: int
    threats_json: str = "[]"


class AnalysisRepository:
    """SQLite-backed storage for analysis metadata."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.database_url.replace("sqlite:///", "")
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()
        logger.info("AnalysisRepository initialized", extra={"db_path": self.db_path})

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    domain TEXT NOT NULL,
                    risk_score INTEGER NOT NULL,
                    severity TEXT NOT NULL,
                    model_version TEXT NOT NULL,
                    scan_duration_ms INTEGER NOT NULL,
                    threats_json TEXT DEFAULT '[]'
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_domain ON analyses(domain)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_timestamp ON analyses(timestamp)
            """)

    def save(
        self,
        domain: str,
        risk_score: int,
        severity: str,
        model_version: str,
        scan_duration_ms: int,
        threats_json: str = "[]",
    ) -> str:
        record_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        with self._connect() as conn:
            conn.execute(
                """INSERT INTO analyses
                   (id, timestamp, domain, risk_score, severity, model_version, scan_duration_ms, threats_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (record_id, timestamp, domain, risk_score, severity, model_version, scan_duration_ms, threats_json)
            )
        return record_id

    def get_by_id(self, record_id: str) -> Optional[AnalysisRecord]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM analyses WHERE id = ?", (record_id,)
            ).fetchone()
        if row:
            return AnalysisRecord(*row)
        return None

    def get_recent(self, limit: int = 50) -> list[AnalysisRecord]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM analyses ORDER BY timestamp DESC LIMIT ?", (limit,)
            ).fetchall()
        return [AnalysisRecord(*row) for row in rows]

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
