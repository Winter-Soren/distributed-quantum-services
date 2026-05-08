"""Quick Damodaran benchmark runner - uses pre-converted CSV."""

import sys
import asyncio
import json
import logging
import time
from pathlib import Path

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from run_track_b_market_benchmark import _run_distributed_benchmark

logging.getLogger("qiskit").setLevel(logging.WARNING)

print("="*90)
print("QUANTUM VS CLASSICAL PORTFOLIO OPTIMIZATION")
print("Using Professor Aswath Damodaran's NYU Historical Returns Dataset")
print("="*90)

# Read the CSV
csv_path = Path(__file__).parents[2] / 'benchmark-data' / 'damodaran' / 'histretSP.csv'
if not csv_path.exists():
    print(f"❌ CSV file not found: {csv_path}")
    print("Run: python scripts/convert_damodaran_to_csv.py")
    sys.exit(1)

csv_bytes = csv_path.read_bytes()

# Test configurations
configs = [
    {'max_assets': 3, 'peers': 10, 'steps': 5},
    {'max_assets': 4, 'peers': 15, 'steps': 5},
    {'max_assets': 5, 'peers': 20, 'steps': 5},
]

print(f"\nDataset: histretSP.csv")
print(f"Period: 1928-2025 (98 years)")
print(f"Asset classes: 7 (SP500, Small Cap, T-Bills, T-Bonds, Baa Bonds, Real Estate, Gold)")
print(f"Testing {len(configs)} configurations")
print("="*90)

results = []

for idx, config in enumerate(configs, 1):
    print(f"\n{'─'*90}")
    print(f"CONFIGURATION {idx}/{len(configs)}")
    print(f"  Max assets: {config['max_assets']}")
    print(f"  Quantum nodes: {config['peers']}")
    print(f"  Parameter steps: {config['steps']}")
    print(f"{'─'*90}")

    start = time.time()

    try:
        benchmark = asyncio.run(
            _run_distributed_benchmark(
                csv_bytes=csv_bytes,
                filename='histretSP.csv',
                peer_count=config['peers'],
                max_assets_considered=config['max_assets'],
                parameter_search_steps=config['steps'],
                budget=None,
            )
        )

        elapsed = time.time() - start
        timings = benchmark.get('timings', {})
        scorecard = benchmark.get('comparison_report', {}).get('scorecard', {})

        classical_ms = timings.get('classical_end_to_end_duration_ms', 0)
        quantum_ms = timings.get('quantum_end_to_end_duration_ms', 0)
        ratio = quantum_ms / classical_ms if classical_ms > 0 else 0

        print(f"\n✅ COMPLETED in {elapsed:.2f}s")
        print(f"   Classical: {classical_ms}ms")
        print(f"   Quantum: {quantum_ms}ms")
        print(f"   Ratio (Q/C): {ratio:.2f}x")
        print(f"   Winner: {scorecard.get('winner_by_runtime', 'unknown')}")

        if ratio > 0 and ratio < 1:
            print(f"   🎉 Quantum {1/ratio:.2f}× FASTER!")
        elif ratio >= 1:
            print(f"   Quantum {ratio:.2f}× slower")
        else:
            print(f"   Unable to compute speedup (classical time too small)")

        results.append({
            'config': config,
            'elapsed_seconds': elapsed,
            'timings': timings,
            'scorecard': scorecard,
            'benchmark_details': benchmark,
        })

    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        results.append({'config': config, 'error': str(e)})

# Summary
print(f"\n{'='*90}")
print("BENCHMARK SUMMARY - DAMODARAN DATASET (1928-2025)")
print(f"{'='*90}\n")
print(f"{'Assets':<10} {'Classical (ms)':<18} {'Quantum (ms)':<18} {'Ratio':<10} {'Winner':<15}")
print(f"{'-'*90}")

for result in results:
    if 'error' not in result:
        cfg = result['config']
        timings = result['timings']
        classical_ms = timings['classical_end_to_end_duration_ms']
        quantum_ms = timings['quantum_end_to_end_duration_ms']
        ratio = quantum_ms / classical_ms if classical_ms > 0 else 0
        winner = "🏆 Quantum" if ratio > 0 and ratio < 1 else "Classical"

        print(f"{cfg['max_assets']:<10} {classical_ms:<18.1f} {quantum_ms:<18.1f} {ratio:<10.2f} {winner:<15}")
    else:
        print(f"{result['config']['max_assets']:<10} {'ERROR':<18} {'-':<18} {'-':<10} {'-':<15}")

# Save results
output_path = Path(__file__).parents[2] / 'benchmark-data' / 'damodaran_benchmark_results.json'
output_path.write_text(json.dumps(results, indent=2))
print(f"\n📁 Results saved to: {output_path}")
print(f"\n{'='*90}\n")
