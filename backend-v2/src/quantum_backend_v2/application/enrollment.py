"""Peer enrollment use-case — validates, persists, and emits enrollment events."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from quantum_backend_v2.identity.models import PeerTrustTier
from quantum_backend_v2.persistence.postgres import (
    AsyncSession,
    PeerEnrollmentRecord,
)

logger = logging.getLogger(__name__)


class PeerEnrollmentStatus(str):
    ENROLLING = "enrolling"
    PENDING_APPROVAL = "pending_approval"
    READY = "ready"
    REJECTED = "rejected"


async def enroll_peer(
    *,
    session: AsyncSession,
    peer_id: str,
    owner_user_id: str | None,
    trust_tier: PeerTrustTier,
    capability_summary: dict[str, object],
) -> PeerEnrollmentRecord:
    """Create or update a peer enrollment record.

    Idempotent — calling again for the same peer_id updates the record.
    """
    from sqlalchemy import select

    result = await session.execute(
        select(PeerEnrollmentRecord).where(PeerEnrollmentRecord.peer_id == peer_id)
    )
    existing = result.scalar_one_or_none()

    if existing is not None:
        existing.trust_tier = trust_tier.value
        existing.owner_user_id = owner_user_id
        existing.capability_summary = capability_summary
        existing.last_seen_at = datetime.now(timezone.utc)
        await session.flush()
        logger.info("updated enrollment for peer %s (tier=%s)", peer_id, trust_tier.value)
        return existing

    record = PeerEnrollmentRecord(
        id=uuid.uuid4().hex,
        peer_id=peer_id,
        owner_user_id=owner_user_id,
        trust_tier=trust_tier.value,
        enrollment_status=PeerEnrollmentStatus.PENDING_APPROVAL,
        capability_summary=capability_summary,
    )
    session.add(record)
    await session.flush()
    logger.info("enrolled new peer %s (tier=%s)", peer_id, trust_tier.value)
    return record


async def approve_peer(
    *,
    session: AsyncSession,
    peer_id: str,
) -> PeerEnrollmentRecord | None:
    """Transition a pending peer to READY status."""
    from sqlalchemy import select

    result = await session.execute(
        select(PeerEnrollmentRecord).where(PeerEnrollmentRecord.peer_id == peer_id)
    )
    record = result.scalar_one_or_none()
    if record is None:
        return None

    record.enrollment_status = PeerEnrollmentStatus.READY
    await session.flush()
    logger.info("approved peer %s", peer_id)
    return record
