"""Benchmark quantum portfolio optimization at different node scales (5, 10, 20).

This script runs the COMPLETE workflow (including advanced L-BFGS-B optimizer)
to establish current performance baseline before Phase 2 optimizations.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from pathlib import Path

from run_track_b_market_benchmark import _run_distributed_benchmark


def main() -> None:
    logging.getLogger("qiskit").setLevel(logging.WARNING)

    # Use existing CSV dataset
    csv_path = Path(__file__).resolve().parents[2] / "benchmark-data" / "diversified_20_asset_2y.csv"
    csv_bytes = csv_path.read_bytes()

    node_counts = [5, 10, 20]
    results = {}

    print(f"\n{'='*90}")
    print("QUANTUM NODE SCALING BENCHMARK - CURRENT OPTIMIZATIONS (L-BFGS-B + Transfer Learning)")
    print(f"{'='*90}")
    print(f"Dataset: {csv_path.name}")
    print(f"Max assets: 10")
    print(f"Optimizer: L-BFGS-B with transfer learning cache")
    print(f"Parameter search steps: 5")
    print(f"{'='*90}\n")

    for node_count in node_counts:
        print(f"\n{'─'*90}")
        print(f"🚀 RUNNING BENCHMARK: {node_count} nodes")
        print(f"{'─'*90}")

        start_time = time.time()
        benchmark = asyncio.run(
            _run_distributed_benchmark(
                csv_bytes=csv_bytes,
                filename=csv_path.name,
                peer_count=node_count,
                max_assets_considered=10,
                parameter_search_steps=5,
                budget=None,
            )
        )
        elapsed_time = time.time() - start_time

        timings = benchmark.get("timings", {})
        scorecard = benchmark.get("comparison_report", {}).get("scorecard", {})

        results[f"{node_count}_nodes"] = {
            "node_count": node_count,
            "total_benchmark_time_seconds": round(elapsed_time, 3),
            "classical_end_to_end_ms": timings.get("classical_end_to_end_duration_ms", 0),
            "quantum_local_end_to_end_ms": timings.get("quantum_local_end_to_end_duration_ms", 0),
            "quantum_distributed_end_to_end_ms": timings.get("quantum_end_to_end_duration_ms", 0),
            "quantum_parameter_search_ms": timings.get("quantum_parameter_search_duration_ms", 0),
            "quantum_solution_extraction_ms": timings.get("quantum_solution_extraction_duration_ms", 0),
            "quantum_circuit_compile_ms": timings.get("quantum_circuit_compile_duration_ms", 0),
            "service_wait_ms": timings.get("service_wait_duration_ms", 0),
            "plan_compile_ms": timings.get("plan_compile_duration_ms", 0),
            "distributed_execution_ms": timings.get("distributed_execution_duration_ms", 0),
            "fragments_executed": benchmark.get("fragments_executed", 0),
            "distributed_nodes_used": benchmark.get("distributed_nodes_used", 0),
            "winner_by_objective": scorecard.get("winner_by_objective", "unknown"),
            "winner_by_runtime": scorecard.get("winner_by_runtime", "unknown"),
            "objective_gap": scorecard.get("objective_gap", 0),
            "quantum_advantage_detected": scorecard.get("quantum_advantage_detected", False),
        }

        print(f"\n✅ COMPLETED in {elapsed_time:.2f}s")
        print(f"   Classical E2E: {timings.get('classical_end_to_end_duration_ms', 0)}ms")
        print(f"   Quantum Local E2E: {timings.get('quantum_local_end_to_end_duration_ms', 0)}ms")
        print(f"   Quantum Distributed E2E: {timings.get('quantum_end_to_end_duration_ms', 0)}ms")
        print(f"   Parameter Search: {timings.get('quantum_parameter_search_duration_ms', 0)}ms")
        print(f"   Fragments: {benchmark.get('fragments_executed', 0)} across {benchmark.get('distributed_nodes_used', 0)} nodes")
        print(f"   Winner: {scorecard.get('winner_by_runtime', 'unknown')}")

    # Detailed comparison
    print(f"\n{'='*90}")
    print("DETAILED PERFORMANCE BREAKDOWN")
    print(f"{'='*90}\n")

    print(f"{'Metric':<45} {'5 nodes':<15} {'10 nodes':<15} {'20 nodes':<15}")
    print(f"{'-'*90}")

    metrics = [
        ("Total Benchmark Time (s)", "total_benchmark_time_seconds"),
        ("Classical E2E (ms)", "classical_end_to_end_ms"),
        ("Quantum Local E2E (ms)", "quantum_local_end_to_end_ms"),
        ("Quantum Distributed E2E (ms)", "quantum_distributed_end_to_end_ms"),
        ("  ├─ Parameter Search (ms)", "quantum_parameter_search_ms"),
        ("  ├─ Solution Extraction (ms)", "quantum_solution_extraction_ms"),
        ("  ├─ Circuit Compile (ms)", "quantum_circuit_compile_ms"),
        ("  ├─ Service Wait (ms)", "service_wait_ms"),
        ("  ├─ Plan Compile (ms)", "plan_compile_ms"),
        ("  └─ Distributed Execution (ms)", "distributed_execution_ms"),
        ("Fragments Executed", "fragments_executed"),
        ("Nodes Used", "distributed_nodes_used"),
    ]

    for label, key in metrics:
        values = [results[f"{n}_nodes"][key] for n in node_counts]
        print(f"{label:<45} {values[0]:<15} {values[1]:<15} {values[2]:<15}")

    # Speedup analysis
    print(f"\n{'─'*90}")
    print("SPEEDUP ANALYSIS (vs 5 nodes)")
    print(f"{'─'*90}\n")

    baseline_quantum = results["5_nodes"]["quantum_distributed_end_to_end_ms"]
    for node_count in [10, 20]:
        current_quantum = results[f"{node_count}_nodes"]["quantum_distributed_end_to_end_ms"]
        speedup = baseline_quantum / current_quantum if current_quantum > 0 else 0
        print(f"{node_count} nodes vs 5 nodes: {speedup:.3f}x speedup")

    # Classical vs Quantum gap
    print(f"\n{'─'*90}")
    print("CLASSICAL vs QUANTUM GAP")
    print(f"{'─'*90}\n")

    for node_count in node_counts:
        classical_ms = results[f"{node_count}_nodes"]["classical_end_to_end_ms"]
        quantum_ms = results[f"{node_count}_nodes"]["quantum_distributed_end_to_end_ms"]
        gap = quantum_ms / classical_ms if classical_ms > 0 else 0
        print(f"{node_count} nodes: Classical {classical_ms}ms vs Quantum {quantum_ms}ms → {gap:.1f}x slower")

    # Parameter search dominance
    print(f"\n{'─'*90}")
    print("PARAMETER SEARCH DOMINANCE (Bottleneck Analysis)")
    print(f"{'─'*90}\n")

    for node_count in node_counts:
        param_ms = results[f"{node_count}_nodes"]["quantum_parameter_search_ms"]
        total_ms = results[f"{node_count}_nodes"]["quantum_local_end_to_end_ms"]
        percentage = (param_ms / total_ms * 100) if total_ms > 0 else 0
        print(f"{node_count} nodes: Parameter search = {param_ms}ms / {total_ms}ms ({percentage:.1f}% of quantum runtime)")

    # Save results
    output_path = Path(__file__).resolve().parent / "node_scaling_current_baseline.json"
    output_path.write_text(json.dumps(results, indent=2))
    print(f"\n📁 Full results saved to: {output_path}")
    print(f"\n{'='*90}\n")


if __name__ == "__main__":
    main()
