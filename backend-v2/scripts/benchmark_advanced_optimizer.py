"""Benchmark advanced QAOA parameter optimizer vs original COBYLA approach."""

from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path

# Temporarily disable advanced optimizer to compare
import quantum_backend_v2.application.financial_portfolio as fp_module

from run_track_b_market_benchmark import _run_distributed_benchmark


def main() -> None:
    csv_path = Path(__file__).resolve().parents[2] / "benchmark-data" / "diversified_20_asset_2y.csv"
    csv_bytes = csv_path.read_bytes()

    results = {}

    # Test 1: Original COBYLA (disable advanced optimizer)
    print("="*80)
    print("TEST 1: COBYLA (Original Approach)")
    print("="*80)
    original_flag = fp_module._USE_ADVANCED_OPTIMIZER
    fp_module._USE_ADVANCED_OPTIMIZER = False

    start = time.time()
    benchmark_cobyla = asyncio.run(
        _run_distributed_benchmark(
            csv_bytes=csv_bytes,
            filename=csv_path.name,
            peer_count=5,
            max_assets_considered=10,
            parameter_search_steps=5,
            budget=None,
        )
    )
    cobyla_time = time.time() - start

    results["cobyla"] = {
        "total_time_seconds": round(cobyla_time, 3),
        "quantum_distributed_ms": benchmark_cobyla.get("timings", {}).get("quantum_end_to_end_duration_ms", 0),
        "quantum_local_ms": benchmark_cobyla.get("timings", {}).get("quantum_local_end_to_end_duration_ms", 0),
        "classical_ms": benchmark_cobyla.get("timings", {}).get("classical_end_to_end_duration_ms", 0),
    }

    print(f"\n✅ COBYLA Completed: {cobyla_time:.2f}s")
    print(f"   Quantum (local): {results['cobyla']['quantum_local_ms']}ms")

    # Test 2: L-BFGS-B (first run, no warm-start)
    print("\n" + "="*80)
    print("TEST 2: L-BFGS-B (First Run - No Transfer Learning)")
    print("="*80)

    # Clear cache to ensure cold start
    cache_dir = Path.home() / ".cache" / "qaoa_parameters"
    cache_file = cache_dir / "parameter_cache.json"
    if cache_file.exists():
        cache_file.unlink()

    fp_module._USE_ADVANCED_OPTIMIZER = True

    start = time.time()
    benchmark_lbfgsb_cold = asyncio.run(
        _run_distributed_benchmark(
            csv_bytes=csv_bytes,
            filename=csv_path.name,
            peer_count=5,
            max_assets_considered=10,
            parameter_search_steps=5,
            budget=None,
        )
    )
    lbfgsb_cold_time = time.time() - start

    results["lbfgsb_cold"] = {
        "total_time_seconds": round(lbfgsb_cold_time, 3),
        "quantum_distributed_ms": benchmark_lbfgsb_cold.get("timings", {}).get("quantum_end_to_end_duration_ms", 0),
        "quantum_local_ms": benchmark_lbfgsb_cold.get("timings", {}).get("quantum_local_end_to_end_duration_ms", 0),
        "classical_ms": benchmark_lbfgsb_cold.get("timings", {}).get("classical_end_to_end_duration_ms", 0),
    }

    print(f"\n✅ L-BFGS-B (Cold) Completed: {lbfgsb_cold_time:.2f}s")
    print(f"   Quantum (local): {results['lbfgsb_cold']['quantum_local_ms']}ms")

    # Test 3: L-BFGS-B (second run, with warm-start)
    print("\n" + "="*80)
    print("TEST 3: L-BFGS-B (Second Run - With Transfer Learning)")
    print("="*80)

    start = time.time()
    benchmark_lbfgsb_warm = asyncio.run(
        _run_distributed_benchmark(
            csv_bytes=csv_bytes,
            filename=csv_path.name,
            peer_count=5,
            max_assets_considered=10,
            parameter_search_steps=5,
            budget=None,
        )
    )
    lbfgsb_warm_time = time.time() - start

    results["lbfgsb_warm"] = {
        "total_time_seconds": round(lbfgsb_warm_time, 3),
        "quantum_distributed_ms": benchmark_lbfgsb_warm.get("timings", {}).get("quantum_end_to_end_duration_ms", 0),
        "quantum_local_ms": benchmark_lbfgsb_warm.get("timings", {}).get("quantum_local_end_to_end_duration_ms", 0),
        "classical_ms": benchmark_lbfgsb_warm.get("timings", {}).get("classical_end_to_end_duration_ms", 0),
    }

    print(f"\n✅ L-BFGS-B (Warm) Completed: {lbfgsb_warm_time:.2f}s")
    print(f"   Quantum (local): {results['lbfgsb_warm']['quantum_local_ms']}ms")

    # Restore original setting
    fp_module._USE_ADVANCED_OPTIMIZER = original_flag

    # Summary
    print("\n" + "="*80)
    print("COMPARATIVE ANALYSIS")
    print("="*80 + "\n")

    print(f"{'Metric':<40} {'COBYLA':<15} {'L-BFGS-B Cold':<15} {'L-BFGS-B Warm':<15}")
    print("-"*80)
    print(f"{'Total Time (s)':<40} {results['cobyla']['total_time_seconds']:<15} {results['lbfgsb_cold']['total_time_seconds']:<15} {results['lbfgsb_warm']['total_time_seconds']:<15}")
    print(f"{'Quantum Local (ms)':<40} {results['cobyla']['quantum_local_ms']:<15} {results['lbfgsb_cold']['quantum_local_ms']:<15} {results['lbfgsb_warm']['quantum_local_ms']:<15}")
    print(f"{'Classical (ms)':<40} {results['cobyla']['classical_ms']:<15} {results['lbfgsb_cold']['classical_ms']:<15} {results['lbfgsb_warm']['classical_ms']:<15}")

    print("\n" + "-"*80)
    print("SPEEDUP ANALYSIS")
    print("-"*80 + "\n")

    lbfgsb_cold_speedup = results['cobyla']['quantum_local_ms'] / results['lbfgsb_cold']['quantum_local_ms'] if results['lbfgsb_cold']['quantum_local_ms'] > 0 else 0
    lbfgsb_warm_speedup = results['cobyla']['quantum_local_ms'] / results['lbfgsb_warm']['quantum_local_ms'] if results['lbfgsb_warm']['quantum_local_ms'] > 0 else 0

    print(f"L-BFGS-B (cold) vs COBYLA: {lbfgsb_cold_speedup:.2f}x speedup")
    print(f"L-BFGSB (warm) vs COBYLA: {lbfgsb_warm_speedup:.2f}x speedup")
    print(f"L-BFGS-B warm vs cold: {results['lbfgsb_cold']['quantum_local_ms'] / results['lbfgsb_warm']['quantum_local_ms'] if results['lbfgsb_warm']['quantum_local_ms'] > 0 else 0:.2f}x speedup")

    # Save results
    output_file = Path(__file__).parent / "advanced_optimizer_benchmark_results.json"
    output_file.write_text(json.dumps(results, indent=2))
    print(f"\n📁 Results saved to: {output_file}")
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    main()
