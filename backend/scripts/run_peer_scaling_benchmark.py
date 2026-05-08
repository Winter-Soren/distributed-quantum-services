"""Run portfolio optimization benchmarks at different peer scales to analyze distributed performance."""

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

    peer_counts = [5, 50, 100]
    results = {}

    print(f"\n{'='*80}")
    print("QUANTUM PEER SCALING BENCHMARK")
    print(f"{'='*80}")
    print(f"Dataset: {csv_path.name}")
    print(f"Max assets: 10 (to test distributed execution)")
    print(f"Parameter search steps: 5 (optimized)")
    print(f"{'='*80}\n")

    for peer_count in peer_counts:
        print(f"\n{'─'*80}")
        print(f"🚀 RUNNING BENCHMARK: {peer_count} peers")
        print(f"{'─'*80}")

        start_time = time.time()
        benchmark = asyncio.run(
            _run_distributed_benchmark(
                csv_bytes=csv_bytes,
                filename=csv_path.name,
                peer_count=peer_count,
                max_assets_considered=10,
                parameter_search_steps=5,
                budget=None,
            )
        )
        elapsed_time = time.time() - start_time

        timings = benchmark.get("timings", {})

        results[f"{peer_count}_peers"] = {
            "peer_count": peer_count,
            "total_benchmark_time_seconds": round(elapsed_time, 3),
            "classical_end_to_end_ms": timings.get("classical_end_to_end_duration_ms", 0),
            "quantum_local_end_to_end_ms": timings.get("quantum_local_end_to_end_duration_ms", 0),
            "quantum_distributed_end_to_end_ms": timings.get("quantum_end_to_end_duration_ms", 0),
            "service_wait_ms": timings.get("service_wait_duration_ms", 0),
            "plan_compile_ms": timings.get("plan_compile_duration_ms", 0),
            "distributed_execution_ms": timings.get("distributed_execution_duration_ms", 0),
            "fragments_executed": benchmark.get("fragments_executed", 0),
            "distributed_nodes_used": benchmark.get("distributed_nodes_used", 0),
            "scorecard": benchmark.get("comparison_report", {}).get("scorecard", {}),
        }

        print(f"\n✅ COMPLETED in {elapsed_time:.2f}s")
        print(f"   Classical: {timings.get('classical_end_to_end_duration_ms', 0)}ms")
        print(f"   Quantum (local): {timings.get('quantum_local_end_to_end_duration_ms', 0)}ms")
        print(f"   Quantum (distributed): {timings.get('quantum_end_to_end_duration_ms', 0)}ms")
        print(f"   Fragments: {benchmark.get('fragments_executed', 0)} across {benchmark.get('distributed_nodes_used', 0)} nodes")

    # Summary comparison
    print(f"\n{'='*80}")
    print("COMPARATIVE ANALYSIS")
    print(f"{'='*80}\n")

    print(f"{'Metric':<40} {'5 peers':<15} {'50 peers':<15} {'100 peers':<15}")
    print(f"{'-'*80}")

    metrics = [
        ("Total Runtime (s)", "total_benchmark_time_seconds"),
        ("Classical E2E (ms)", "classical_end_to_end_ms"),
        ("Quantum Local E2E (ms)", "quantum_local_end_to_end_ms"),
        ("Quantum Distributed E2E (ms)", "quantum_distributed_end_to_end_ms"),
        ("Service Wait (ms)", "service_wait_ms"),
        ("Plan Compile (ms)", "plan_compile_ms"),
        ("Distributed Exec (ms)", "distributed_execution_ms"),
        ("Fragments Executed", "fragments_executed"),
        ("Nodes Used", "distributed_nodes_used"),
    ]

    for label, key in metrics:
        values = [results[f"{p}_peers"][key] for p in peer_counts]
        print(f"{label:<40} {values[0]:<15} {values[1]:<15} {values[2]:<15}")

    # Speedup analysis
    print(f"\n{'─'*80}")
    print("SPEEDUP ANALYSIS")
    print(f"{'─'*80}\n")

    baseline_quantum = results["5_peers"]["quantum_distributed_end_to_end_ms"]
    for peer_count in [50, 100]:
        current_quantum = results[f"{peer_count}_peers"]["quantum_distributed_end_to_end_ms"]
        speedup = baseline_quantum / current_quantum if current_quantum > 0 else 0
        print(f"{peer_count} peers vs 5 peers: {speedup:.2f}x speedup")

    # Save results
    output_path = Path(__file__).resolve().parent / "peer_scaling_results.json"
    output_path.write_text(json.dumps(results, indent=2))
    print(f"\n📁 Full results saved to: {output_path}")
    print(f"\n{'='*80}\n")


if __name__ == "__main__":
    main()
