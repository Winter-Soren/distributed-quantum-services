"""API response/request models for the peer enrollment surface."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field

from quantum_backend_v2.identity.models import PeerTrustTier


class EnrollPeerRequest(BaseModel):
    """Request body for enrolling or updating a peer."""

    model_config = ConfigDict(extra="forbid")

    peer_id: str = Field(min_length=3, max_length=255)
    trust_tier: PeerTrustTier = PeerTrustTier.USER_CONTRIBUTED
    capability_summary: dict[str, object] = Field(default_factory=dict)


class ApprovalAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    QUARANTINE = "quarantine"


class EnrollmentActionRequest(BaseModel):
    """Admin action on a pending enrollment."""

    model_config = ConfigDict(extra="forbid")

    action: ApprovalAction
    reason: str | None = Field(default=None, max_length=300)


class EnrollmentResponse(BaseModel):
    """Typed response for enrollment operations."""

    model_config = ConfigDict(extra="forbid")

    id: str
    peer_id: str
    owner_user_id: str | None
    trust_tier: str
    enrollment_status: str
    capability_summary: dict[str, object]
    published_service_count: int
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime


class EnrollmentListResponse(BaseModel):
    """Paginated list of peer enrollments."""

    model_config = ConfigDict(extra="forbid")

    enrollments: list[EnrollmentResponse]
    total: int = Field(ge=0)
