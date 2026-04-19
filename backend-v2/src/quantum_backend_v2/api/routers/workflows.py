"""Workflow submission and benchmark router."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, status

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import not_found
from quantum_backend_v2.api.models.workflows import (
    BenchmarkRunResponse,
    BenchmarkSubmitRequest,
    SubmitWorkflowRequest,
    WorkflowRunResponse,
)
from quantum_backend_v2.application.workflows import create_workflow_run
from quantum_backend_v2.workflows.benchmark import BenchmarkRun, BenchmarkRunService
from quantum_backend_v2.workflows.models import WorkflowRun


def build_workflows_router(*, session_factory: object) -> APIRouter:
    """Build the workflows + benchmarks router."""
    router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])
    _benchmark_service = BenchmarkRunService()

    # In-memory store for benchmark runs pending a real persistence layer hookup.
    # These will be moved to MongoDB BenchmarkResultDocument in a follow-on revision.
    _benchmark_store: dict[str, BenchmarkRun] = {}

    @router.post(
        "/runs",
        response_model=WorkflowRunResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Submit a new workflow run",
    )
    async def submit_workflow(
        body: SubmitWorkflowRequest,
        current_user: CurrentUser,
    ) -> WorkflowRunResponse:
        run = create_workflow_run(
            workflow_definition_id=body.workflow_definition_id,
            owner_user_id=current_user.user_id,
            workflow_type=body.workflow_type,
            input_snapshot=body.input_snapshot,
            project_id=body.project_id,
        )
        return _run_to_response(run)

    @router.get(
        "/runs/{run_id}",
        response_model=WorkflowRunResponse,
        summary="Get a workflow run by ID",
    )
    async def get_run(
        run_id: str,
        current_user: CurrentUser,
    ) -> WorkflowRunResponse:
        # TODO: load from Postgres WorkflowRunRecord
        raise not_found("Workflow run", run_id)

    @router.post(
        "/benchmarks",
        response_model=BenchmarkRunResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Start a quantum-vs-classical benchmark run",
    )
    async def start_benchmark(
        body: BenchmarkSubmitRequest,
        current_user: CurrentUser,
    ) -> BenchmarkRunResponse:
        run = _benchmark_service.create(
            benchmark_family=body.benchmark_family,
            quantum_service_id=body.quantum_service_id,
            classical_service_id=body.classical_service_id,
            dataset_ref=body.dataset_ref,
            dataset_version=body.dataset_version,
            workflow_run_id=body.workflow_run_id,
        )
        _benchmark_store[run.benchmark_id] = run
        return _benchmark_to_response(run)

    @router.get(
        "/benchmarks/{benchmark_id}",
        response_model=BenchmarkRunResponse,
        summary="Get a benchmark run by ID",
    )
    async def get_benchmark(
        benchmark_id: str,
        current_user: CurrentUser,
    ) -> BenchmarkRunResponse:
        run = _benchmark_store.get(benchmark_id)
        if run is None:
            raise not_found("Benchmark run", benchmark_id)
        return _benchmark_to_response(run)

    return router


def _run_to_response(run: WorkflowRun) -> WorkflowRunResponse:
    return WorkflowRunResponse(
        run_id=run.run_id,
        workflow_definition_id=run.workflow_definition_id,
        owner_user_id=run.owner_user_id,
        project_id=run.project_id,
        workflow_type=run.workflow_type.value,
        status=run.status.value,
        fragment_count=run.fragment_count,
        completed_fragments=run.completed_fragments,
        failed_fragments=run.failed_fragments,
        fragment_success_rate=run.fragment_success_rate,
        artifact_bundle_id=run.artifact_bundle_id,
        benchmark_run_id=run.benchmark_run_id,
        submitted_at=run.submitted_at,
        started_at=run.started_at,
        completed_at=run.completed_at,
    )


def _benchmark_to_response(run: BenchmarkRun) -> BenchmarkRunResponse:
    return BenchmarkRunResponse(
        benchmark_id=run.benchmark_id,
        benchmark_family=run.benchmark_family,
        quantum_service_id=run.quantum_service_id,
        classical_service_id=run.classical_service_id,
        status=run.status.value,
        quantum_metrics=run.quantum_metrics.model_dump(mode="json")
        if run.quantum_metrics
        else None,
        classical_metrics=run.classical_metrics.model_dump(mode="json")
        if run.classical_metrics
        else None,
        comparison_summary=run.comparison_summary,
        is_publishable=run.is_publishable,
        submitted_at=run.submitted_at,
        completed_at=run.completed_at,
    )
