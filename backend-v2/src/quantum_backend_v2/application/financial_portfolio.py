"""Portfolio-optimization workflow for Track B quantum finance."""

from __future__ import annotations

import csv
import io
import math
import re
import time
from dataclasses import dataclass
from datetime import date, datetime, timezone
from itertools import combinations
from typing import Any

import numpy as np
from qiskit import qasm2, transpile
from qiskit.circuit import QuantumCircuit
from qiskit.circuit.library import QAOAAnsatz
from qiskit.primitives import StatevectorEstimator
from qiskit.quantum_info import SparsePauliOp, Statevector


_DATE_COLUMN_ALIASES = (
    "date",
    "timestamp",
    "time",
    "as_of",
    "trading_date",
    "period",
    "pricedate",
)
_TICKER_COLUMN_ALIASES = (
    "ticker",
    "symbol",
    "asset",
    "security",
    "stock",
    "instrument",
)
_VALUE_COLUMN_ALIASES = (
    "adjusted_close",
    "adj_close",
    "adjclose",
    "close",
    "price",
    "close_price",
    "closing_price",
    "return",
    "returns",
    "daily_return",
    "pct_return",
)
_DATE_FORMATS = (
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%d-%m-%Y",
    "%Y-%m",
    "%Y/%m",
)
_MIN_ASSET_COUNT = 2
_MIN_OBSERVATIONS = 4
_DEFAULT_MAX_ASSETS = 6
_DEFAULT_PARAMETER_STEPS = 9
_MAX_QAOA_REPS = 4
_DEFAULT_LOCAL_REFINEMENT_ROUNDS = 3
_LOCAL_REFINEMENT_POINTS = 5
_QAOA_TOP_SEEDS = 4
_QAOA_RANDOM_SEED = 19
_MARKET_TICKER_PATTERN = re.compile(r"^[A-Z][A-Z0-9.\-]{0,9}$")
_METRIC_COLUMN_KEYWORDS = (
    "revenue",
    "gross",
    "operating",
    "income",
    "profit",
    "net",
    "margin",
    "cash",
    "flow",
    "assets",
    "liabilities",
    "equity",
    "inventory",
    "capex",
    "expense",
    "ebit",
    "ebitda",
    "fcf",
    "freecashflow",
    "debt",
    "book",
    "ratio",
    "yield",
    "usd",
    "pct",
    "quarter",
    "fiscal",
    "r_and_d",
    "rnd",
    "sga",
)


@dataclass(frozen=True)
class PortfolioOptimizationConfig:
    """User-configurable knobs for the finance workflow."""

    budget: int | None = None
    risk_aversion: float = 0.5
    max_assets_considered: int = _DEFAULT_MAX_ASSETS
    date_column: str | None = None
    ticker_column: str | None = None
    value_column: str | None = None
    value_mode: str = "auto"
    qaoa_reps: int = 1
    parameter_search_steps: int = _DEFAULT_PARAMETER_STEPS


@dataclass(frozen=True)
class PortfolioOptimizationArtifacts:
    """Analysis payload plus the QASM circuit to plan/execute."""

    payload: dict[str, Any]
    circuit_qasm: str


@dataclass
class CandidateAsset:
    ticker: str
    returns_by_date: dict[date, float]
    mean_return: float
    variance: float
    volatility: float
    sharpe_like: float
    cumulative_return: float
    periods: int


