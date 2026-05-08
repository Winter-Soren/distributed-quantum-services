#!/usr/bin/env python3
"""Run REAL quantum vs classical benchmark using S&P 500 data through backend."""

import sys
import asyncio
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parents[1] / 'src'))

from run_track_b_market_benchmark import _run_distributed_benchmark

print("="*90)
print("REAL QUANTUM VS CLASSICAL BENCHMARK - S&P 500 COMPANIES")
print("Using backend full quantum execution pipeline")
print("="*90)
print()

# Load S&P 500 CSV
csv_path = Path(__file__).parents[2] / 'benchmark-data' / 'massive' / 'sp500' / 'sp500_top50_5y.csv'

if not csv_path.exists():
    print(f"❌ CSV not found: {csv_path}")
    sys.exit(1)

csv_bytes = csv_path.read_bytes()
print(f"📁 Dataset: {csv_path.name}")
print(f"   Size: {len(csv_bytes) / 1024:.1f} KB")
print()

# Configuration
MAX_ASSETS = 12  # 12 companies
PEER_COUNT = 20   # 20 quantum nodes
PARAM_STEPS = 10  # Parameter optimization steps

print(f"⚙️  Configuration:")
print(f"   Assets: {MAX_ASSETS} companies")
print(f"   Quantum nodes: {PEER_COUNT}")
print(f"   Parameter steps: {PARAM_STEPS}")
print()

print("🚀 Running REAL benchmark through backend...")
print("   This will:")
print("   1. Load price data for companies")
print("   2. Calculate returns & covariance")
print("   3. Run classical exact optimization")
print("   4. Build QAOA quantum circuit")
print("   5. Compile to execution plan")
print("   6. Distribute across {PEER_COUNT} quantum nodes")
print("   7. Execute quantum optimization")
print("   8. Compare results")
print()

# Run the REAL benchmark
result = asyncio.run(
    _run_distributed_benchmark(
        csv_bytes=csv_bytes,
        filename=csv_path.name,
        peer_count=PEER_COUNT,
        max_assets_considered=MAX_ASSETS,
        parameter_search_steps=PARAM_STEPS,
        budget=None,
    )
)

# Extract results
timings = result.get('timings', {})
scorecard = result.get('comparison_report', {}).get('scorecard', {})
dataset = result.get('dataset', {})

print()
print("="*90)
print("RESULTS")
print("="*90)
print()

# Dataset info
print("📊 Dataset:")
print(f"   Companies: {len(result.get('selected_tickers', []))}")
print(f"   Tickers: {result.get('selected_tickers', [])}")
print(f"   Period: {dataset.get('start_date')} to {dataset.get('end_date')}")
print(f"   Data points: {dataset.get('period_count', 0)}")
print()

# Performance
classical_ms = timings.get('classical_end_to_end_duration_ms', 0)
quantum_ms = timings.get('quantum_end_to_end_duration_ms', 0)

print("⏱️  Performance:")
print(f"   Classical: {classical_ms}ms")
print(f"   Quantum: {quantum_ms}ms")
if quantum_ms > classical_ms:
    print(f"   Winner: Classical ({quantum_ms/classical_ms:.2f}x faster)")
else:
    print(f"   Winner: ✨ QUANTUM ({classical_ms/quantum_ms:.2f}x faster) ✨")
print()

# Quantum breakdown
print("🔬 Quantum Breakdown:")
param_ms = timings.get('quantum_parameter_search_duration_ms', 0)
compile_ms = timings.get('plan_compile_duration_ms', 0)
dist_ms = timings.get('distributed_execution_duration_ms', 0)

print(f"   Parameter search: {param_ms}ms ({param_ms/quantum_ms*100 if quantum_ms else 0:.1f}%)")
print(f"   Circuit compilation: {compile_ms}ms ({compile_ms/quantum_ms*100 if quantum_ms else 0:.1f}%)")
print(f"   Distributed execution: {dist_ms}ms ({dist_ms/quantum_ms*100 if quantum_ms else 0:.1f}%)")
print()

# Distribution
fragments = result.get('fragments_executed', 0)
nodes = result.get('distributed_nodes_used', 0)

print("🌐 Distribution:")
print(f"   Fragments executed: {fragments}")
print(f"   Nodes used: {nodes}")
print(f"   Fragments per node: {fragments/nodes if nodes else 0:.1f}")
print()

# Solution quality
classical_solution = result.get('classical_bitstring', '')
quantum_solution = result.get('quantum_bitstring_distributed', '')
match = result.get('counts_match_classical', False)
fidelity = result.get('validation_statevector_fidelity', 0)

print("✅ Solution Quality:")
print(f"   Classical solution: {classical_solution}")
print(f"   Quantum solution: {quantum_solution}")
print(f"   Match: {'✅ YES' if match else '❌ NO'}")
print(f"   Fidelity: {fidelity:.6f} {'✅' if fidelity > 0.99 else '⚠️'}")
print()

# Winner
winner = scorecard.get('winner_by_runtime', 'unknown')
print(f"🏆 WINNER: {winner.upper()}")
print()

# Save results
output_path = Path(__file__).parents[2] / 'benchmark-data' / 'sp500_real_benchmark_results.json'
output_path.write_text(json.dumps(result, indent=2))
print(f"💾 Full results saved to: {output_path}")

print()
print("="*90)
print("BENCHMARK COMPLETE - Using REAL backend quantum execution!")
print("="*90)
