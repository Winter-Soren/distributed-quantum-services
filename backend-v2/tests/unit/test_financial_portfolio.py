"""Unit tests for the Track B portfolio optimization workflow."""

from __future__ import annotations

from quantum_backend_v2.application.financial_portfolio import (
    PortfolioOptimizationConfig,
    build_portfolio_optimization_artifacts,
)


def _wide_prices_csv() -> bytes:
    return (
        b"date,AAPL,MSFT,NVDA,IBM\n"
        b"2025-01-01,100,200,150,90\n"
        b"2025-01-02,102,201,153,91\n"
        b"2025-01-03,101,205,157,92\n"
        b"2025-01-04,104,208,160,91\n"
        b"2025-01-05,106,210,166,93\n"
        b"2025-01-06,108,214,170,94\n"
    )


def _long_returns_csv() -> bytes:
    return (
        b"date,ticker,return\n"
        b"2025-01-01,AAPL,0.010\n"
        b"2025-01-01,MSFT,0.004\n"
        b"2025-01-01,NVDA,0.015\n"
        b"2025-01-01,IBM,0.002\n"
        b"2025-01-02,AAPL,-0.002\n"
        b"2025-01-02,MSFT,0.003\n"
        b"2025-01-02,NVDA,0.011\n"
        b"2025-01-02,IBM,0.001\n"
        b"2025-01-03,AAPL,0.006\n"
        b"2025-01-03,MSFT,0.005\n"
        b"2025-01-03,NVDA,-0.004\n"
        b"2025-01-03,IBM,0.002\n"
        b"2025-01-04,AAPL,0.003\n"
        b"2025-01-04,MSFT,-0.001\n"
        b"2025-01-04,NVDA,0.009\n"
        b"2025-01-04,IBM,0.001\n"
        b"2025-01-05,AAPL,0.004\n"
        b"2025-01-05,MSFT,0.006\n"
        b"2025-01-05,NVDA,0.013\n"
        b"2025-01-05,IBM,0.002\n"
    )


def test_build_portfolio_artifacts_from_wide_prices() -> None:
    artifacts = build_portfolio_optimization_artifacts(
        csv_bytes=_wide_prices_csv(),
        job_id="fin-test-wide",
        filename="wide-prices.csv",
        config=PortfolioOptimizationConfig(
            max_assets_considered=4,
            parameter_search_steps=3,
        ),
    )

    payload = artifacts.payload

    assert payload["problem_type"] == "portfolio_optimization"
    assert payload["dataset"]["input_layout"] == "wide"
    assert payload["dataset"]["asset_count"] == 4
    assert payload["request"]["resolved_value_mode"] == "prices"
    assert payload["benchmark"]["classical"]["selected_asset_count"] == payload["request"]["budget"]
    assert payload["benchmark"]["quantum"]["selected_asset_count"] == payload["request"]["budget"]
    assert payload["benchmark"]["allocation_model"] == "equal_weight_binary_selection"
    assert payload["benchmark"]["frontier"]["feasible_portfolio_count"] >= 1
    assert payload["benchmark"]["frontier"]["efficient_frontier"]
    assert payload["quantum_execution"]["circuit_text"].startswith("OPENQASM 2.0")
    assert payload["quantum_execution"]["encoded_assets"] == payload["dataset"]["selected_tickers"]
    assert payload["quantum_execution"]["top_states"]
    assert payload["solver_diagnostics"]["classical_solver"]["strategy"] == "exact_enumeration"
    assert (
        payload["solver_diagnostics"]["quantum_solver"]["strategy"]
        == "constraint_preserving_multistart_coordinate_search"
    )
    assert payload["solver_diagnostics"]["quantum_solver"]["constraint_preserving"] is True
    assert payload["solver_diagnostics"]["quantum_solver"]["parameter_evaluations"] >= 9
    assert payload["quantum_execution"]["qaoa_parameters"]["mixer_strategy"] == "ring_xy_budget_preserving"
    assert payload["benchmark"]["timings"]["shared_preparation_duration_ms"] >= 0
    assert payload["benchmark"]["timings"]["quantum_parameter_search_duration_ms"] >= 0
    assert artifacts.circuit_qasm == payload["quantum_execution"]["circuit_text"]
    assert payload["warnings"]


def test_build_portfolio_artifacts_from_long_returns() -> None:
    artifacts = build_portfolio_optimization_artifacts(
        csv_bytes=_long_returns_csv(),
        job_id="fin-test-long",
        filename="long-returns.csv",
        config=PortfolioOptimizationConfig(
            budget=2,
            max_assets_considered=4,
            value_mode="returns",
            date_column="date",
            ticker_column="ticker",
            value_column="return",
            qaoa_reps=2,
            parameter_search_steps=3,
        ),
    )

    payload = artifacts.payload

    assert payload["dataset"]["input_layout"] == "long"
    assert payload["request"]["budget"] == 2
    assert payload["request"]["qaoa_reps"] == 2
    assert payload["request"]["resolved_value_mode"] == "returns"
    assert set(payload["dataset"]["selected_tickers"]).issubset({"AAPL", "MSFT", "NVDA", "IBM"})
    assert payload["benchmark"]["comparison"]["feasible_probability_mass"] > 0.99
    assert payload["benchmark"]["frontier"]["quantum_rank"] is not None
    assert payload["benchmark"]["frontier"]["quantum_percentile"] is not None
    assert payload["quantum_execution"]["qaoa_parameters"]["parameter_search_steps"] == 3
    assert len(payload["quantum_execution"]["qaoa_parameters"]["beta_parameters"]) == 2
    assert len(payload["quantum_execution"]["qaoa_parameters"]["gamma_parameters"]) == 2
