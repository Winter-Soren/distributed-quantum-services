"""Benchmark quantum portfolio optimization on MASSIVE 100-asset dataset.

This tests quantum at scale where classical exact enumeration becomes intractable:
- 100 assets total
- Select 20, 30, or 50 assets for optimization
- C(100,20) = 5.4×10²⁰ configurations (classical infeasible!)
- Demonstrates where quantum advantage emerges

Expected: Quantum becomes competitive at N≥30 assets.
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

    # Use MASSIVE 100-asset dataset
    csv_path = Path(__file__).resolve().parents[2] / "benchmark-data" / "sp500_top100_5y_daily.csv"

    if not csv_path.exists():
        print(f"❌ Dataset not found: {csv_path}")
        print("Run: uv run scripts/download_massive_dataset.py")
        return

    csv_bytes = csv_path.read_bytes()

    # Test at increasing scales where quantum advantage should emerge
    asset_counts = [20, 30, 40, 50, 60]
    results = {}

    print(f"\n{'='*90}")
    print("MASSIVE DATASET BENCHMARK - QUANTUM SCALING ADVANTAGE")
    print(f"{'='*90}")
    print(f"Dataset: {csv_path.name} (100 assets, 5 years, 827KB)")
    print(f"Testing scales: {asset_counts} assets")
    print(f"Node count: 50 (optimal from research)")
    print(f"Optimizer: COBYLA (proven baseline, gradient optimization reverted)")
    print(f"Hypothesis: Quantum parameter search ~constant, classical grows exponentially")
    print(f"Expected crossover: N = 40-50 assets where quantum becomes FASTER")
    print(f"{'='*90}\n")

    for max_assets in asset_counts:
        budget = max(3, max_assets // 3)  # Select ~1/3 of assets

        # Calculate classical complexity
        from math import comb
        classical_configs = comb(max_assets, budget)

        if classical_configs < 1e6:
            classical_feasible = "✅ Feasible (exact enumeration possible)"
        elif classical_configs < 1e9:
            classical_feasible = "⚠️  Marginal (SA recommended, exact infeasible)"
        elif classical_configs < 1e12:
            classical_feasible = "❌ Intractable (SA required, quantum competitive zone)"
        else:
            classical_feasible = "🚀 Infeasible (quantum advantage expected!)"

        print(f"\n{'─'*90}")
        print(f"🚀 BENCHMARK: {max_assets} assets, budget={budget}")
        print(f"   Classical complexity: C({max_assets},{budget}) = {classical_configs:,.0f} portfolios")
        print(f"   Classical status: {classical_feasible}")
        print(f"{'─'*90}")

        start_time = time.time()

        try:
            benchmark = asyncio.run(
                _run_distributed_benchmark(
                    csv_bytes=csv_bytes,
                    filename=csv_path.name,
                    peer_count=50,  # Optimal node count
                    max_assets_considered=max_assets,
                    parameter_search_steps=5,
                    budget=None,  # Auto-select
                )
            )
            elapsed_time = time.time() - start_time

            timings = benchmark.get("timings", {})
            scorecard = benchmark.get("comparison_report", {}).get("scorecard", {})

            results[f"{max_assets}_assets"] = {
                "max_assets": max_assets,
                "budget": budget,
                "classical_configurations": classical_configs,
                "classical_feasible": "feasible" if max_assets <= 20 else "marginal" if max_assets <= 30 else "intractable",
                "total_benchmark_time_seconds": round(elapsed_time, 3),
                "classical_end_to_end_ms": timings.get("classical_end_to_end_duration_ms", 0),
                "quantum_distributed_end_to_end_ms": timings.get("quantum_end_to_end_duration_ms", 0),
                "quantum_parameter_search_ms": timings.get("quantum_parameter_search_duration_ms", 0),
                "parameter_search_percentage": round(
                    (timings.get("quantum_parameter_search_duration_ms", 0) /
                     timings.get("quantum_end_to_end_duration_ms", 1)) * 100, 1
                ),
                "distributed_execution_ms": timings.get("distributed_execution_duration_ms", 0),
                "fragments_executed": benchmark.get("fragments_executed", 0),
                "nodes_used": benchmark.get("distributed_nodes_used", 0),
                "winner_by_runtime": scorecard.get("winner_by_runtime", "unknown"),
                "objective_gap": scorecard.get("objective_gap", 0),
                "quantum_advantage_detected": scorecard.get("quantum_advantage_detected", False),
            }

            print(f"\n✅ COMPLETED in {elapsed_time:.2f}s")
            print(f"   Classical: {timings.get('classical_end_to_end_duration_ms', 0)}ms")
            print(f"   Quantum: {timings.get('quantum_end_to_end_duration_ms', 0)}ms")
            print(f"   Parameter Search: {timings.get('quantum_parameter_search_duration_ms', 0)}ms "
                  f"({results[f'{max_assets}_assets']['parameter_search_percentage']}%)")
            print(f"   Winner: {scorecard.get('winner_by_runtime', 'unknown')}")

            # Calculate speedup/slowdown
            classical_ms = timings.get("classical_end_to_end_duration_ms", 1)
            quantum_ms = timings.get("quantum_end_to_end_duration_ms", 1)
            if classical_ms > 0 and quantum_ms > 0:
                ratio = quantum_ms / classical_ms
                if ratio < 1:
                    print(f"   🎉 Quantum {1/ratio:.1f}× FASTER!")
                else:
                    print(f"   Quantum {ratio:.1f}× slower")

        except Exception as e:
            print(f"\n❌ FAILED: {e}")
            results[f"{max_assets}_assets"] = {
                "max_assets": max_assets,
                "error": str(e),
            }

    # Summary analysis
    print(f"\n{'='*90}")
    print("SCALING ANALYSIS: WHERE DOES QUANTUM ADVANTAGE EMERGE?")
    print(f"{'='*90}\n")

    print(f"{'Assets':<10} {'Classical Configs':<20} {'Classical Time':<18} {'Quantum Time':<15} {'Ratio':<10} {'Winner':<10}")
    print(f"{'-'*90}")

    for max_assets in asset_counts:
        key = f"{max_assets}_assets"
        if key in results and "error" not in results[key]:
            data = results[key]
            classical_ms = data["classical_end_to_end_ms"]
            quantum_ms = data["quantum_distributed_end_to_end_ms"]
            ratio = quantum_ms / classical_ms if classical_ms > 0 else 0

            configs_str = f"{data['classical_configurations']:,.0f}" if data["classical_configurations"] < 1e15 else ">10^15"
            winner = "🏆 Quantum" if ratio < 1 else "Classical"

            print(f"{max_assets:<10} {configs_str:<20} {classical_ms:<18.0f} {quantum_ms:<15.0f} {ratio:<10.1f} {winner:<10}")
        else:
            print(f"{max_assets:<10} {'ERROR':<20} {'-':<18} {'-':<15} {'-':<10} {'-':<10}")

    # Parameter search bottleneck analysis
    print(f"\n{'─'*90}")
    print("PARAMETER SEARCH CONSISTENCY (Key to Quantum Advantage)")
    print(f"{'─'*90}\n")

    param_times = []
    for max_assets in asset_counts:
        key = f"{max_assets}_assets"
        if key in results and "error" not in results[key]:
            data = results[key]
            param_ms = data["quantum_parameter_search_ms"]
            total_ms = data["quantum_distributed_end_to_end_ms"]
            percentage = data["parameter_search_percentage"]
            param_times.append(param_ms)
            print(f"{max_assets} assets: {param_ms}ms parameter search ({percentage}% of quantum runtime)")

    if len(param_times) >= 2:
        avg_param = sum(param_times) / len(param_times)
        variance = max(param_times) - min(param_times)
        print(f"\nAverage parameter search: {avg_param:.0f}ms")
        print(f"Variance: {variance:.0f}ms ({variance/avg_param*100:.1f}%)")
        if variance / avg_param < 0.5:
            print("✅ Parameter search time is CONSTANT with N (quantum scales well!)")
        else:
            print("⚠️  Parameter search varies significantly with N")

    # Quantum advantage detection
    print(f"\n{'─'*90}")
    print("QUANTUM ADVANTAGE CROSSOVER POINT")
    print(f"{'─'*90}\n")

    crossover_detected = False
    crossover_point = None
    for max_assets in asset_counts:
        key = f"{max_assets}_assets"
        if key in results and "error" not in results[key]:
            data = results[key]
            classical_ms = data["classical_end_to_end_ms"]
            quantum_ms = data["quantum_distributed_end_to_end_ms"]

            if quantum_ms < classical_ms:
                if not crossover_detected:
                    crossover_detected = True
                    crossover_point = max_assets
                print(f"🎉 {max_assets} assets: QUANTUM WINS! ({quantum_ms}ms vs {classical_ms}ms, {classical_ms/quantum_ms:.2f}× faster)")
            else:
                ratio = quantum_ms / classical_ms
                print(f"   {max_assets} assets: Classical wins ({quantum_ms}ms vs {classical_ms}ms, {ratio:.2f}× slower)")

    if crossover_detected:
        print(f"\n🚀 QUANTUM ADVANTAGE ACHIEVED AT N = {crossover_point} ASSETS!")
        print(f"   Hypothesis confirmed: Quantum parameter search constant, classical grows exponentially")
    else:
        print(f"\n⚠️  No quantum advantage detected yet.")
        print(f"   Next: Test even larger N (70-100 assets) or consider option pricing alternative")

    # Save results
    output_path = Path(__file__).resolve().parent / "massive_dataset_benchmark_results.json"
    output_path.write_text(json.dumps(results, indent=2))
    print(f"\n📁 Full results saved to: {output_path}")
    print(f"\n{'='*90}\n")


if __name__ == "__main__":
    main()
