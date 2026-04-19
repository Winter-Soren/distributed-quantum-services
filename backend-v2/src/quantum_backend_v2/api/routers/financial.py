"""Financial analysis API router."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, BackgroundTasks, File, Query, UploadFile, status

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import not_found
from quantum_backend_v2.api.models.financial import (
    FinancialJobResponse,
    FinancialJobStatus,
    FinancialJobSummary,
    FinancialSubmitResponse,
)


def build_financial_router(*, session_factory: object) -> APIRouter:
    """Build the financial analysis router."""
    router = APIRouter(prefix="/api/v1/finance", tags=["financial"])

    # Temporary in-memory storage
    # TODO: Replace with proper persistence
    _financial_jobs: dict[str, dict[str, Any]] = {}

    async def _process_financial_csv(job_id: str, filename: str, csv_bytes: bytes) -> None:
        """Background task to process financial CSV."""
        # Update status to analyzing
        if job_id in _financial_jobs:
            _financial_jobs[job_id]["status"] = FinancialJobStatus.ANALYZING.value
            _financial_jobs[job_id]["updated_at"] = datetime.now(timezone.utc)
        
        # TODO: Implement actual CSV processing and quantum analysis
        # For now, just mark as completed
        import asyncio
        await asyncio.sleep(1)  # Simulate processing
        
        if job_id in _financial_jobs:
            _financial_jobs[job_id]["status"] = FinancialJobStatus.COMPLETED.value
            _financial_jobs[job_id]["row_count"] = 100  # Mock value
            _financial_jobs[job_id]["col_count"] = 10  # Mock value
            _financial_jobs[job_id]["updated_at"] = datetime.now(timezone.utc)
            _financial_jobs[job_id]["result"] = {
                "summary": "Analysis completed",
                "quantum_advantage_detected": False,
            }

    @router.post(
        "/submit",
        response_model=FinancialSubmitResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Submit financial CSV for quantum analysis",
    )
    async def submit_financial_csv(
        background_tasks: BackgroundTasks,
        file: UploadFile = File(...),
        current_user: CurrentUser | None = None,
    ) -> FinancialSubmitResponse:
        """Submit a financial CSV file for quantum-classical benchmark analysis."""
        if not file.filename or not file.filename.lower().endswith(".csv"):
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are accepted",
            )
        
        csv_bytes = await file.read()
        if len(csv_bytes) > 50 * 1024 * 1024:  # 50 MB cap
            from fastapi import HTTPException
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="CSV file too large (max 50 MB)",
            )
        
        job_id = f"fin-{uuid.uuid4()}"
        now = datetime.now(timezone.utc)
        
        _financial_jobs[job_id] = {
            "job_id": job_id,
            "filename": file.filename,
            "status": FinancialJobStatus.INGESTING.value,
            "row_count": None,
            "col_count": None,
            "error": None,
            "result": None,
            "created_at": now,
            "updated_at": now,
        }
        
        background_tasks.add_task(_process_financial_csv, job_id, file.filename, csv_bytes)
        
        return FinancialSubmitResponse(
            job_id=job_id,
            status=FinancialJobStatus.INGESTING.value,
        )

    @router.get(
        "/{job_id}",
        response_model=FinancialJobResponse,
        summary="Get financial job status and results",
    )
    async def get_financial_job(
        job_id: str,
        current_user: CurrentUser,
    ) -> FinancialJobResponse:
        """Get the status and results of a financial analysis job."""
        job_data = _financial_jobs.get(job_id)
        if job_data is None:
            raise not_found("Financial job", job_id)
        
        return FinancialJobResponse(**job_data)

    @router.get(
        "",
        response_model=list[FinancialJobSummary],
        summary="List financial jobs",
    )
    async def list_financial_jobs(
        current_user: CurrentUser,
        limit: int = Query(default=20, ge=1, le=100),
    ) -> list[FinancialJobSummary]:
        """List recent financial analysis jobs."""
        jobs = list(_financial_jobs.values())
        jobs.sort(key=lambda j: j["created_at"], reverse=True)
        jobs = jobs[:limit]
        
        return [
            FinancialJobSummary(
                job_id=job["job_id"],
                filename=job["filename"],
                status=job["status"],
                row_count=job["row_count"],
                col_count=job["col_count"],
                error=job["error"],
                created_at=job["created_at"],
                updated_at=job["updated_at"],
            )
            for job in jobs
        ]

    return router