@dataclass(frozen=True)
class DatasetSemanticsSummary:
    asset_identifier_mode: str
    asset_semantics: str
    benchmark_readiness: str
    market_comparable: bool
    semantic_notes: tuple[str, ...]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def build_portfolio_optimization_artifacts(
    *,
    csv_bytes: bytes,
    job_id: str,
    filename: str,
    config: PortfolioOptimizationConfig,
) -> PortfolioOptimizationArtifacts:
    """Parse a market dataset and build classical + quantum portfolio artifacts."""
    started_at = time.perf_counter()
    resolved_config = _normalize_config(config)
    headers, rows = _read_csv(csv_bytes)
    date_column = _resolve_required_column(
        headers,
        explicit=resolved_config.date_column,
        aliases=_DATE_COLUMN_ALIASES,
        label="date",
    )
    ticker_column = _resolve_optional_column(
        headers,
        explicit=resolved_config.ticker_column,
        aliases=_TICKER_COLUMN_ALIASES,
        excluded={date_column},
    )

    if ticker_column is not None:
        value_column = _resolve_required_column(
            headers,
            explicit=resolved_config.value_column,
            aliases=_VALUE_COLUMN_ALIASES,
            label="value",
            excluded={date_column, ticker_column},
        )
        input_layout = "long"
        inferred_value_mode = _resolve_value_mode(
            explicit=resolved_config.value_mode,
            column_name=value_column,
        )
        returns_by_ticker, dropped_records = _extract_long_returns(
            rows=rows,
            date_column=date_column,
            ticker_column=ticker_column,
            value_column=value_column,
            value_mode=inferred_value_mode,
        )
        source_asset_headers = list(returns_by_ticker)
    else:
        value_columns = _resolve_wide_value_columns(headers, rows, date_column)
        input_layout = "wide"
        inferred_value_mode = "prices" if resolved_config.value_mode == "auto" else resolved_config.value_mode
        if inferred_value_mode not in {"prices", "returns"}:
            raise ValueError(
                "Wide-format datasets require value_mode='prices' or value_mode='returns'."
            )
        returns_by_ticker, dropped_records = _extract_wide_returns(
            rows=rows,
            date_column=date_column,
            value_columns=value_columns,
            value_mode=inferred_value_mode,
        )
        value_column = None
        source_asset_headers = value_columns

    raw_asset_count = len(returns_by_ticker)
    dataset_semantics = _summarize_dataset_semantics(
        input_layout=input_layout,
        ticker_column=ticker_column,
        source_asset_headers=source_asset_headers,
    )
    candidates = _build_candidate_assets(returns_by_ticker)
    if len(candidates) < _MIN_ASSET_COUNT:
        raise ValueError(
            "Need at least two assets with four or more return observations for portfolio optimization."
        )

    selected_assets, aligned_dates = _select_assets_for_optimization(
        candidates,
        max_assets=resolved_config.max_assets_considered,
    )
    if len(selected_assets) < _MIN_ASSET_COUNT:
        raise ValueError("Asset screening left fewer than two usable tickers.")

    aligned_matrix = np.array(
        [
            [asset.returns_by_date[current_date] for asset in selected_assets]
            for current_date in aligned_dates
        ],
        dtype=float,
    )
    annualization_factor, inferred_frequency = _infer_annualization(aligned_dates)
    mean_returns = aligned_matrix.mean(axis=0) * annualization_factor
    covariance = np.cov(aligned_matrix, rowvar=False, ddof=1)
    covariance = np.atleast_2d(covariance) * annualization_factor

    budget = _resolve_budget(
        requested_budget=resolved_config.budget,
        asset_count=len(selected_assets),
    )
    penalty = _choose_budget_penalty(
        mean_returns=mean_returns,
        covariance=covariance,
        risk_aversion=resolved_config.risk_aversion,
    )
    linear_terms, pair_terms, constant_term = _build_qubo_terms(
        mean_returns=mean_returns,
        covariance=covariance,
        risk_aversion=resolved_config.risk_aversion,
        budget=budget,
        penalty=penalty,
    )
    shared_preparation_duration_ms = int((time.perf_counter() - started_at) * 1000)
    classical_started_at = time.perf_counter()
    classical_portfolios = _enumerate_feasible_portfolios(
        tickers=[asset.ticker for asset in selected_assets],
        mean_returns=mean_returns,
        covariance=covariance,
        risk_aversion=resolved_config.risk_aversion,
        budget=budget,
    )
    classical_solution = _solve_classically(classical_portfolios=classical_portfolios)
    classical_duration_ms = int((time.perf_counter() - classical_started_at) * 1000)

    cost_operator, ising_offset, linear_fields, couplings = _qubo_to_ising(
        asset_count=len(selected_assets),
        linear_terms=linear_terms,
        pair_terms=pair_terms,
        constant_term=constant_term,
    )
    quantum_started_at = time.perf_counter()
    quantum_solution = _solve_quantum_qaoa(
        cost_operator=cost_operator,
        tickers=[asset.ticker for asset in selected_assets],
        mean_returns=mean_returns,
        covariance=covariance,
        risk_aversion=resolved_config.risk_aversion,
        budget=budget,
        qaoa_reps=resolved_config.qaoa_reps,
        parameter_search_steps=resolved_config.parameter_search_steps,
    )
    quantum_duration_ms = int((time.perf_counter() - quantum_started_at) * 1000)

    selection_probabilities = _per_asset_selection_probability(
        tickers=[asset.ticker for asset in selected_assets],
        full_probabilities=quantum_solution["full_probabilities"],
    )
    asset_universe = _build_asset_universe_summary(
        tickers=[asset.ticker for asset in selected_assets],
        aligned_returns=aligned_matrix,
        annualization_factor=annualization_factor,
        classical_selected=set(classical_solution["selected_assets"]),
        quantum_selected=set(quantum_solution["solution"]["selected_assets"]),
        selection_probabilities=selection_probabilities,
    )
    frontier = _build_frontier_summary(
        feasible_portfolios=classical_portfolios,
        quantum_solution=quantum_solution["solution"],
    )
    comparison = _build_comparison_summary(
        classical_solution=classical_solution,
        quantum_solution=quantum_solution["solution"],
        feasible_probability_mass=float(quantum_solution["feasible_probability_mass"]),
        optimum_probability=(
            float(quantum_solution["full_probabilities"].get(classical_solution["bitstring"]))
            if classical_solution["bitstring"] in quantum_solution["full_probabilities"]
            else None
        ),
        objective_label=(
            f"annualized_return - {resolved_config.risk_aversion:.3f} * annualized_variance"
        ),
    )
    solver_diagnostics = _build_solver_diagnostics(
        asset_count=len(selected_assets),
        budget=budget,
        feasible_portfolios=classical_portfolios,
        quantum_solution=quantum_solution,
    )
    warnings = _build_dataset_warnings(
        raw_asset_count=raw_asset_count,
        selected_assets=selected_assets,
        aligned_dates=aligned_dates,
        input_layout=input_layout,
        value_mode=inferred_value_mode,
        dropped_records=dropped_records,
        dataset_semantics=dataset_semantics,
    )

    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    selected_tickers = [asset.ticker for asset in selected_assets]
    dataset_summary = {
        "input_layout": input_layout,
        "row_count": len(rows),
        "col_count": len(headers),
        "period_count": len(aligned_dates),
        "raw_asset_count": raw_asset_count,
        "asset_count": len(selected_tickers),
        "start_date": aligned_dates[0].isoformat(),
        "end_date": aligned_dates[-1].isoformat(),
        "inferred_frequency": inferred_frequency,
        "return_method": "provided_returns" if inferred_value_mode == "returns" else "simple_returns",
        "date_column": date_column,
        "ticker_column": ticker_column,
        "value_column": value_column,
        "dropped_records": dropped_records,
        "selected_tickers": selected_tickers,
        "asset_identifier_mode": dataset_semantics.asset_identifier_mode,
        "asset_semantics": dataset_semantics.asset_semantics,
        "benchmark_readiness": dataset_semantics.benchmark_readiness,
        "market_comparable": dataset_semantics.market_comparable,
        "semantic_notes": list(dataset_semantics.semantic_notes),
    }
    request_summary = {
        "problem_type": "portfolio_optimization",
        "budget": budget,
        "risk_aversion": resolved_config.risk_aversion,
        "penalty": penalty,
        "max_assets_considered": resolved_config.max_assets_considered,
        "value_mode": resolved_config.value_mode,
        "resolved_value_mode": inferred_value_mode,
        "qaoa_reps": resolved_config.qaoa_reps,
        "parameter_search_steps": resolved_config.parameter_search_steps,
        "date_column": resolved_config.date_column,
        "ticker_column": resolved_config.ticker_column,
        "value_column": resolved_config.value_column,
    }
    payload = {
        "job_id": job_id,
        "filename": filename,
        "problem_type": "portfolio_optimization",
        "summary": (
            f"Optimized a {budget}-asset portfolio over {len(selected_tickers)} screened tickers "
            f"and {len(aligned_dates)} aligned periods."
        ),
        "row_count": len(rows),
        "col_count": len(headers),
        "generated_at": _utc_now_iso(),
        "analysis_duration_ms": elapsed_ms,
        "distributed_nodes_used": 0,
        "fragments_executed": 0,
        "dataset": dataset_summary,
        "request": request_summary,
        "asset_universe": asset_universe,
        "solver_diagnostics": solver_diagnostics,
        "benchmark": {
            "objective_label": comparison["objective_label"],
            "allocation_model": "equal_weight_binary_selection",
            "classical": classical_solution,
            "quantum": quantum_solution["solution"],
            "comparison": comparison["comparison"],
            "frontier": frontier,
            "timings": {
                "shared_preparation_duration_ms": shared_preparation_duration_ms,
                "classical_duration_ms": classical_duration_ms,
                "classical_solve_duration_ms": classical_duration_ms,
                "classical_end_to_end_duration_ms": shared_preparation_duration_ms + classical_duration_ms,
                "quantum_duration_ms": quantum_duration_ms,
                "quantum_solve_duration_ms": quantum_duration_ms,
                "quantum_parameter_search_duration_ms": quantum_solution["timings"][
                    "parameter_search_duration_ms"
                ],
                "quantum_solution_extraction_duration_ms": quantum_solution["timings"][
                    "solution_extraction_duration_ms"
                ],
                "quantum_circuit_compile_duration_ms": quantum_solution["timings"][
                    "circuit_compile_duration_ms"
                ],
                "quantum_local_end_to_end_duration_ms": (
                    shared_preparation_duration_ms + quantum_duration_ms
                ),
                "quantum_end_to_end_duration_ms": 0,
                "service_wait_duration_ms": 0,
                "plan_compile_duration_ms": 0,
                "distributed_execution_duration_ms": 0,
                "report_assembly_duration_ms": 0,
                "workflow_total_duration_ms": elapsed_ms,
            },
        },
        "warnings": warnings,
        "quantum_execution": {
            "circuit_text": quantum_solution["circuit_qasm"],
            "encoded_assets": selected_tickers,
            "qaoa_parameters": {
                "reps": resolved_config.qaoa_reps,
                "beta": quantum_solution["beta"],
                "gamma": quantum_solution["gamma"],
                "beta_parameters": quantum_solution["beta_parameters"],
                "gamma_parameters": quantum_solution["gamma_parameters"],
                "parameter_search_steps": resolved_config.parameter_search_steps,
                "search_strategy": quantum_solution["optimizer"]["strategy"],
                "mixer_strategy": quantum_solution["mixer_strategy"],
                "initial_state_strategy": quantum_solution["initial_state_strategy"],
                "warm_start_bitstring": quantum_solution["warm_start_bitstring"],
            },
            "circuit_summary": quantum_solution["circuit_summary"],
            "top_states": quantum_solution["top_states"],
            "hamiltonian": {
                "offset": ising_offset,
                "linear_fields": linear_fields,
                "couplings": couplings,
                "penalty_strategy": "quadratic_budget_penalty",
            },
            "plan": None,
            "fragment_results": [],
            "quantum_result": None,
        },
    }
    return PortfolioOptimizationArtifacts(
        payload=payload,
        circuit_qasm=quantum_solution["circuit_qasm"],
    )


