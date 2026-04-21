"""Workflow submission and benchmark router."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, status
from sqlalchemy import select

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import ErrorCode, PlatformException, not_found
from quantum_backend_v2.api.models.workflows import (
    BenchmarkRunResponse,
    BenchmarkSubmitRequest,
    SubmitWorkflowRequest,
    WorkflowRunResponse,
)
from quantum_backend_v2.application.workflows import create_workflow_run
from quantum_backend_v2.persistence.mongodb import BenchmarkResultDocument, MongoRuntime
from quantum_backend_v2.persistence.postgres import WorkflowRunRecord
from quantum_backend_v2.workflows.benchmark import BenchmarkRun, BenchmarkRunService
from quantum_backend_v2.workflows.models import WorkflowRun, WorkflowRunStatus, WorkflowType


def build_workflows_router(
    *,
    session_factory: object,
    mongo_runtime: MongoRuntime | None,
) -> APIRouter:
    """Build the workflows + benchmarks router."""
    router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])
    benchmark_service = BenchmarkRunService()

    def _session():
        return session_factory()  # type: ignore[operator]

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

        async with _session() as session:
            async with session.begin():
                session.add(
                    WorkflowRunRecord(
                        id=run.run_id,
                        workflow_definition_id=run.workflow_definition_id,
                        owner_user_id=run.owner_user_id,
                        project_id=run.project_id,
                        workflow_type=run.workflow_type.value,
                        status=run.status.value,
                        input_snapshot=run.input_snapshot,
                        output_snapshot=run.output_snapshot,
                        fragment_count=run.fragment_count,
                        completed_fragments=run.completed_fragments,
                        failed_fragments=run.failed_fragments,
                        artifact_bundle_id=run.artifact_bundle_id,
                        benchmark_run_id=run.benchmark_run_id,
                        started_at=run.started_at,
                        completed_at=run.completed_at,
                    )
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
        async with _session() as session:
            stmt = select(WorkflowRunRecord).where(WorkflowRunRecord.id == run_id)
            if not current_user.is_admin():
                stmt = stmt.where(WorkflowRunRecord.owner_user_id == current_user.user_id)
            result = await session.execute(stmt)
            record = result.scalar_one_or_none()

        if record is None:
            raise not_found("Workflow run", run_id)
        return _run_to_response(_workflow_record_to_run(record))

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
        _require_benchmark_storage(mongo_runtime)

        if body.workflow_run_id is not None:
            async with _session() as session:
                stmt = select(WorkflowRunRecord).where(WorkflowRunRecord.id == body.workflow_run_id)
                if not current_user.is_admin():
                    stmt = stmt.where(WorkflowRunRecord.owner_user_id == current_user.user_id)
                result = await session.execute(stmt)
                workflow_record = result.scalar_one_or_none()
            if workflow_record is None:
                raise not_found("Workflow run", body.workflow_run_id)

        run = benchmark_service.create(
            benchmark_family=body.benchmark_family,
            quantum_service_id=body.quantum_service_id,
            classical_service_id=body.classical_service_id,
            dataset_ref=body.dataset_ref,
            dataset_version=body.dataset_version,
            workflow_run_id=body.workflow_run_id,
        )
        await BenchmarkResultDocument(
            benchmark_id=run.benchmark_id,
            owner_user_id=current_user.user_id,
            workflow_id=run.workflow_run_id or "",
            benchmark_family=run.benchmark_family,
            quantum_service_id=run.quantum_service_id,
            classical_service_id=run.classical_service_id,
            metrics=run.model_dump(mode="json"),
            created_at=run.submitted_at,
            updated_at=run.submitted_at,
        ).insert()
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
        _require_benchmark_storage(mongo_runtime)

        doc = await BenchmarkResultDocument.find_one(
            BenchmarkResultDocument.benchmark_id == benchmark_id
        )
        if doc is None:
            raise not_found("Benchmark run", benchmark_id)
        if not current_user.is_admin() and doc.owner_user_id != current_user.user_id:
            raise not_found("Benchmark run", benchmark_id)

        return _benchmark_to_response(_benchmark_doc_to_run(doc))

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


def _workflow_record_to_run(record: WorkflowRunRecord) -> WorkflowRun:
    return WorkflowRun(
        run_id=record.id,
        workflow_definition_id=record.workflow_definition_id,
        owner_user_id=record.owner_user_id,
        project_id=record.project_id,
        workflow_type=WorkflowType(record.workflow_type),
        status=WorkflowRunStatus(record.status),
        input_snapshot=record.input_snapshot,
        output_snapshot=record.output_snapshot,
        fragment_count=record.fragment_count,
        completed_fragments=record.completed_fragments,
        failed_fragments=record.failed_fragments,
        artifact_bundle_id=record.artifact_bundle_id,
        benchmark_run_id=record.benchmark_run_id,
        submitted_at=record.created_at,
        started_at=record.started_at,
        completed_at=record.completed_at,
    )


def _benchmark_doc_to_run(doc: BenchmarkResultDocument) -> BenchmarkRun:
    payload = dict(doc.metrics)
    payload.setdefault("benchmark_id", doc.benchmark_id)
    payload.setdefault("workflow_run_id", doc.workflow_id or None)
    payload.setdefault("benchmark_family", doc.benchmark_family)
    payload.setdefault("quantum_service_id", doc.quantum_service_id)
    payload.setdefault("classical_service_id", doc.classical_service_id)
    payload.setdefault("submitted_at", doc.created_at)
    payload.setdefault("completed_at", None)
    return BenchmarkRun.model_validate(payload)


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


def _require_benchmark_storage(mongo_runtime: MongoRuntime | None) -> None:
    if mongo_runtime is None:
        raise PlatformException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error=ErrorCode.SERVICE_UNAVAILABLE,
            message="Benchmark persistence is not configured.",
        )
