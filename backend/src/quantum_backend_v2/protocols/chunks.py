"""Chunk transfer protocol — resumable, content-addressed, Merkle-verified."""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ChunkDescriptor(BaseModel):
    """Single chunk descriptor with its Merkle-tree leaf hash."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    index: int = Field(ge=0)
    offset_bytes: int = Field(ge=0)
    size_bytes: int = Field(ge=1)
    leaf_hash: str = Field(min_length=32)


class TransferManifest(BaseModel):
    """Top-level manifest for a chunked transfer session."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    transfer_id: str = Field(min_length=8)
    resource_id: str = Field(min_length=3)
    resource_type: str = Field(min_length=3)
    total_size_bytes: int = Field(ge=1)
    chunk_size_bytes: int = Field(ge=1024)
    root_hash: str = Field(min_length=32)
    chunks: tuple[ChunkDescriptor, ...] = Field(default_factory=tuple)
    created_at: datetime = Field(default_factory=_utc_now)


class ChunkRequest(BaseModel):
    """Receiver requests a specific chunk by index."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    transfer_id: str = Field(min_length=8)
    chunk_index: int = Field(ge=0)
    requesting_peer_id: str = Field(min_length=3)
    sent_at: datetime = Field(default_factory=_utc_now)


class ChunkPayload(BaseModel):
    """Sender delivers chunk bytes (base64-encoded) with its proof."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    transfer_id: str = Field(min_length=8)
    chunk_index: int = Field(ge=0)
    data_b64: str = Field(min_length=1)
    leaf_hash: str = Field(min_length=32)
    proof_path: tuple[str, ...] = Field(default_factory=tuple)
    sent_at: datetime = Field(default_factory=_utc_now)


class TransferProgressReport(BaseModel):
    """Receiver periodically reports transfer progress to coordinator."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    transfer_id: str = Field(min_length=8)
    receiving_peer_id: str = Field(min_length=3)
    chunks_received: int = Field(ge=0)
    total_chunks: int = Field(ge=1)
    verified_chunks: int = Field(ge=0)
    reported_at: datetime = Field(default_factory=_utc_now)

    @property
    def progress_pct(self) -> float:
        return round(100.0 * self.chunks_received / self.total_chunks, 2)


class TransferCompleteNotice(BaseModel):
    """Receiver confirms all chunks verified and assembly complete."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    transfer_id: str = Field(min_length=8)
    receiving_peer_id: str = Field(min_length=3)
    root_hash_verified: bool
    completed_at: datetime = Field(default_factory=_utc_now)