def _normalize_config(config: PortfolioOptimizationConfig) -> PortfolioOptimizationConfig:
    value_mode = config.value_mode.strip().lower()
    if value_mode not in {"auto", "prices", "returns"}:
        raise ValueError("value_mode must be one of auto, prices, or returns.")
    if not (1 <= config.qaoa_reps <= _MAX_QAOA_REPS):
        raise ValueError(f"qaoa_reps must be between 1 and {_MAX_QAOA_REPS}.")
    if not (2 <= config.max_assets_considered <= 8):
        raise ValueError("max_assets_considered must be between 2 and 8.")
    if not (0.0 <= config.risk_aversion <= 10.0):
        raise ValueError("risk_aversion must be between 0.0 and 10.0.")
    if not (3 <= config.parameter_search_steps <= 25):
        raise ValueError("parameter_search_steps must be between 3 and 25.")
    return PortfolioOptimizationConfig(
        budget=config.budget,
        risk_aversion=float(config.risk_aversion),
        max_assets_considered=int(config.max_assets_considered),
        date_column=_normalize_optional_text(config.date_column),
        ticker_column=_normalize_optional_text(config.ticker_column),
        value_column=_normalize_optional_text(config.value_column),
        value_mode=value_mode,
        qaoa_reps=int(config.qaoa_reps),
        parameter_search_steps=int(config.parameter_search_steps),
    )


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None


def _read_csv(csv_bytes: bytes) -> tuple[list[str], list[dict[str, str]]]:
    text = csv_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    if not headers:
        raise ValueError("CSV file is missing a header row.")
    rows = [
        {
            header: (row.get(header, "") or "").strip()
            for header in headers
        }
        for row in reader
    ]
    if not rows:
        raise ValueError("CSV file contains no data rows.")
    return headers, rows


def _resolve_required_column(
    headers: list[str],
    *,
    explicit: str | None,
    aliases: tuple[str, ...],
    label: str,
    excluded: set[str] | None = None,
) -> str:
    column = _resolve_optional_column(
        headers,
        explicit=explicit,
        aliases=aliases,
        excluded=excluded,
    )
    if column is None:
        raise ValueError(f"Could not infer the {label} column from the uploaded CSV.")
    return column


def _resolve_optional_column(
    headers: list[str],
    *,
    explicit: str | None,
    aliases: tuple[str, ...],
    excluded: set[str] | None = None,
) -> str | None:
    excluded = excluded or set()
    header_map = {_normalize_header(header): header for header in headers}

    if explicit is not None:
        normalized_explicit = _normalize_header(explicit)
        resolved = header_map.get(normalized_explicit)
        if resolved is None:
            raise ValueError(f"Column override '{explicit}' was not found in the CSV.")
        if resolved in excluded:
            raise ValueError(f"Column '{resolved}' cannot be reused for multiple finance fields.")
        return resolved

    for alias in aliases:
        resolved = header_map.get(_normalize_header(alias))
        if resolved is not None and resolved not in excluded:
            return resolved
    return None


