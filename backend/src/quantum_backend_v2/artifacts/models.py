"""Artifact domain models — bundles, references, replication metadata."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ArtifactKind(str, Enum):
    """Category of artifact produced or consumed by the platform."""

    EXECUTION_RESULT = "execution_result"
    BENCHMARK_PACK = "benchmark_pack"
    SCIENTIFIC_DATASET = "scientific_dataset"
    REPORT_BUNDLE = "report_bundle"
    MODEL_WEIGHTS = "model_weights"
    PROVENANCE_PACK = "provenance_pack"
    WORKFLOW_SNAPSHOT = "workflow_snapshot"


class ArtifactRef(BaseModel):
    """Content-addressed reference to a stored artifact."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    artifact_id: str = Field(min_length=3)
    kind: ArtifactKind
    digest: str = Field(min_length=32)
    size_bytes: int = Field(ge=0)
    media_type: str = Field(default="application/octet-stream", min_length=3)
    created_at: datetime = Field(default_factory=_utc_now)


class ReplicationMeta(BaseModel):
    """Swarm replication metadata for a stored artifact."""

    model_config = ConfigDict(extra="forbid")

    artifact_id: str = Field(min_length=3)
    seeder_peers: tuple[str, ...] = Field(default_factory=tuple)
    replica_count: int = Field(default=0, ge=0)
    desired_replicas: int = Field(default=2, ge=1)
    transfer_id: str | None = None
    last_replication_at: datetime | None = None
    updated_at: datetime = Field(default_factory=_utc_now)

    @property
    def is_sufficiently_replicated(self) -> bool:
        return self.replica_count >= self.desired_replicas


class ArtifactBundle(BaseModel):
    """Named collection of related artifact references."""

    model_config = ConfigDict(extra="forbid")

    bundle_id: str = Field(min_length=3)
    workflow_run_id: str | None = None
    label: str = Field(min_length=1, max_length=120)
    artifacts: tuple[ArtifactRef, ...] = Field(default_factory=tuple)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=_utc_now)

    @property
    def total_size_bytes(self) -> int:
        return sum(a.size_bytes for a in self.artifacts)
