"""Data models for financial analysis jobs."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class FinancialJobStatus(str, Enum):
    QUEUED = "QUEUED"
    INGESTING = "INGESTING"
    ANALYSING = "ANALYSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclass
class FinancialJobRecord:
    job_id: str
    status: FinancialJobStatus
    filename: str
    row_count: int | None
    col_count: int | None
    error: str | None
    result_json: str | None
    created_at: datetime
    updated_at: datetime


@dataclass
class ColumnProfile:
    name: str
    dtype: str
    non_null_count: int
    null_count: int
    null_pct: float
    unique_count: int
    sample_values: list[Any]
    # numeric only
    mean: float | None = None
    median: float | None = None
    std: float | None = None
    min: float | None = None
    max: float | None = None
    q1: float | None = None
    q3: float | None = None
    iqr: float | None = None
    skewness: float | None = None
    kurtosis: float | None = None
    cv: float | None = None  # coefficient of variation
    outlier_count: int | None = None
    outlier_pct: float | None = None


@dataclass
class CorrelationPair:
    col_a: str
    col_b: str
    pearson: float
    strength: str  # "strong", "moderate", "weak"
    direction: str  # "positive", "negative"


@dataclass
class TimeSeriesInsight:
    column: str
    trend: str  # "upward", "downward", "flat", "volatile"
    trend_slope: float
    volatility: float
    period_avg: float
    period_high: float
    period_low: float
    momentum: float  # % change first→last
    cagr: float | None  # compound annual growth rate if date column present


@dataclass
class ScenarioOutput:
    label: str          # "Bull", "Base", "Bear"
    revenue_projection: float
    margin_projection: float
    valuation_estimate: float
    growth_rate: float
    discount_rate: float
    terminal_value: float


@dataclass
class DCFOutput:
    wacc: float
    terminal_growth: float
    projection_years: int
    yearly_cashflows: list[float]
    terminal_value: float
    enterprise_value: float
    equity_value: float
    per_share_value: float | None
    bull: ScenarioOutput
    base: ScenarioOutput
    bear: ScenarioOutput


@dataclass
class AnomalyPoint:
    row_index: int
    column: str
    value: float
    z_score: float
    label: str


@dataclass
class NodeExecutionSegment:
    node_id: str
    task: str
    rows_processed: int
    duration_ms: float
    fidelity_score: float


@dataclass
class FinancialAnalysisResult:
    job_id: str
    filename: str
    row_count: int
    col_count: int
    numeric_columns: list[str]
    categorical_columns: list[str]
    datetime_columns: list[str]
    column_profiles: list[ColumnProfile]
    correlations: list[CorrelationPair]
    top_correlations: list[CorrelationPair]
    time_series_insights: list[TimeSeriesInsight]
    dcf: DCFOutput | None
    anomalies: list[AnomalyPoint]
    summary_stats: dict[str, Any]
    node_execution: list[NodeExecutionSegment]
    analysis_duration_ms: float
    distributed_nodes_used: int
    fragments_executed: int
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