def _resolve_wide_value_columns(
    headers: list[str],
    rows: list[dict[str, str]],
    date_column: str,
) -> list[str]:
    value_columns: list[str] = []
    for header in headers:
        if header == date_column:
            continue
        numeric_count = 0
        populated_count = 0
        for row in rows:
            raw_value = row.get(header, "")
            if not raw_value:
                continue
            populated_count += 1
            if _parse_number(raw_value) is not None:
                numeric_count += 1
        if populated_count > 0 and numeric_count >= max(1, populated_count // 2):
            value_columns.append(header)

    if len(value_columns) < _MIN_ASSET_COUNT:
        raise ValueError(
            "Wide-format portfolio datasets need a date column plus at least two numeric asset columns."
        )
    return value_columns


def _resolve_value_mode(*, explicit: str, column_name: str) -> str:
    if explicit != "auto":
        return explicit
    normalized_column = _normalize_header(column_name)
    if "return" in normalized_column or normalized_column.startswith("pct"):
        return "returns"
    return "prices"


def _extract_long_returns(
    *,
    rows: list[dict[str, str]],
    date_column: str,
    ticker_column: str,
    value_column: str,
    value_mode: str,
) -> tuple[dict[str, dict[date, float]], int]:
    values_by_ticker: dict[str, dict[date, float]] = {}
    dropped_records = 0

    for row in rows:
        parsed_date = _parse_date(row.get(date_column, ""))
        ticker = row.get(ticker_column, "").strip().upper()
        numeric_value = _parse_number(row.get(value_column, ""))
        if parsed_date is None or not ticker or numeric_value is None:
            dropped_records += 1
            continue
        values_by_ticker.setdefault(ticker, {})[parsed_date] = numeric_value

    if value_mode == "returns":
        return values_by_ticker, dropped_records
    return _prices_to_returns(values_by_ticker), dropped_records


def _extract_wide_returns(
    *,
    rows: list[dict[str, str]],
    date_column: str,
    value_columns: list[str],
    value_mode: str,
) -> tuple[dict[str, dict[date, float]], int]:
    values_by_ticker: dict[str, dict[date, float]] = {column.upper(): {} for column in value_columns}
    dropped_records = 0

    for row in rows:
        parsed_date = _parse_date(row.get(date_column, ""))
        if parsed_date is None:
            dropped_records += 1
            continue
        any_value = False
        for column in value_columns:
            numeric_value = _parse_number(row.get(column, ""))
            if numeric_value is None:
                continue
            any_value = True
            values_by_ticker[column.upper()][parsed_date] = numeric_value
        if not any_value:
            dropped_records += 1

    if value_mode == "returns":
        return values_by_ticker, dropped_records
    return _prices_to_returns(values_by_ticker), dropped_records


def _prices_to_returns(
    prices_by_ticker: dict[str, dict[date, float]],
) -> dict[str, dict[date, float]]:
    returns_by_ticker: dict[str, dict[date, float]] = {}
    for ticker, date_to_price in prices_by_ticker.items():
        ordered = sorted(date_to_price.items(), key=lambda item: item[0])
        if len(ordered) < _MIN_OBSERVATIONS + 1:
            continue
        returns: dict[date, float] = {}
        previous_price: float | None = None
        for current_date, current_price in ordered:
            if previous_price is None:
                previous_price = current_price
                continue
            if previous_price == 0:
                previous_price = current_price
                continue
            returns[current_date] = (current_price / previous_price) - 1.0
            previous_price = current_price
        if len(returns) >= _MIN_OBSERVATIONS:
            returns_by_ticker[ticker] = returns
    return returns_by_ticker


def _build_candidate_assets(
    returns_by_ticker: dict[str, dict[date, float]],
) -> list[CandidateAsset]:
    candidates: list[CandidateAsset] = []
    for ticker, series in returns_by_ticker.items():
        if len(series) < _MIN_OBSERVATIONS:
            continue
        ordered_returns = np.array(
            [value for _, value in sorted(series.items(), key=lambda item: item[0])],
            dtype=float,
        )
        mean_return = float(ordered_returns.mean())
        variance = float(np.var(ordered_returns, ddof=1))
        volatility = math.sqrt(max(variance, 0.0))
        sharpe_like = mean_return / volatility if volatility > 0 else mean_return
        cumulative_return = float(np.prod(1.0 + ordered_returns) - 1.0)
        candidates.append(
            CandidateAsset(
                ticker=ticker,
                returns_by_date=series,
                mean_return=mean_return,
                variance=variance,
                volatility=volatility,
                sharpe_like=sharpe_like,
                cumulative_return=cumulative_return,
                periods=len(series),
            )
        )
    return candidates


def _select_assets_for_optimization(
    candidates: list[CandidateAsset],
    *,
    max_assets: int,
) -> tuple[list[CandidateAsset], list[date]]:
    ranked = sorted(
        candidates,
        key=lambda asset: (
            -asset.sharpe_like,
            -asset.mean_return,
            asset.ticker,
        ),
    )
    selected: list[CandidateAsset] = []
    common_dates: set[date] | None = None

    for candidate in ranked:
        candidate_dates = set(candidate.returns_by_date)
        next_common = candidate_dates if common_dates is None else common_dates & candidate_dates
        if selected and len(next_common) < _MIN_OBSERVATIONS:
            continue
        selected.append(candidate)
        common_dates = next_common
        if len(selected) >= max_assets:
            break

    if common_dates is None or len(common_dates) < _MIN_OBSERVATIONS:
        raise ValueError("Could not find a common return window across enough assets.")
    if len(selected) < _MIN_ASSET_COUNT:
        raise ValueError("Asset screening produced fewer than two tradable assets.")

    return selected, sorted(common_dates)


def _infer_annualization(aligned_dates: list[date]) -> tuple[int, str]:
    if len(aligned_dates) < 2:
        return 1, "unknown"

    gaps = [
        max(1, (right - left).days)
        for left, right in zip(aligned_dates, aligned_dates[1:])
    ]
    median_gap = float(np.median(np.array(gaps, dtype=float)))
    if median_gap <= 3:
        return 252, "daily"
    if median_gap <= 10:
        return 52, "weekly"
    if median_gap <= 45:
        return 12, "monthly"
    if median_gap <= 120:
        return 4, "quarterly"
    return 1, "yearly"


def _resolve_budget(*, requested_budget: int | None, asset_count: int) -> int:
    if asset_count < _MIN_ASSET_COUNT:
        raise ValueError("Need at least two assets to define a portfolio budget.")

    if requested_budget is None:
        return min(3, max(1, (asset_count + 1) // 2))
    if not (1 <= requested_budget < asset_count):
        raise ValueError("budget must be at least 1 and smaller than the screened asset count.")
    return requested_budget


def _choose_budget_penalty(
    *,
    mean_returns: Any,
    covariance: Any,
    risk_aversion: float,
) -> float:
    mean_scale = float(np.max(np.abs(mean_returns))) if len(mean_returns) else 0.0
    covariance_scale = float(np.max(np.abs(covariance))) if covariance.size else 0.0
    return round(max(1.0, 2.5 * (mean_scale + risk_aversion * covariance_scale + 1e-6)), 6)


def _build_qubo_terms(
    *,
    mean_returns: Any,
    covariance: Any,
    risk_aversion: float,
    budget: int,
    penalty: float,
) -> tuple[list[float], dict[tuple[int, int], float], float]:
    asset_count = int(len(mean_returns))
    linear_terms = [0.0] * asset_count
    pair_terms: dict[tuple[int, int], float] = {}

    for index in range(asset_count):
        linear_terms[index] = (
            (risk_aversion * float(covariance[index, index]))
            - float(mean_returns[index])
            + penalty * (1 - 2 * budget)
        )

    for left in range(asset_count):
        for right in range(left + 1, asset_count):
            pair_terms[(left, right)] = (
                2.0 * risk_aversion * float(covariance[left, right])
            ) + (2.0 * penalty)

    constant_term = penalty * (budget**2)
    return linear_terms, pair_terms, constant_term


def _enumerate_feasible_portfolios(
    *,
    tickers: list[str],
    mean_returns: Any,
    covariance: Any,
    risk_aversion: float,
    budget: int,
) -> list[dict[str, Any]]:
    feasible_portfolios: list[dict[str, Any]] = []
    for selected_indices in combinations(range(len(tickers)), budget):
        mask = [0] * len(tickers)
        for index in selected_indices:
            mask[index] = 1
        feasible_portfolios.append(
            _portfolio_summary(
                tickers=tickers,
                mask=mask,
                mean_returns=mean_returns,
                covariance=covariance,
                risk_aversion=risk_aversion,
                budget=budget,
                probability=None,
            )
        )

    feasible_portfolios.sort(
        key=lambda candidate: (
            -float(candidate["objective"]),
            -float(candidate["expected_return"]),
            float(candidate["variance"]),
            str(candidate["bitstring"]),
        ),
    )
    for rank, candidate in enumerate(feasible_portfolios, start=1):
        candidate["rank"] = rank
    return feasible_portfolios


def _solve_classically(*, classical_portfolios: list[dict[str, Any]]) -> dict[str, Any]:
    if not classical_portfolios:
        raise ValueError("Classical solver could not evaluate any feasible portfolios.")
    return classical_portfolios[0]


def _build_frontier_summary(
    *,
    feasible_portfolios: list[dict[str, Any]],
    quantum_solution: dict[str, Any],
) -> dict[str, Any]:
    efficient_frontier = _extract_efficient_frontier(feasible_portfolios)
    quantum_rank = next(
        (
            int(candidate["rank"])
            for candidate in feasible_portfolios
            if candidate["bitstring"] == quantum_solution["bitstring"]
        ),
        None,
    )
    feasible_count = len(feasible_portfolios)
    if quantum_rank is None:
        quantum_percentile = None
    elif feasible_count <= 1:
        quantum_percentile = 1.0
    else:
        quantum_percentile = round(
            1.0 - ((quantum_rank - 1) / max(1, feasible_count - 1)),
            12,
        )

    return {
        "feasible_portfolio_count": feasible_count,
        "efficient_frontier": efficient_frontier,
        "quantum_rank": quantum_rank,
        "quantum_percentile": quantum_percentile,
        "quantum_on_frontier": any(
            candidate["bitstring"] == quantum_solution["bitstring"]
            for candidate in efficient_frontier
        ),
    }


def _extract_efficient_frontier(
    feasible_portfolios: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    frontier: list[dict[str, Any]] = []
    best_return = float("-inf")
    ordered = sorted(
        feasible_portfolios,
        key=lambda candidate: (
            float(candidate["variance"]),
            -float(candidate["expected_return"]),
            str(candidate["bitstring"]),
        ),
    )
    for candidate in ordered:
        expected_return = float(candidate["expected_return"])
        if expected_return > best_return + 1e-12:
            frontier.append(candidate)
            best_return = expected_return
    return frontier


def _build_solver_diagnostics(
    *,
    asset_count: int,
    budget: int,
    feasible_portfolios: list[dict[str, Any]],
    quantum_solution: dict[str, Any],
) -> dict[str, Any]:
    optimizer = quantum_solution["optimizer"]
    return {
        "allocation_model": "equal_weight_binary_selection",
        "screened_asset_count": asset_count,
        "budget": budget,
        "total_binary_states": 2**asset_count,
        "feasible_portfolio_count": len(feasible_portfolios),
        "classical_solver": {
            "strategy": "exact_enumeration",
            "evaluated_portfolios": len(feasible_portfolios),
            "compute_model": "local_in_process_exact_enumeration",
            "distributed": False,
            "budget_matched_to_quantum": False,
        },
        "quantum_solver": {
            "ansatz": "QAOA",
            "reps": quantum_solution["reps"],
            "strategy": optimizer["strategy"],
            "parameter_evaluations": optimizer["parameter_evaluations"],
            "backend": optimizer["backend"],
            "constraint_preserving": optimizer["constraint_preserving"],
            "mixer": quantum_solution["mixer_strategy"],
            "initial_state": quantum_solution["initial_state_strategy"],
            "top_seed_count": optimizer["top_seed_count"],
            "candidate_count": optimizer["candidate_count"],
            "coarse_grid_steps": optimizer["coarse_grid_steps"],
            "local_refinement_rounds": optimizer["local_refinement_rounds"],
            "local_refinement_points": optimizer["local_refinement_points"],
            "compute_model": "local_qaoa_search_plus_distributed_fragment_execution",
            "distributed": True,
        },
    }


def _qubo_to_ising(
    *,
    asset_count: int,
    linear_terms: list[float],
    pair_terms: dict[tuple[int, int], float],
    constant_term: float,
) -> tuple[SparsePauliOp, float, list[dict[str, Any]], list[dict[str, Any]]]:
    pauli_terms: list[tuple[str, float]] = []
    fields = [0.0] * asset_count
    couplings: list[dict[str, Any]] = []
    offset = constant_term

    for index, coefficient in enumerate(linear_terms):
        offset += coefficient / 2.0
        fields[index] -= coefficient / 2.0

    for (left, right), coefficient in pair_terms.items():
        offset += coefficient / 4.0
        fields[left] -= coefficient / 4.0
        fields[right] -= coefficient / 4.0
        couplings.append(
            {
                "asset_i": left,
                "asset_j": right,
                "coefficient": round(coefficient / 4.0, 12),
            }
        )
        pauli_terms.append((_two_qubit_pauli_label(asset_count, left, right), coefficient / 4.0))

    for index, coefficient in enumerate(fields):
        if abs(coefficient) > 1e-12:
            pauli_terms.append((_single_qubit_pauli_label(asset_count, index), coefficient))

    if abs(offset) > 1e-12:
        pauli_terms.append(("I" * asset_count, offset))

    return (
        SparsePauliOp.from_list(pauli_terms),
        round(offset, 12),
        [
            {
                "asset": index,
                "coefficient": round(coefficient, 12),
            }
            for index, coefficient in enumerate(fields)
            if abs(coefficient) > 1e-12
        ],
        couplings,
    )


def _solve_quantum_qaoa(
    *,
    cost_operator: SparsePauliOp,
    tickers: list[str],
    mean_returns: Any,
    covariance: Any,
    risk_aversion: float,
    budget: int,
    qaoa_reps: int,
    parameter_search_steps: int,
) -> dict[str, Any]:
    solve_started_at = time.perf_counter()
    initial_state, warm_start_mask = _build_greedy_budget_initial_state(
        tickers=tickers,
        mean_returns=mean_returns,
        covariance=covariance,
        risk_aversion=risk_aversion,
        budget=budget,
    )
    ansatz = QAOAAnsatz(
        cost_operator=cost_operator,
        reps=qaoa_reps,
        initial_state=initial_state,
        mixer_operator=_build_ring_xy_mixer(len(tickers)),
        flatten=True,
    )
    estimator = StatevectorEstimator()

    parameter_search_started_at = time.perf_counter()
    search_result = _search_qaoa_parameters(
        ansatz=ansatz,
        cost_operator=cost_operator,
        estimator=estimator,
        qaoa_reps=qaoa_reps,
        parameter_search_steps=parameter_search_steps,
    )
    parameter_search_duration_ms = int(
        (time.perf_counter() - parameter_search_started_at) * 1000
    )

    best_parameters = search_result["best_parameters"]
    beta_values = best_parameters[:qaoa_reps]
    gamma_values = best_parameters[qaoa_reps:]

    solution_extraction_started_at = time.perf_counter()
    best_circuit = _assign_qaoa_parameters(
        ansatz,
        beta_values=beta_values,
        gamma_values=gamma_values,
    )
    best_state = Statevector.from_instruction(best_circuit)
    best_energy = float(search_result["best_energy"])

    full_probabilities = {
        str(bitstring): float(probability)
        for bitstring, probability in best_state.probabilities_dict().items()
    }
    ranked_states = sorted(
        full_probabilities.items(),
        key=lambda item: item[1],
        reverse=True,
    )

    best_feasible: dict[str, Any] | None = None
    feasible_probability_mass = 0.0
    top_states: list[dict[str, Any]] = []
    for rank, (bitstring, probability) in enumerate(ranked_states, start=1):
        mask = _qiskit_bitstring_to_mask(bitstring, len(tickers))
        summary = _portfolio_summary(
            tickers=tickers,
            mask=mask,
            mean_returns=mean_returns,
            covariance=covariance,
            risk_aversion=risk_aversion,
            budget=budget,
            probability=probability,
        )
        summary["rank"] = rank
        if summary["feasible"]:
            feasible_probability_mass += probability
            if best_feasible is None:
                best_feasible = summary
        if rank <= 32:
            top_states.append(summary)

    if best_feasible is None:
        fallback_bitstring, fallback_probability = ranked_states[0]
        fallback_mask = _qiskit_bitstring_to_mask(fallback_bitstring, len(tickers))
        best_feasible = _portfolio_summary(
            tickers=tickers,
            mask=fallback_mask,
            mean_returns=mean_returns,
            covariance=covariance,
            risk_aversion=risk_aversion,
            budget=budget,
            probability=fallback_probability,
        )
        best_feasible["rank"] = 1

    solution_extraction_duration_ms = int(
        (time.perf_counter() - solution_extraction_started_at) * 1000
    )
    circuit_compile_started_at = time.perf_counter()
    measured_circuit = _prepare_measured_qaoa_circuit(best_circuit)
    circuit_qasm = _circuit_to_qasm(measured_circuit)
    circuit_compile_duration_ms = int((time.perf_counter() - circuit_compile_started_at) * 1000)
    return {
        "reps": qaoa_reps,
        "beta": round(float(beta_values[0]), 12),
        "gamma": round(float(gamma_values[0]), 12),
        "beta_parameters": [round(float(value), 12) for value in beta_values],
        "gamma_parameters": [round(float(value), 12) for value in gamma_values],
        "energy": round(best_energy, 12),
        "circuit_qasm": circuit_qasm,
        "circuit_summary": {
            "qubit_count": measured_circuit.num_qubits,
            "depth": int(measured_circuit.depth()),
            "size": int(measured_circuit.size()),
            "parameter_count": len(ansatz.parameters),
            "gate_counts": {
                str(name): int(count)
                for name, count in measured_circuit.count_ops().items()
            },
        },
        "solution": best_feasible,
        "feasible_probability_mass": round(feasible_probability_mass, 12),
        "top_states": top_states,
        "full_probabilities": full_probabilities,
        "mixer_strategy": "ring_xy_budget_preserving",
        "initial_state_strategy": "greedy_budget_basis_state",
        "warm_start_bitstring": _mask_to_qiskit_bitstring(warm_start_mask),
        "optimizer": {
            "strategy": "constraint_preserving_multistart_coordinate_search",
            "backend": "qiskit_statevector_estimator",
            "constraint_preserving": True,
            "parameter_evaluations": search_result["parameter_evaluations"],
            "candidate_count": search_result["candidate_count"],
            "top_seed_count": search_result["top_seed_count"],
            "coarse_grid_steps": parameter_search_steps,
            "local_refinement_rounds": search_result["refinement_rounds"],
            "local_refinement_points": 2,
        },
        "timings": {
            "parameter_search_duration_ms": parameter_search_duration_ms,
            "solution_extraction_duration_ms": solution_extraction_duration_ms,
            "circuit_compile_duration_ms": circuit_compile_duration_ms,
            "solve_duration_ms": int((time.perf_counter() - solve_started_at) * 1000),
        },
    }


def _assign_qaoa_parameters(
    ansatz: QAOAAnsatz,
    *,
    beta_values: np.ndarray,
    gamma_values: np.ndarray,
) -> QuantumCircuit:
    ordered_values = [float(value) for value in beta_values] + [float(value) for value in gamma_values]
    if len(ordered_values) != len(ansatz.parameters):
        raise ValueError("QAOA parameter vector does not match the ansatz parameter count.")
    parameter_map = dict(zip(ansatz.parameters, ordered_values, strict=True))
    return ansatz.assign_parameters(parameter_map, inplace=False)


def _prepare_measured_qaoa_circuit(circuit: QuantumCircuit) -> QuantumCircuit:
    measured = circuit.copy()
    measured.measure_all()
    return transpile(measured, basis_gates=["u", "cx"], optimization_level=1)


def _build_ring_xy_mixer(qubit_count: int) -> SparsePauliOp:
    pauli_terms: list[tuple[str, float]] = []
    for left in range(qubit_count):
        right = (left + 1) % qubit_count
        if left >= right:
            continue
        pauli_terms.append((_two_qubit_pauli_label_for_axis(qubit_count, left, right, "X"), 0.5))
        pauli_terms.append((_two_qubit_pauli_label_for_axis(qubit_count, left, right, "Y"), 0.5))
    return SparsePauliOp.from_list(pauli_terms)


def _build_greedy_budget_initial_state(
    *,
    tickers: list[str],
    mean_returns: Any,
    covariance: Any,
    risk_aversion: float,
    budget: int,
) -> tuple[QuantumCircuit, list[int]]:
    diagonal_risk = np.diag(np.asarray(covariance, dtype=float))
    asset_scores = np.asarray(mean_returns, dtype=float) - (risk_aversion * diagonal_risk)
    ranked_indices = np.argsort(-asset_scores, kind="stable")
    selected = {int(index) for index in ranked_indices[:budget]}
    mask = [1 if index in selected else 0 for index in range(len(tickers))]
    circuit = QuantumCircuit(len(tickers))
    for qubit_index, included in enumerate(mask):
        if included:
            circuit.x(qubit_index)
    return circuit, mask


def _search_qaoa_parameters(
    *,
    ansatz: QAOAAnsatz,
    cost_operator: SparsePauliOp,
    estimator: StatevectorEstimator,
    qaoa_reps: int,
    parameter_search_steps: int,
) -> dict[str, Any]:
    evaluation_cache: dict[tuple[float, ...], float] = {}
    candidate_count = max(parameter_search_steps * max(4, qaoa_reps * 2), 12)
    initial_candidates = _build_initial_parameter_candidates(
        qaoa_reps=qaoa_reps,
        candidate_count=candidate_count,
    )
    initial_evaluations = _evaluate_qaoa_candidates(
        ansatz=ansatz,
        cost_operator=cost_operator,
        estimator=estimator,
        candidates=initial_candidates,
        cache=evaluation_cache,
    )
    ranked_candidates = sorted(initial_evaluations, key=lambda item: item[1])
    top_seed_count = min(_QAOA_TOP_SEEDS, len(ranked_candidates))
    best_parameters = ranked_candidates[0][0].copy()
    best_energy = float(ranked_candidates[0][1])

    refinement_rounds = max(_DEFAULT_LOCAL_REFINEMENT_ROUNDS, min(parameter_search_steps, 6))
    for candidate, energy in ranked_candidates[:top_seed_count]:
        refined_parameters, refined_energy = _coordinate_refine_qaoa_candidate(
            ansatz=ansatz,
            cost_operator=cost_operator,
            estimator=estimator,
            seed_parameters=candidate,
            seed_energy=float(energy),
            qaoa_reps=qaoa_reps,
            parameter_search_steps=parameter_search_steps,
            refinement_rounds=refinement_rounds,
            cache=evaluation_cache,
        )
        if refined_energy < best_energy:
            best_parameters = refined_parameters
            best_energy = refined_energy

    return {
        "best_parameters": best_parameters,
        "best_energy": best_energy,
        "parameter_evaluations": len(evaluation_cache),
        "candidate_count": len(initial_candidates),
        "top_seed_count": top_seed_count,
        "refinement_rounds": refinement_rounds,
    }


def _build_initial_parameter_candidates(
    *,
    qaoa_reps: int,
    candidate_count: int,
) -> list[np.ndarray]:
    beta_mid = np.linspace(0.18, np.pi / 4.0, qaoa_reps)
    gamma_mid = np.linspace(0.55, np.pi / 2.0, qaoa_reps)
    deterministic_candidates = [
        np.concatenate([np.full(qaoa_reps, 0.12), np.full(qaoa_reps, 0.35)]),
        np.concatenate([beta_mid, gamma_mid]),
        np.concatenate(
            [
                np.linspace(0.1, np.pi / 3.0, qaoa_reps),
                np.linspace(0.45, np.pi * 0.8, qaoa_reps),
            ]
        ),
        np.concatenate(
            [
                np.linspace(np.pi / 3.5, 0.12, qaoa_reps),
                np.linspace(np.pi * 0.8, 0.45, qaoa_reps),
            ]
        ),
    ]
    rng = np.random.default_rng(_QAOA_RANDOM_SEED + (qaoa_reps * 1000) + candidate_count)
    lhs_points = _latin_hypercube_points(
        sample_count=max(candidate_count - len(deterministic_candidates), 4),
        dimensions=qaoa_reps * 2,
        rng=rng,
    )
    lhs_points[:, :qaoa_reps] *= np.pi / 2.0
    lhs_points[:, qaoa_reps:] *= np.pi

    unique_candidates: list[np.ndarray] = []
    seen: set[tuple[float, ...]] = set()
    for candidate in [*deterministic_candidates, *lhs_points]:
        normalized = _clip_qaoa_parameters(np.asarray(candidate, dtype=float), qaoa_reps=qaoa_reps)
        key = _parameter_cache_key(normalized)
        if key in seen:
            continue
        seen.add(key)
        unique_candidates.append(normalized)
    return unique_candidates


def _coordinate_refine_qaoa_candidate(
    *,
    ansatz: QAOAAnsatz,
    cost_operator: SparsePauliOp,
    estimator: StatevectorEstimator,
    seed_parameters: np.ndarray,
    seed_energy: float,
    qaoa_reps: int,
    parameter_search_steps: int,
    refinement_rounds: int,
    cache: dict[tuple[float, ...], float],
) -> tuple[np.ndarray, float]:
    current_parameters = seed_parameters.copy()
    current_energy = seed_energy
    beta_step = max((np.pi / 2.0) / max(parameter_search_steps, 3), 0.08)
    gamma_step = max(np.pi / max(parameter_search_steps, 3), 0.12)
    dimension = qaoa_reps * 2

    for _ in range(refinement_rounds):
        proposals: list[np.ndarray] = []
        for parameter_index in range(dimension):
            step = beta_step if parameter_index < qaoa_reps else gamma_step
            for direction in (-1.0, 1.0):
                proposal = current_parameters.copy()
                proposal[parameter_index] += direction * step
                proposals.append(_clip_qaoa_parameters(proposal, qaoa_reps=qaoa_reps))

        evaluated = _evaluate_qaoa_candidates(
            ansatz=ansatz,
            cost_operator=cost_operator,
            estimator=estimator,
            candidates=proposals,
            cache=cache,
        )
        best_proposal, best_proposal_energy = min(evaluated, key=lambda item: item[1])
        if best_proposal_energy + 1e-12 < current_energy:
            current_parameters = best_proposal.copy()
            current_energy = float(best_proposal_energy)
        beta_step = max(beta_step / 2.0, 0.01)
        gamma_step = max(gamma_step / 2.0, 0.02)

    return current_parameters, current_energy


def _evaluate_qaoa_candidates(
    *,
    ansatz: QAOAAnsatz,
    cost_operator: SparsePauliOp,
    estimator: StatevectorEstimator,
    candidates: list[np.ndarray],
    cache: dict[tuple[float, ...], float],
) -> list[tuple[np.ndarray, float]]:
    pending_candidates: list[np.ndarray] = []
    pending_keys: list[tuple[float, ...]] = []
    for candidate in candidates:
        key = _parameter_cache_key(candidate)
        if key in cache:
            continue
        pending_candidates.append(candidate)
        pending_keys.append(key)

    if pending_candidates:
        parameter_values = np.asarray(pending_candidates, dtype=float)
        job = estimator.run([(ansatz, cost_operator, parameter_values)])
        energies = np.atleast_1d(np.asarray(job.result()[0].data.evs, dtype=float))
        for key, energy in zip(pending_keys, energies, strict=True):
            cache[key] = float(energy)

    return [(candidate, cache[_parameter_cache_key(candidate)]) for candidate in candidates]


def _latin_hypercube_points(
    *,
    sample_count: int,
    dimensions: int,
    rng: np.random.Generator,
) -> np.ndarray:
    samples = np.zeros((sample_count, dimensions), dtype=float)
    for dimension in range(dimensions):
        permutation = rng.permutation(sample_count)
        samples[:, dimension] = (permutation + 0.5) / sample_count
    return samples


def _clip_qaoa_parameters(values: np.ndarray, *, qaoa_reps: int) -> np.ndarray:
    clipped = values.copy()
    clipped[:qaoa_reps] = np.clip(clipped[:qaoa_reps], 0.0, np.pi / 2.0)
    clipped[qaoa_reps:] = np.clip(clipped[qaoa_reps:], 0.0, np.pi)
    return clipped


def _parameter_cache_key(values: np.ndarray) -> tuple[float, ...]:
    return tuple(round(float(value), 12) for value in values)


def _circuit_to_qasm(circuit: QuantumCircuit) -> str:
    qasm_text = qasm2.dumps(circuit)
    cleaned_lines = [
        line
        for line in qasm_text.splitlines()
        if not line.strip().lower().startswith("barrier ")
    ]
    return "\n".join(cleaned_lines)


def _portfolio_summary(
    *,
    tickers: list[str],
    mask: list[int],
    mean_returns: Any,
    covariance: Any,
    risk_aversion: float,
    budget: int,
    probability: float | None,
) -> dict[str, Any]:
    selection = np.array(mask, dtype=float)
    expected_return = float(np.dot(mean_returns, selection))
    variance = float(selection.T @ covariance @ selection)
    volatility = math.sqrt(max(variance, 0.0))
    objective = expected_return - (risk_aversion * variance)
    bitstring = _mask_to_qiskit_bitstring(mask)
    selected_assets = [
        ticker
        for ticker, bit in zip(tickers, mask)
        if bit == 1
    ]
    selected_count = sum(mask)
    feasible = selected_count == budget
    return {
        "bitstring": bitstring,
        "selected_assets": selected_assets,
        "selected_asset_count": selected_count,
        "feasible": feasible,
        "budget_gap": selected_count - budget,
        "objective": round(objective, 12),
        "expected_return": round(expected_return, 12),
        "variance": round(variance, 12),
        "volatility": round(volatility, 12),
        "probability": round(probability, 12) if probability is not None else None,
    }


def _build_asset_universe_summary(
    *,
    tickers: list[str],
    aligned_returns: Any,
    annualization_factor: int,
    classical_selected: set[str],
    quantum_selected: set[str],
    selection_probabilities: dict[str, float],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for column_index, ticker in enumerate(tickers):
        returns = aligned_returns[:, column_index]
        mean_return = float(np.mean(returns))
        variance = float(np.var(returns, ddof=1))
        annualized_return = mean_return * annualization_factor
        annualized_variance = variance * annualization_factor
        annualized_volatility = math.sqrt(max(annualized_variance, 0.0))
        sharpe_like = (
            annualized_return / annualized_volatility
            if annualized_volatility > 0
            else annualized_return
        )
        rows.append(
            {
                "ticker": ticker,
                "periods": int(len(returns)),
                "mean_return": round(mean_return, 12),
                "annualized_return": round(annualized_return, 12),
                "annualized_variance": round(annualized_variance, 12),
                "annualized_volatility": round(annualized_volatility, 12),
                "sharpe_like": round(sharpe_like, 12),
                "selected_classical": ticker in classical_selected,
                "selected_quantum": ticker in quantum_selected,
                "selection_probability": round(selection_probabilities.get(ticker, 0.0), 12),
            }
        )
    return rows


def _per_asset_selection_probability(
    *,
    tickers: list[str],
    full_probabilities: dict[str, float],
) -> dict[str, float]:
    probabilities = {ticker: 0.0 for ticker in tickers}
    for bitstring, probability in full_probabilities.items():
        mask = _qiskit_bitstring_to_mask(bitstring, len(tickers))
        for ticker, bit in zip(tickers, mask):
            if bit == 1:
                probabilities[ticker] = probabilities.get(ticker, 0.0) + probability
    return probabilities


def _build_comparison_summary(
    *,
    classical_solution: dict[str, Any],
    quantum_solution: dict[str, Any],
    feasible_probability_mass: float,
    optimum_probability: float | None,
    objective_label: str,
) -> dict[str, Any]:
    classical_assets = set(classical_solution["selected_assets"])
    quantum_assets = set(quantum_solution["selected_assets"])
    overlap_count = len(classical_assets & quantum_assets)
    overlap_ratio = overlap_count / max(1, len(classical_assets | quantum_assets))
    classical_objective = float(classical_solution["objective"])
    quantum_objective = float(quantum_solution["objective"])
    objective_ratio = (
        round(quantum_objective / classical_objective, 12)
        if abs(classical_objective) > 1e-12
        else None
    )
    return {
        "objective_label": objective_label,
        "comparison": {
            "objective_gap": round(quantum_objective - classical_objective, 12),
            "objective_ratio": objective_ratio,
            "return_gap": round(
                float(quantum_solution["expected_return"]) - float(classical_solution["expected_return"]),
                12,
            ),
            "variance_gap": round(
                float(quantum_solution["variance"]) - float(classical_solution["variance"]),
                12,
            ),
            "overlap_count": overlap_count,
            "overlap_ratio": round(overlap_ratio, 12),
            "feasible_probability_mass": round(feasible_probability_mass, 12),
            "optimum_probability": round(optimum_probability, 12) if optimum_probability is not None else None,
            "quantum_advantage_detected": quantum_objective > classical_objective,
        },
    }


def _build_dataset_warnings(
    *,
    raw_asset_count: int,
    selected_assets: list[CandidateAsset],
    aligned_dates: list[date],
    input_layout: str,
    value_mode: str,
    dropped_records: int,
    dataset_semantics: DatasetSemanticsSummary,
) -> list[str]:
    warnings: list[str] = []
    if raw_asset_count > len(selected_assets):
        warnings.append(
            f"Screened {raw_asset_count} assets down to {len(selected_assets)} for the quantum solve."
        )
    if len(aligned_dates) < 12:
        warnings.append(
            f"Only {len(aligned_dates)} aligned periods were available across the screened assets."
        )
    if dropped_records > 0:
        warnings.append(f"Ignored {dropped_records} malformed or unusable records during ingestion.")
    warnings.append(f"Detected {input_layout} dataset layout with {value_mode} semantics.")
    if dataset_semantics.benchmark_readiness == "workflow_only":
        warnings.append(
            "Uploaded columns look like derived company metrics rather than tradable securities. "
            "Treat this run as workflow evidence, not as a professional portfolio benchmark."
        )
    elif dataset_semantics.benchmark_readiness == "review_required":
        warnings.append(
            "Asset column semantics are ambiguous. Verify that uploaded columns represent tradable securities "
            "before using this run in any investor-facing comparison."
        )
    return warnings


def _summarize_dataset_semantics(
    *,
    input_layout: str,
    ticker_column: str | None,
    source_asset_headers: list[str],
) -> DatasetSemanticsSummary:
    asset_headers = [header for header in source_asset_headers if header]
    if input_layout == "long" and ticker_column is not None:
        return DatasetSemanticsSummary(
            asset_identifier_mode="ticker_column",
            asset_semantics="tradable_security_series",
            benchmark_readiness="market_comparable",
            market_comparable=True,
            semantic_notes=(
                "Long-format input uses an explicit ticker column, so the asset universe is treated as tradable securities.",
            ),
        )

    metric_like_count = sum(1 for header in asset_headers if _header_looks_metric_like(header))
    ticker_like_count = sum(1 for header in asset_headers if _header_looks_ticker_like(header))
    majority_threshold = max(2, math.ceil(len(asset_headers) / 2))

    if metric_like_count >= majority_threshold and metric_like_count > ticker_like_count:
        return DatasetSemanticsSummary(
            asset_identifier_mode="derived_metric_columns",
            asset_semantics="derived_company_metric_series",
            benchmark_readiness="workflow_only",
            market_comparable=False,
            semantic_notes=(
                "Wide-format numeric columns look like accounting or KPI metrics instead of tradable securities.",
                "This dataset shape is suitable for workflow validation, but not for a genuine market benchmark.",
            ),
        )
    if ticker_like_count >= majority_threshold:
        return DatasetSemanticsSummary(
            asset_identifier_mode="header_ticker_symbols",
            asset_semantics="tradable_security_series",
            benchmark_readiness="market_comparable",
            market_comparable=True,
            semantic_notes=(
                "Wide-format numeric columns look like ticker symbols, so the dataset is treated as a tradable market universe.",
            ),
        )
    return DatasetSemanticsSummary(
        asset_identifier_mode="ambiguous_columns",
        asset_semantics="review_required",
        benchmark_readiness="review_required",
        market_comparable=False,
        semantic_notes=(
            "Column names do not clearly identify either ticker symbols or derived financial metrics.",
            "Review the uploaded headers before using this result as an external benchmark.",
        ),
    )


def _header_looks_ticker_like(value: str) -> bool:
    normalized = value.strip().upper()
    if not normalized:
        return False
    if _header_looks_metric_like(normalized):
        return False
    return _MARKET_TICKER_PATTERN.fullmatch(normalized) is not None


def _header_looks_metric_like(value: str) -> bool:
    normalized = _normalize_header(value)
    if not normalized:
        return False
    if normalized.endswith(("_usd", "_pct", "_margin", "_ratio")):
        return True
    return any(keyword in normalized for keyword in _METRIC_COLUMN_KEYWORDS)


def _single_qubit_pauli_label(qubit_count: int, qubit_index: int) -> str:
    labels = ["I"] * qubit_count
    labels[qubit_count - 1 - qubit_index] = "Z"
    return "".join(labels)


def _two_qubit_pauli_label(qubit_count: int, left: int, right: int) -> str:
    labels = ["I"] * qubit_count
    labels[qubit_count - 1 - left] = "Z"
    labels[qubit_count - 1 - right] = "Z"
    return "".join(labels)


def _two_qubit_pauli_label_for_axis(
    qubit_count: int,
    left: int,
    right: int,
    axis: str,
) -> str:
    labels = ["I"] * qubit_count
    labels[qubit_count - 1 - left] = axis
    labels[qubit_count - 1 - right] = axis
    return "".join(labels)


def _mask_to_qiskit_bitstring(mask: list[int]) -> str:
    return "".join(str(bit) for bit in reversed(mask))


def _qiskit_bitstring_to_mask(bitstring: str, asset_count: int) -> list[int]:
    normalized = bitstring.zfill(asset_count)
    return [int(bit) for bit in reversed(normalized)]


def _normalize_header(value: str) -> str:
    return "".join(character for character in value.lower().strip() if character.isalnum() or character == "_")


def _parse_number(value: str | None) -> float | None:
    if value is None:
        return None
    normalized = value.replace(",", "").replace("$", "").replace("%", "").strip()
    if not normalized:
        return None
    try:
        return float(normalized)
    except ValueError:
        return None


def _parse_date(value: str | None) -> date | None:
    if value is None:
        return None
    text = value.strip()
    if not text:
        return None

    for parser in (
        _try_fromisoformat,
        *_DATE_FORMATS,
    ):
        if isinstance(parser, str):
            try:
                return datetime.strptime(text, parser).date()
            except ValueError:
                continue
        parsed = parser(text)
        if parsed is not None:
            return parsed
    return None


def _try_fromisoformat(value: str) -> date | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None
