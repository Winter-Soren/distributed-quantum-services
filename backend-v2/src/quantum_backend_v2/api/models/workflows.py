"""API request/response models for workflow submission and status."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from quantum_backend_v2.workflows.models import WorkflowRunStatus, WorkflowType


class SubmitWorkflowRequest(BaseModel):
    """Request body for submitting a new workflow run."""

    model_config = ConfigDict(extra="forbid")

    workflow_definition_id: str = Field(min_length=3)
    workflow_type: WorkflowType
    project_id: str | None = None
    input_snapshot: dict[str, Any] = Field(default_factory=dict)


class WorkflowRunResponse(BaseModel):
    """API representation of a workflow run."""

    model_config = ConfigDict(extra="forbid")

    run_id: str
    workflow_definition_id: str
    owner_user_id: str
    project_id: str | None
    workflow_type: str
    status: str
    fragment_count: int
    completed_fragments: int
    failed_fragments: int
    fragment_success_rate: float
    artifact_bundle_id: str | None
    benchmark_run_id: str | None
    submitted_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class BenchmarkSubmitRequest(BaseModel):
    """Request body for initiating a benchmark run."""

    model_config = ConfigDict(extra="forbid")

    benchmark_family: str = Field(min_length=3)
    quantum_service_id: str = Field(min_length=3)
    classical_service_id: str | None = None
    dataset_ref: str | None = None
    dataset_version: str | None = None
    workflow_run_id: str | None = None


class BenchmarkRunResponse(BaseModel):
    """API representation of a benchmark run."""

    model_config = ConfigDict(extra="forbid")

    benchmark_id: str
    benchmark_family: str
    quantum_service_id: str
    classical_service_id: str | None
    status: str
    quantum_metrics: dict[str, Any] | None = None
    classical_metrics: dict[str, Any] | None = None
    comparison_summary: dict[str, Any]
    is_publishable: bool
    submitted_at: datetime
    completed_at: datetime | None
