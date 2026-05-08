"""In-memory job store for workflow runs (circuits/jobs).

This provides a temporary persistence layer until Postgres integration is complete.
Tracks jobs, plans, errors, results, and fragment execution.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class JobFragmentResult:
    """Result from executing a single fragment."""

    fragment_id: str
    node_id: str
    status: str  # SUCCESS, FAILED
    started_at: datetime
    finished_at: datetime
    attempts: int
    error: str | None = None
    observed_fidelity: float | None = None


@dataclass
class JobExecutionResult:
    """Complete execution result for a job."""

    job_id: str
    fragment_results: list[JobFragmentResult] = field(default_factory=list)
    quantum_result: dict[str, Any] | None = None
    aggregation_complete: bool = False


@dataclass
class JobPlan:
    """Execution plan for a job."""

    plan_id: str
    job_id: str
    fragment_order: list[str]
    fragments: dict[str, dict[str, Any]]
    assignments: dict[str, dict[str, Any]]
    quality_snapshot_id: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class JobStore:
    """In-memory store for jobs, plans, and results."""

    def __init__(self) -> None:
        self._workflow_runs: dict[str, Any] = {}
        self._plans: dict[str, JobPlan] = {}
        self._results: dict[str, JobExecutionResult] = {}
        self._errors: dict[str, str] = {}
        self._active_fragments: dict[str, set[str]] = {}

    def save_workflow(self, workflow_run: Any) -> None:
        """Save or update a workflow run."""
        self._workflow_runs[workflow_run.run_id] = workflow_run

    def get_workflow(self, job_id: str) -> Any | None:
        """Get a workflow run by job_id."""
        return self._workflow_runs.get(job_id)

    def list_workflows(self) -> list[Any]:
        """List all workflow runs."""
        return list(self._workflow_runs.values())

    def save_plan(self, plan: JobPlan) -> None:
        """Save an execution plan."""
        self._plans[plan.plan_id] = plan

    def get_plan(self, plan_id: str) -> JobPlan | None:
        """Get an execution plan."""
        return self._plans.get(plan_id)

    def save_error(self, job_id: str, error: str) -> None:
        """Save an error for a job."""
        self._errors[job_id] = error

    def get_error(self, job_id: str) -> str | None:
        """Get error for a job."""
        return self._errors.get(job_id)

    def save_result(self, result: JobExecutionResult) -> None:
        """Save execution result."""
        self._results[result.job_id] = result

    def get_result(self, job_id: str) -> JobExecutionResult | None:
        """Get execution result."""
        return self._results.get(job_id)

    def add_active_fragment(self, job_id: str, fragment_id: str) -> None:
        """Mark a fragment as active."""
        if job_id not in self._active_fragments:
            self._active_fragments[job_id] = set()
        self._active_fragments[job_id].add(fragment_id)

    def remove_active_fragment(self, job_id: str, fragment_id: str) -> None:
        """Mark a fragment as no longer active."""
        if job_id in self._active_fragments:
            self._active_fragments[job_id].discard(fragment_id)

    def get_active_fragment_count(self, job_id: str) -> int:
        """Get count of active fragments for a job."""
        return len(self._active_fragments.get(job_id, set()))
