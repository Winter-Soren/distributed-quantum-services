"""Circuit and job API models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CircuitSubmitRequest(BaseModel):
    """Request to submit a quantum circuit for execution."""

    circuit: str = Field(
        min_length=10,
        description="Quantum circuit in QASM format",
    )


class CircuitSubmitResponse(BaseModel):
    """Response after submitting a circuit."""

    job_id: str = Field(description="Unique job identifier")
    status: str = Field(description="Initial job status")


class JobProgressResponse(BaseModel):
    """Progress information for a job."""

    total_fragments: int = Field(ge=0)
    completed_fragments: int = Field(ge=0)
    active_fragments: int = Field(ge=0)
    completion_ratio: float = Field(ge=0.0, le=1.0)
    latest_event_at: datetime
    finalizing: bool


class JobResult(BaseModel):
    """Job execution result data."""

    job_id: str
    fragment_results: list[dict[str, Any]] = Field(default_factory=list)
    quantum_result: dict[str, Any] | None = None


class JobListItemResponse(BaseModel):
    """Summary item for job list."""

    job_id: str
    status: str
    plan_id: str | None
    error: str | None
    progress: JobProgressResponse | None
    circuit_preview: str
    result_available: bool
    created_at: datetime
    updated_at: datetime


class JobStatusResponse(BaseModel):
    """Detailed job status response."""

    job_id: str
    status: str
    plan_id: str | None
    error: str | None
    result: JobResult | None
    progress: JobProgressResponse | None
    circuit_text: str
    created_at: datetime
    updated_at: datetime
