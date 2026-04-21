"""Tests for lightweight financial summary payload generation."""

from __future__ import annotations

from quantum_backend_v2.application.parity import _build_financial_summary_payload


def test_build_financial_summary_payload_drops_heavy_quantum_fields_without_mutating_source() -> None:
    payload: dict[str, object] = {
        "asset_universe": [{"ticker": "AAPL"}],
        "benchmark": {"frontier": {"efficient_frontier": [{"bitstring": "01"}]}},
        "quantum_execution": {
            "plan": {"plan_id": "plan-1"},
            "fragment_results": [{"fragment_id": "frag-1"}],
            "quantum_result": {
                "counts": {"01": 128},
                "probabilities": {"01": 1.0},
                "statevector": ["1+0j", "0+0j"],
                "reduced_density_matrices": {"0": [["1.0"]]},
                "shots": 128,
            },
        },
    }

    summary = _build_financial_summary_payload(payload)

    assert summary is not payload
    assert summary["asset_universe"] is payload["asset_universe"]
    assert summary["benchmark"] is payload["benchmark"]

    original_quantum_execution = payload["quantum_execution"]
    assert isinstance(original_quantum_execution, dict)
    summary_quantum_execution = summary["quantum_execution"]
    assert isinstance(summary_quantum_execution, dict)
    assert summary_quantum_execution is not original_quantum_execution
    assert summary_quantum_execution["plan"] is original_quantum_execution["plan"]
    assert summary_quantum_execution["fragment_results"] is original_quantum_execution["fragment_results"]

    original_quantum_result = original_quantum_execution["quantum_result"]
    assert isinstance(original_quantum_result, dict)
    summary_quantum_result = summary_quantum_execution["quantum_result"]
    assert isinstance(summary_quantum_result, dict)
    assert summary_quantum_result is not original_quantum_result
    assert summary_quantum_result["counts"] is original_quantum_result["counts"]
    assert summary_quantum_result["shots"] == 128
    assert summary_quantum_result["probabilities"] is None
    assert summary_quantum_result["statevector"] is None
    assert summary_quantum_result["reduced_density_matrices"] is None

    assert original_quantum_result["probabilities"] == {"01": 1.0}
    assert original_quantum_result["statevector"] == ["1+0j", "0+0j"]
    assert original_quantum_result["reduced_density_matrices"] == {"0": [["1.0"]]}
