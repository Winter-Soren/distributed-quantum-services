"""SQLite persistence for financial analysis jobs."""

from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

from quantum_coordinator.financial.models import FinancialJobRecord, FinancialJobStatus


class FinancialJobStore:
    def __init__(self, database_path: str) -> None:
        self._path = Path(database_path)

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._path)
        conn.row_factory = sqlite3.Row
        return conn

    def upsert(self, record: FinancialJobRecord) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO financial_jobs
                    (job_id, status, filename, row_count, col_count, error, result_json,
                     created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(job_id) DO UPDATE SET
                    status=excluded.status,
                    row_count=excluded.row_count,
                    col_count=excluded.col_count,
                    error=excluded.error,
                    result_json=excluded.result_json,
                    updated_at=excluded.updated_at
                """,
                (
                    record.job_id,
                    record.status.value,
                    record.filename,
                    record.row_count,
                    record.col_count,
                    record.error,
                    record.result_json,
                    record.created_at.isoformat(),
                    record.updated_at.isoformat(),
                ),
            )

    def get(self, job_id: str) -> FinancialJobRecord | None:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM financial_jobs WHERE job_id = ?", (job_id,)
            ).fetchone()
        if row is None:
            return None
        return self._from_row(row)

    def list_recent(self, limit: int = 50) -> list[FinancialJobRecord]:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT * FROM financial_jobs ORDER BY created_at DESC LIMIT ?", (limit,)
            ).fetchall()
        return [self._from_row(r) for r in rows]

    def _from_row(self, row: sqlite3.Row) -> FinancialJobRecord:
        return FinancialJobRecord(
            job_id=row["job_id"],
            status=FinancialJobStatus(row["status"]),
            filename=row["filename"],
            row_count=row["row_count"],
            col_count=row["col_count"],
            error=row["error"],
            result_json=row["result_json"],
            created_at=datetime.fromisoformat(row["created_at"]),
            updated_at=datetime.fromisoformat(row["updated_at"]),
        )


def run_financial_migrations(database_path: str) -> None:
    path = Path(database_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS financial_jobs (
                job_id      TEXT PRIMARY KEY,
                status      TEXT NOT NULL,
                filename    TEXT NOT NULL,
                row_count   INTEGER,
                col_count   INTEGER,
                error       TEXT,
                result_json TEXT,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );
            """
        )
        conn.commit()
