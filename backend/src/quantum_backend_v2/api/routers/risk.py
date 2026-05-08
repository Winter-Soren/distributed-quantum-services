"""Quantum Risk Engine API router — Track D."""

from __future__ import annotations

import csv
import io

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Query, UploadFile, status

from quantum_backend_v2.api.deps.auth import CurrentUser
from quantum_backend_v2.api.errors.models import not_found
from quantum_backend_v2.api.models.risk import (
    CreditAsset,
    EquityHolding,
    RiskJobRequest,
    RiskJobResponse,
    RiskJobSummary,
    RiskSubmitResponse,
)
from quantum_backend_v2.application.parity import RiskJobService


def build_risk_router(*, risk_job_service: RiskJobService) -> APIRouter:
    """Build the quantum risk engine router."""
    router = APIRouter(prefix="/api/v1/risk", tags=["risk"])

    @router.post(
        "/submit",
        response_model=RiskSubmitResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Submit a quantum risk analysis job (JSON body)",
    )
    async def submit_risk_job(
        request: RiskJobRequest,
        background_tasks: BackgroundTasks,
        current_user: CurrentUser,
    ) -> RiskSubmitResponse:
        request_payload = request.model_dump()
        portfolio_size = (
            len(request.holdings) if request.risk_model == "equity" else len(request.assets)
        )
        record = await risk_job_service.submit(
            risk_model=request.risk_model,
            portfolio_size=portfolio_size,
            owner_user_id=current_user.user_id,
            request_payload=request_payload,
        )
        background_tasks.add_task(
            risk_job_service.process,
            job_id=record.id,
            request_payload=request_payload,
        )
        return RiskSubmitResponse(
            job_id=record.id,
            status=record.status,
            risk_model=record.risk_model,
            portfolio_size=record.portfolio_size,
        )

    @router.post(
        "/submit-csv",
        response_model=RiskSubmitResponse,
        status_code=status.HTTP_201_CREATED,
        summary="Submit a risk job by uploading a portfolio CSV",
    )
    async def submit_risk_csv(
        background_tasks: BackgroundTasks,
        current_user: CurrentUser,
        file: UploadFile = File(..., description="Portfolio CSV — equity or credit format"),
        num_uncertainty_qubits: int = Query(default=5, ge=3, le=8),
        epsilon: float = Query(default=0.05, gt=0, lt=0.5),
        alpha: float = Query(default=0.05, gt=0, lt=0.5),
        lookback_days: int = Query(default=504, ge=60, le=2520),
    ) -> RiskSubmitResponse:
        contents = await file.read()
        try:
            text = contents.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="CSV must be UTF-8 encoded.")

        reader = csv.DictReader(io.StringIO(text))
        if reader.fieldnames is None:
            raise HTTPException(status_code=400, detail="CSV appears to be empty.")
        fields = {f.strip().lower() for f in reader.fieldnames}
        rows = [{k.strip().lower(): (v.strip() if v else "") for k, v in row.items()} for row in reader]
        if not rows:
            raise HTTPException(status_code=400, detail="CSV has no data rows.")

        # Auto-detect mode: credit if it has 'default_probability', equity otherwise
        if "default_probability" in fields:
            risk_model = "credit"
            required = {"principal", "default_probability", "recovery_rate"}
            missing = required - fields
            if missing:
                raise HTTPException(status_code=400, detail=f"CSV missing: {sorted(missing)}")
            assets: list[CreditAsset] = []
            for i, row in enumerate(rows):
                assets.append(
                    CreditAsset(
                        loan_id=row.get("loan_id", f"L{i:03d}"),
                        principal=float(row["principal"]),
                        default_probability=float(row["default_probability"]),
                        recovery_rate=float(row["recovery_rate"]),
                        sensitivity_rho=float(row.get("sensitivity_rho") or 0.15),
                        sector=row.get("sector", ""),
                    )
                )
            request_payload = {
                "risk_model": "credit",
                "assets": [a.model_dump() for a in assets],
                "num_uncertainty_qubits": num_uncertainty_qubits,
                "epsilon": epsilon,
                "alpha": alpha,
            }
            portfolio_size = len(assets)
        else:
            risk_model = "equity"
            required = {"ticker"}
            missing = required - fields
            if missing:
                raise HTTPException(status_code=400, detail="CSV must have a 'ticker' column for equity mode.")
            holdings: list[EquityHolding] = []
            for row in rows:
                weight_raw = row.get("weight", "").strip()
                weight = float(weight_raw) if weight_raw else 1.0
                holdings.append(EquityHolding(ticker=row["ticker"].upper(), weight=weight))
            request_payload = {
                "risk_model": "equity",
                "holdings": [h.model_dump() for h in holdings],
                "lookback_days": lookback_days,
                "num_uncertainty_qubits": num_uncertainty_qubits,
                "epsilon": epsilon,
                "alpha": alpha,
            }
            portfolio_size = len(holdings)

        record = await risk_job_service.submit(
            risk_model=risk_model,
            portfolio_size=portfolio_size,
            owner_user_id=current_user.user_id,
            request_payload=request_payload,
        )
        background_tasks.add_task(
            risk_job_service.process,
            job_id=record.id,
            request_payload=request_payload,
        )
        return RiskSubmitResponse(
            job_id=record.id,
            status=record.status,
            risk_model=record.risk_model,
            portfolio_size=record.portfolio_size,
        )

    @router.get(
        "/{job_id}",
        response_model=RiskJobResponse,
        summary="Get risk job status and results",
    )
    async def get_risk_job(
        job_id: str,
        current_user: CurrentUser,
    ) -> RiskJobResponse:
        record = await risk_job_service.get_job(job_id, current_user=current_user)
        if record is None:
            raise not_found("Risk job", job_id)
        return RiskJobResponse(
            job_id=record.id,
            status=record.status,
            risk_model=record.risk_model,
            portfolio_size=record.portfolio_size,
            result=record.result_payload,
            error=record.error,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )

    @router.get(
        "",
        response_model=list[RiskJobSummary],
        summary="List risk jobs",
    )
    async def list_risk_jobs(
        current_user: CurrentUser,
        limit: int = Query(default=20, ge=1, le=100),
    ) -> list[RiskJobSummary]:
        records = await risk_job_service.list_jobs(current_user=current_user, limit=limit)
        return [
            RiskJobSummary(
                job_id=record.id,
                status=record.status,
                risk_model=record.risk_model,
                portfolio_size=record.portfolio_size,
                error=record.error,
                created_at=record.created_at,
                updated_at=record.updated_at,
            )
            for record in records
        ]

    return router
