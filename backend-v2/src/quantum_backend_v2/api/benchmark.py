"""FastAPI endpoint for running quantum vs classical portfolio benchmarks.

This provides a proper API entrypoint instead of scripts.
"""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel

from quantum_backend_v2.application.financial_portfolio import (
    PortfolioOptimizationConfig,
    build_portfolio_optimization_artifacts,
)

router = APIRouter(prefix="/benchmark", tags=["benchmark"])


class BenchmarkRequest(BaseModel):
    """Request model for portfolio benchmark."""

    max_assets: int = 10
    risk_aversion: float = 0.5
    parameter_search_steps: int = 10
    budget: int | None = None


class BenchmarkResponse(BaseModel):
    """Response model with benchmark results."""

    job_id: str
    selected_tickers: list[str]
    classical_time_ms: float
    quantum_time_ms: float
    classical_solution: dict[str, Any]
    quantum_solution: dict[str, Any]
    winner: str
    solution_match: bool
    fidelity: float | None
    dataset_info: dict[str, Any]
    timings: dict[str, Any]


@router.post("/portfolio", response_model=BenchmarkResponse)
async def benchmark_portfolio(
    csv_file: UploadFile = File(...),
    max_assets: int = Form(12),
    risk_aversion: float = Form(0.5),
    parameter_search_steps: int = Form(10),
    budget: int | None = Form(None),
) -> BenchmarkResponse:
    """Run quantum vs classical portfolio optimization benchmark.

    This endpoint:
    1. Loads CSV price data
    2. Calculates returns & covariance
    3. Runs classical exact/heuristic optimization
    4. Builds QAOA circuit and optimizes parameters
    5. Compares results

    Args:
        csv_file: CSV file with price data (wide or long format)
        max_assets: Maximum number of assets to include
        risk_aversion: Risk aversion parameter (default 0.5)
        parameter_search_steps: QAOA parameter search steps
        budget: Portfolio budget constraint (None = max_assets/2)

    Returns:
        BenchmarkResponse with detailed comparison results
    """
    # Read CSV
    csv_bytes = await csv_file.read()

    # Generate job ID
    job_id = f"benchmark-{int(time.time())}"

    # Build artifacts (this does ALL the real computation)
    artifacts = build_portfolio_optimization_artifacts(
        csv_bytes=csv_bytes,
        job_id=job_id,
        filename=csv_file.filename or "upload.csv",
        config=PortfolioOptimizationConfig(
            max_assets_considered=max_assets,
            risk_aversion=risk_aversion,
            parameter_search_steps=parameter_search_steps,
            budget=budget,
        ),
    )

    # Extract results from payload
    payload = artifacts.payload
    timings = payload["benchmark"]["timings"]
    dataset = payload.get("dataset", {})
    classical_sol = payload["benchmark"]["classical"]
    quantum_sol = payload["benchmark"]["quantum"]
    comparison = payload["benchmark"]["comparison"]

    # Determine winner
    classical_ms = timings["classical_end_to_end_duration_ms"]
    quantum_ms = timings["quantum_local_end_to_end_duration_ms"]
    winner = "classical" if classical_ms < quantum_ms else "quantum"

    # Check solution match
    classical_bitstring = classical_sol["bitstring"]
    quantum_bitstring = quantum_sol["bitstring"]
    solution_match = classical_bitstring == quantum_bitstring

    # Get fidelity if available
    fidelity = quantum_sol.get("fidelity")

    return BenchmarkResponse(
        job_id=job_id,
        selected_tickers=dataset.get("selected_tickers", []),
        classical_time_ms=classical_ms,
        quantum_time_ms=quantum_ms,
        classical_solution={
            "bitstring": classical_bitstring,
            "selected_assets": classical_sol["selected_assets"],
            "objective": classical_sol["objective"],
            "annualized_return": classical_sol["annualized_return"],
            "annualized_variance": classical_sol["annualized_variance"],
        },
        quantum_solution={
            "bitstring": quantum_bitstring,
            "selected_assets": quantum_sol["selected_assets"],
            "objective": quantum_sol["objective"],
            "annualized_return": quantum_sol["annualized_return"],
            "annualized_variance": quantum_sol["annualized_variance"],
            "probability": quantum_sol.get("probability"),
        },
        winner=winner,
        solution_match=solution_match,
        fidelity=fidelity,
        dataset_info={
            "asset_count": dataset.get("asset_count"),
            "period_count": dataset.get("period_count"),
            "start_date": dataset.get("start_date"),
            "end_date": dataset.get("end_date"),
            "frequency": dataset.get("inferred_frequency"),
        },
        timings={
            "classical_ms": classical_ms,
            "quantum_ms": quantum_ms,
            "quantum_parameter_search_ms": timings.get("quantum_parameter_search_duration_ms"),
            "quantum_circuit_compile_ms": timings.get("quantum_circuit_compile_duration_ms"),
            "parameter_evaluations": payload.get("solver_diagnostics", {}).get("quantum_solver", {}).get("parameter_evaluations"),
        },
    )


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "quantum-benchmark"}
