"""Provenance domain models — lineage events, bundles, evidence packs."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProvenanceEventKind(str, Enum):
    """Categories of events captured in a provenance chain."""

    WORKFLOW_SUBMITTED = "workflow.submitted"
    WORKFLOW_PLANNED = "workflow.planned"
    FRAGMENT_ASSIGNED = "fragment.assigned"
    FRAGMENT_DISPATCHED = "fragment.dispatched"
    FRAGMENT_COMPLETED = "fragment.completed"
    FRAGMENT_FAILED = "fragment.failed"
    RESULT_AGGREGATED = "result.aggregated"
    ARTIFACT_STORED = "artifact.stored"
    BENCHMARK_RECORDED = "benchmark.recorded"
    PACKAGE_INSTALLED = "package.installed"
    PEER_JOINED = "peer.joined"


class ProvenanceEvent(BaseModel):
    """Single immutable event in a workflow's provenance chain."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    event_id: str = Field(min_length=8)
    workflow_run_id: str = Field(min_length=8)
    kind: ProvenanceEventKind
    actor_peer_id: str | None = None
    actor_user_id: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime = Field(default_factory=_utc_now)


class ProvenanceBundle(BaseModel):
    """Complete provenance record for a workflow run — designed for publication."""

    model_config = ConfigDict(extra="forbid")

    bundle_id: str = Field(min_length=3)
    workflow_run_id: str = Field(min_length=8)
    workflow_definition_id: str = Field(min_length=3)
    owner_user_id: str = Field(min_length=3)
    events: tuple[ProvenanceEvent, ...] = Field(default_factory=tuple)
    artifact_refs: tuple[str, ...] = Field(default_factory=tuple)
    peer_log_refs: tuple[str, ...] = Field(default_factory=tuple)
    summary: dict[str, Any] = Field(default_factory=dict)
    is_publishable: bool = False
    created_at: datetime = Field(default_factory=_utc_now)

    def event_count_by_kind(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for event in self.events:
            counts[event.kind.value] = counts.get(event.kind.value, 0) + 1
        return counts


class DatasetLineage(BaseModel):
    """Lineage record connecting an input dataset to a workflow run."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    lineage_id: str = Field(min_length=3)
    dataset_ref: str = Field(min_length=3)
    workflow_run_id: str = Field(min_length=8)
    dataset_version: str = Field(min_length=1)
    ingested_at: datetime = Field(default_factory=_utc_now)


class ModelLineage(BaseModel):
    """Lineage record connecting a model version to a workflow run."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    lineage_id: str = Field(min_length=3)
    model_id: str = Field(min_length=3)
    model_version: str = Field(min_length=1)
    workflow_run_id: str = Field(min_length=8)
    applied_at: datetime = Field(default_factory=_utc_now)
