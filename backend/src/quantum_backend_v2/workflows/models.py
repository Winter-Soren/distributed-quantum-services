"""Workflow domain models — runs, status, scientific and financial workflow types."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class WorkflowType(str, Enum):
    """High-level category of a workflow."""

    QUANTUM_CIRCUIT = "quantum_circuit"
    QUANTUM_VS_CLASSICAL = "quantum_vs_classical"
    FINANCIAL_MODELLING = "financial_modelling"
    SCIENTIFIC_SIMULATION = "scientific_simulation"
    BENCHMARK_ONLY = "benchmark_only"
    HYBRID = "hybrid"


class WorkflowRunStatus(str, Enum):
    """Lifecycle state of a workflow run."""

    SUBMITTED = "submitted"
    PLANNING = "planning"
    RUNNING = "running"
    AWAITING_FRAGMENTS = "awaiting_fragments"
    AGGREGATING = "aggregating"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowRun(BaseModel):
    """Durable header record for a workflow execution run."""

    model_config = ConfigDict(extra="forbid")

    run_id: str = Field(min_length=8)
    workflow_definition_id: str = Field(min_length=3)
    owner_user_id: str = Field(min_length=3)
    project_id: str | None = None
    workflow_type: WorkflowType
    status: WorkflowRunStatus = WorkflowRunStatus.SUBMITTED
    input_snapshot: dict[str, Any] = Field(default_factory=dict)
    output_snapshot: dict[str, Any] = Field(default_factory=dict)
    fragment_count: int = Field(default=0, ge=0)
    completed_fragments: int = Field(default=0, ge=0)
    failed_fragments: int = Field(default=0, ge=0)
    artifact_bundle_id: str | None = None
    benchmark_run_id: str | None = None
    submitted_at: datetime = Field(default_factory=_utc_now)
    started_at: datetime | None = None
    completed_at: datetime | None = None

    @property
    def is_terminal(self) -> bool:
        return self.status in {
            WorkflowRunStatus.COMPLETED,
            WorkflowRunStatus.FAILED,
            WorkflowRunStatus.CANCELLED,
        }

    @property
    def fragment_success_rate(self) -> float:
        total = self.completed_fragments + self.failed_fragments
        return self.completed_fragments / total if total > 0 else 0.0


class FinancialWorkflowConfig(BaseModel):
    """Configuration for a financial modelling workflow."""

    model_config = ConfigDict(extra="forbid")

    company_tickers: tuple[str, ...] = Field(min_length=1)
    scenario_count: int = Field(default=100, ge=1)
    horizon_years: int = Field(default=5, ge=1)
    include_dcf: bool = True
    include_comparables: bool = True
    quantum_optimization: bool = True
    classical_baseline: bool = True


class ScientificWorkflowConfig(BaseModel):
    """Configuration for a scientific simulation workflow."""

    model_config = ConfigDict(extra="forbid")

    simulation_type: str = Field(min_length=3)
    parameter_sweeps: dict[str, list[Any]] = Field(default_factory=dict)
    shots_per_point: int = Field(default=1024, ge=1)
    noise_model: str | None = None
    preserve_provenance: bool = True
