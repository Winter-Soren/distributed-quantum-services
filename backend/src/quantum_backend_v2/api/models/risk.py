"""Pydantic API models for Track D — Quantum Risk Engine."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


RiskModel = Literal["equity", "credit"]


class EquityHolding(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol, e.g. AAPL")
    weight: float = Field(..., gt=0, description="Portfolio weight (will be normalised to 1)")


class CreditAsset(BaseModel):
    loan_id: str = Field(default="", description="Optional loan identifier")
    principal: float = Field(..., gt=0, description="Loan principal (absolute $)")
    default_probability: float = Field(..., ge=0.0, le=1.0, description="12-month PD")
    recovery_rate: float = Field(..., ge=0.0, le=1.0, description="Expected recovery rate (LGD = 1 - RR)")
    sensitivity_rho: float = Field(default=0.15, ge=0.0, le=1.0, description="Gaussian copula correlation ρ")
    sector: str = Field(default="", description="Sector label for display")


class RiskJobRequest(BaseModel):
    risk_model: RiskModel = Field(default="equity")
    # Equity mode
    holdings: list[EquityHolding] = Field(default_factory=list)
    lookback_days: int = Field(default=504, ge=60, le=2520, description="Trading days of history (≈2 years default)")
    # Credit mode
    assets: list[CreditAsset] = Field(default_factory=list)
    n_z_qubits: int = Field(default=2, ge=1, le=4, description="Qubits for systemic risk factor Z register")
    # Shared IQAE config
    num_uncertainty_qubits: int = Field(default=5, ge=3, le=8)
    epsilon: float = Field(default=0.05, gt=0, lt=0.5, description="IQAE precision parameter")
    alpha: float = Field(default=0.05, gt=0, lt=0.5, description="IQAE confidence level (1 - alpha)")


class RiskVaRResult(BaseModel):
    confidence_level: float
    quantum_var: float
    classical_mc_var: float
    quantum_ci: list[float]
    deviation_pct: float


class RiskAnalysisResult(BaseModel):
    job_id: str
    risk_model: RiskModel
    portfolio_size: int
    tickers: list[str]
    weights: list[float]
    var_results: list[RiskVaRResult]
    quantum_cvar_99: float
    classical_mc_cvar_99: float
    expected_loss: float
    economic_capital: float | None
    loss_distribution_quantum: list[float]
    loss_distribution_classical: list[float]
    loss_distribution_bins: list[float]
    quadratic_speedup_factor: float
    classical_mc_samples_equivalent: int
    num_qubits: int
    circuit_depth: int
    num_iqae_calls: int
    analysis_duration_ms: int
    generated_at: str


class RiskSubmitResponse(BaseModel):
    job_id: str
    status: str
    risk_model: RiskModel
    portfolio_size: int


from datetime import datetime


class RiskJobSummary(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    job_id: str
    status: str
    risk_model: str
    portfolio_size: int
    created_at: datetime
    updated_at: datetime
    error: str | None = None


class RiskJobResponse(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    job_id: str
    status: str
    risk_model: str
    portfolio_size: int
    result: RiskAnalysisResult | None = None
    error: str | None = None
    created_at: datetime
    updated_at: datetime
