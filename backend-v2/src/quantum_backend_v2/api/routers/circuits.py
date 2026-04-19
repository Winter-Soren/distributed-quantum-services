"""Circuit submission and job management router."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import not_found
from quantum_backend_v2.api.models.circuits import (
    CircuitSubmitRequest,
    CircuitSubmitResponse,
    JobListItemResponse,
    JobProgressResponse,
    JobStatusResponse,
)
from quantum_backend_v2.api.routers.job_store import JobStore, JobPlan
from quantum_backend_v2.workflows.models import WorkflowRun, WorkflowRunStatus, WorkflowType


def build_circuits_router(*, session_factory: object) -> APIRouter:
    """Build the circuits/jobs router."""
    router = APIRouter(prefix="/api/v1", tags=["circuits", "jobs"])

    # Job store for persistence
    _job_store = JobStore()

    @router.post(
        "/circuits/submit",
        response_model=CircuitSubmitResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Submit a quantum circuit for execution",
    )
    async def submit_circuit(
        body: CircuitSubmitRequest,
        current_user: CurrentUser,
    ) -> CircuitSubmitResponse:
        """Submit a quantum circuit (QASM) for distributed execution."""
        job_id = f"job-{uuid.uuid4()}"
        
        workflow_run = WorkflowRun(
            run_id=job_id,
            workflow_definition_id="circuit-execution",
            owner_user_id=current_user.user_id,
            workflow_type=WorkflowType.QUANTUM_CIRCUIT,
            status=WorkflowRunStatus.SUBMITTED,
            input_snapshot={"circuit": body.circuit},
        )
        
        _job_store.save_workflow(workflow_run)
        
        # Create a basic execution plan
        plan_id = f"plan-{uuid.uuid4()}"
        plan = JobPlan(
            plan_id=plan_id,
            job_id=job_id,
            fragment_order=["frag-0001"],
            fragments={
                "frag-0001": {
                    "fragment_id": "frag-0001",
                    "service_type": "quantum_circuit",
                    "qubits": [0, 1],
                    "operation_ids": ["op-0001"],
                    "dependencies": [],
                }
            },
            assignments={
                "frag-0001": {
                    "fragment_id": "frag-0001",
                    "primary_node_id": "local",
                    "fallback_node_ids": [],
                    "candidates": [],
                }
            },
        )
        _job_store.save_plan(plan)
        
        return CircuitSubmitResponse(
            job_id=job_id,
            status=workflow_run.status.value,
        )

    @router.get(
        "/jobs",
        response_model=list[JobListItemResponse],
        summary="List recent jobs",
    )
    async def list_jobs(
        current_user: CurrentUser,
        limit: int = Query(default=50, ge=1, le=200),
        status: list[str] | None = Query(default=None),
    ) -> list[JobListItemResponse]:
        """List recent circuit execution jobs."""
        runs = _job_store.list_workflows()
        
        # Filter by status if provided
        if status:
            status_set = set(status)
            runs = [r for r in runs if r.status.value in status_set]
        
        # Sort by submitted_at descending and limit
        runs.sort(key=lambda r: r.submitted_at, reverse=True)
        runs = runs[:limit]
        
        return [
            JobListItemResponse(
                job_id=run.run_id,
                status=run.status.value,
                plan_id=_find_plan_id_for_job(run.run_id),
                error=_job_store.get_error(run.run_id),
                progress=JobProgressResponse(
                    total_fragments=run.fragment_count,
                    completed_fragments=run.completed_fragments,
                    active_fragments=_job_store.get_active_fragment_count(run.run_id),
                    completion_ratio=run.fragment_success_rate,
                    latest_event_at=run.submitted_at,
                    finalizing=False,
                ) if run.fragment_count > 0 else None,
                circuit_preview=_extract_circuit_preview(run.input_snapshot.get("circuit", "")),
                result_available=_job_store.get_result(run.run_id) is not None,
                created_at=run.submitted_at,
                updated_at=run.submitted_at,
            )
            for run in runs
        ]

    def _find_plan_id_for_job(job_id: str) -> str | None:
        """Find plan_id for a given job_id."""
        for plan_id, plan in _job_store._plans.items():
            if plan.job_id == job_id:
                return plan_id
        return None

    @router.get(
        "/jobs/{job_id}",
        response_model=JobStatusResponse,
        summary="Get job status and result",
    )
    async def get_job(
        job_id: str,
        current_user: CurrentUser,
        result_detail: str = Query(default="full", pattern="^(full|summary)$"),
    ) -> JobStatusResponse:
        """Get the status and result of a specific job."""
        run = _job_store.get_workflow(job_id)
        if run is None:
            raise not_found("Job", job_id)
        
        # Get result data if available
        result_data = None
        execution_result = _job_store.get_result(job_id)
        if execution_result:
            from quantum_backend_v2.api.models.circuits import JobResult
            
            fragment_results = [
                {
                    "fragment_id": fr.fragment_id,
                    "node_id": fr.node_id,
                    "status": fr.status,
                    "started_at": fr.started_at,
                    "finished_at": fr.finished_at,
                    "attempts": fr.attempts,
                    "error": fr.error,
                    "observed_fidelity": fr.observed_fidelity,
                }
                for fr in execution_result.fragment_results
            ]
            
            result_data = JobResult(
                job_id=job_id,
                fragment_results=fragment_results,
                quantum_result=execution_result.quantum_result,
            )
        
        return JobStatusResponse(
            job_id=run.run_id,
            status=run.status.value,
            plan_id=_find_plan_id_for_job(job_id),
            error=_job_store.get_error(job_id),
            result=result_data,
            progress=JobProgressResponse(
                total_fragments=run.fragment_count,
                completed_fragments=run.completed_fragments,
                active_fragments=_job_store.get_active_fragment_count(job_id),
                completion_ratio=run.fragment_success_rate,
                latest_event_at=run.submitted_at,
                finalizing=False,
            ) if run.fragment_count > 0 else None,
            circuit_text=run.input_snapshot.get("circuit", ""),
            created_at=run.submitted_at,
            updated_at=run.submitted_at,
        )

    return router


def _extract_circuit_preview(circuit_text: str, *, max_length: int = 96) -> str:
    """Extract a meaningful preview from circuit text."""
    for line in circuit_text.splitlines():
        normalized = " ".join(line.split())
        if not normalized:
            continue
        
        # Skip header lines
        upper_line = normalized.upper()
        if any(
            upper_line.startswith(prefix)
            for prefix in ["OPENQASM", "INCLUDE", "QREG", "CREG", "QUBIT[", "BIT["]
        ):
            continue
        
        # Return first meaningful line
        if len(normalized) <= max_length:
            return normalized
        return f"{normalized[:max_length-3]}..."
    
    return "Circuit submitted"
