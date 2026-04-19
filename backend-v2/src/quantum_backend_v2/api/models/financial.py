"""Financial analysis API models."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class FinancialJobStatus(str, Enum):
    """Status of a financial analysis job."""

    INGESTING = "ingesting"
    ANALYZING = "analyzing"
    COMPLETED = "completed"
    FAILED = "failed"


class FinancialSubmitResponse(BaseModel):
    """Response after submitting a financial CSV."""

    job_id: str
    status: str


class FinancialJobSummary(BaseModel):
    """Summary of a financial job for list view."""

    job_id: str
    filename: str
    status: str
    row_count: int | None
    col_count: int | None
    error: str | None
    created_at: datetime
    updated_at: datetime


class FinancialJobResponse(BaseModel):
    """Full financial job response with results."""

    job_id: str
    filename: str
    status: str
    row_count: int | None
    col_count: int | None
    error: str | None
    result: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
