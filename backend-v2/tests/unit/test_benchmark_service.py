"""Unit tests for the benchmark framework and comparison logic."""

from __future__ import annotations

import pytest

from quantum_backend_v2.workflows.benchmark import (
    BenchmarkMetrics,
    BenchmarkRun,
    BenchmarkRunService,
    BenchmarkRunStatus,
)


class TestBenchmarkRunService:
    def _service(self) -> BenchmarkRunService:
        return BenchmarkRunService()

    def test_create_benchmark(self) -> None:
        svc = self._service()
        run = svc.create(
            benchmark_family="portfolio_optimization",
            quantum_service_id="svc-qaoa",
            classical_service_id="svc-classical-markowitz",
        )
        assert run.benchmark_family == "portfolio_optimization"
        assert run.status == BenchmarkRunStatus.SUBMITTED
        assert run.quantum_service_id == "svc-qaoa"
        assert run.classical_service_id == "svc-classical-markowitz"
        assert len(run.benchmark_id) == 32

    def test_create_quantum_only(self) -> None:
        svc = self._service()
        run = svc.create(
            benchmark_family="vqe_chemistry",
            quantum_service_id="svc-vqe",
        )
        assert run.classical_service_id is None

    def test_record_quantum_result(self) -> None:
        svc = self._service()
        run = svc.create(
            benchmark_family="qrng", quantum_service_id="svc-qrng"
        )
        metrics = BenchmarkMetrics(latency_ms=45.2, fidelity_score=0.99, shots=1024)
        updated = svc.record_quantum_result(run, metrics, peer_id="peer-q")
        assert updated.quantum_metrics is not None
        assert updated.quantum_metrics.fidelity_score == pytest.approx(0.99)
        assert updated.quantum_peer_id == "peer-q"

    def test_record_both_results_and_finalize(self) -> None:
        svc = self._service()
        run = svc.create(
            benchmark_family="portfolio_optimization",
            quantum_service_id="svc-qaoa",
            classical_service_id="svc-markowitz",
        )
        q_metrics = BenchmarkMetrics(latency_ms=80.0, fidelity_score=0.97, output_quality_score=0.88)
        c_metrics = BenchmarkMetrics(latency_ms=200.0, fidelity_score=None, output_quality_score=0.82)

        run = svc.record_quantum_result(run, q_metrics)
        run = svc.record_classical_result(run, c_metrics)
        run = svc.finalize(run)

        assert run.status == BenchmarkRunStatus.COMPLETED
        assert run.completed_at is not None
        assert "latency_speedup_factor" in run.comparison_summary
        assert run.comparison_summary["quantum_advantage"] is True

    def test_latency_speedup_factor(self) -> None:
        svc = self._service()
        run = svc.create(
            benchmark_family="test", quantum_service_id="svc-q", classical_service_id="svc-c"
        )
        q_metrics = BenchmarkMetrics(latency_ms=100.0)
        c_metrics = BenchmarkMetrics(latency_ms=400.0)
        run = svc.record_quantum_result(run, q_metrics)
        run = svc.record_classical_result(run, c_metrics)
        run = svc.finalize(run)

        speedup = run.comparison_summary["latency_speedup_factor"]
        assert speedup == pytest.approx(4.0)

    def test_incomplete_comparison_returns_incomplete(self) -> None:
        svc = self._service()
        run = svc.create(
            benchmark_family="test", quantum_service_id="svc-q", classical_service_id="svc-c"
        )
        comparison = run.compute_comparison()
        assert comparison["status"] == "incomplete"


class TestBenchmarkMetrics:
    def test_default_metrics(self) -> None:
        m = BenchmarkMetrics()
        assert m.latency_ms is None
        assert m.fidelity_score is None
        assert m.custom_metrics == {}

    def test_custom_metrics(self) -> None:
        m = BenchmarkMetrics(custom_metrics={"entropy": 3.14})
        assert m.custom_metrics["entropy"] == pytest.approx(3.14)
