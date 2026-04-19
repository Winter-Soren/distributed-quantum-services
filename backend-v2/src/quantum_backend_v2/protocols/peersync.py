"""Peer state sync protocol — checkpoint reconciliation and replay anchors."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PeerSyncCheckpoint(BaseModel):
    """Checkpoint digest a peer broadcasts on rejoin to anchor replay."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    peer_id: str = Field(min_length=3)
    log_sequence: int = Field(ge=0)
    log_digest: str = Field(min_length=16)
    reservation_cursor: str | None = Field(default=None, min_length=3)
    execution_cursor: str | None = Field(default=None, min_length=3)
    checkpointed_at: datetime = Field(default_factory=_utc_now)


class PeerSyncRequest(BaseModel):
    """Coordinator asks a peer to share missing events since a cursor."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    requesting_peer_id: str = Field(min_length=3)
    target_peer_id: str = Field(min_length=3)
    since_sequence: int = Field(ge=0)
    event_categories: tuple[str, ...] = Field(default_factory=tuple)
    sent_at: datetime = Field(default_factory=_utc_now)


class PeerSyncEventBatch(BaseModel):
    """Batch of replayed events returned by the target peer."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    target_peer_id: str = Field(min_length=3)
    from_sequence: int = Field(ge=0)
    to_sequence: int = Field(ge=0)
    event_count: int = Field(ge=0)
    events_json: str = Field(min_length=2)
    replied_at: datetime = Field(default_factory=_utc_now)


class PeerWantlist(BaseModel):
    """Peer announces service packages or artifact chunks it needs soon."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    announcing_peer_id: str = Field(min_length=3)
    wanted_package_ids: tuple[str, ...] = Field(default_factory=tuple)
    wanted_artifact_refs: tuple[str, ...] = Field(default_factory=tuple)
    announced_at: datetime = Field(default_factory=_utc_now)
