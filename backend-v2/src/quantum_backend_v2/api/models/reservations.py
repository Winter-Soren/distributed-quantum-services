"""API request/response models for the durable reservation surface."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReserveRequest(BaseModel):
    """Request body for creating a new reservation."""

    model_config = ConfigDict(extra="forbid")

    workflow_run_id: str = Field(min_length=8)
    fragment_id: str = Field(min_length=3)
    service_id: str = Field(min_length=3)
    requesting_peer_id: str = Field(min_length=3)
    ttl_seconds: int = Field(default=60, ge=5)
    idempotency_key: str | None = None


class ReservationResponse(BaseModel):
    """Typed response for a single reservation state."""

    model_config = ConfigDict(extra="forbid")

    reservation_id: str
    workflow_run_id: str
    fragment_id: str
    service_id: str
    requesting_peer_id: str
    accepting_peer_id: str | None
    current_transition: str
    ttl_seconds: int
    last_event_at: datetime
    is_terminal: bool
    is_active: bool
