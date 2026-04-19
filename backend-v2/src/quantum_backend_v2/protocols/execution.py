"""Execution protocol wire schemas for fragment dispatch, progress, and completion."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ExecutionTransition(str, Enum):
    """Allowed execution state transitions."""

    DISPATCHED = "dispatched"
    RUNNING = "running"
    CHECKPOINTED = "checkpointed"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"
    CANCELLED = "cancelled"


class FragmentDispatchRequest(BaseModel):
    """Coordinator dispatches a fragment to a committed peer."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    execution_id: str = Field(min_length=8)
    reservation_id: str = Field(min_length=8)
    workflow_run_id: str = Field(min_length=8)
    fragment_id: str = Field(min_length=3)
    service_id: str = Field(min_length=3)
    input_payload: dict[str, Any] = Field(default_factory=dict)
    max_retries: int = Field(default=2, ge=0, le=10)
    idempotency_key: str = Field(min_length=8)
    dispatched_at: datetime = Field(default_factory=_utc_now)


class ExecutionProgressEvent(BaseModel):
    """Peer reports execution progress to the coordinator."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    execution_id: str = Field(min_length=8)
    fragment_id: str = Field(min_length=3)
    executing_peer_id: str = Field(min_length=3)
    transition: ExecutionTransition
    progress_pct: float | None = Field(default=None, ge=0.0, le=100.0)
    checkpoint_ref: str | None = Field(default=None, min_length=3)
    reported_at: datetime = Field(default_factory=_utc_now)


class ExecutionResultPayload(BaseModel):
    """Final result delivered from peer to coordinator on fragment completion."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    execution_id: str = Field(min_length=8)
    fragment_id: str = Field(min_length=3)
    executing_peer_id: str = Field(min_length=3)
    transition: ExecutionTransition
    output_payload: dict[str, Any] = Field(default_factory=dict)
    latency_ms: float | None = Field(default=None, ge=0.0)
    fidelity_score: float | None = Field(default=None, ge=0.0, le=1.0)
    error_detail: str | None = Field(default=None, max_length=600)
    artifact_refs: list[str] = Field(default_factory=list)
    completed_at: datetime = Field(default_factory=_utc_now)


class ExecutionRetryRequest(BaseModel):
    """Coordinator requests a retry of a failed fragment on an alternative peer."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    execution_id: str = Field(min_length=8)
    original_fragment_id: str = Field(min_length=3)
    retry_attempt: int = Field(ge=1)
    fallback_peer_id: str = Field(min_length=3)
    reason: str | None = Field(default=None, max_length=300)
    requested_at: datetime = Field(default_factory=_utc_now)
