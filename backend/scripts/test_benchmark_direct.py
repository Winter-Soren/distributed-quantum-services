#!/usr/bin/env python3
"""Test benchmark function directly without API."""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parents[1] / 'src'))

from quantum_backend_v2.application.financial_portfolio import (
    PortfolioOptimizationConfig,
    build_portfolio_optimization_artifacts,
)

print("="*90)
print("DIRECT BENCHMARK TEST - S&P 500 DATASET")
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

# Configuration - Larger test to find quantum advantage
MAX_ASSETS = 12
PARAM_STEPS = 10

print(f"⚙️  Configuration:")
print(f"   Assets: {MAX_ASSETS} companies")
print(f"   Parameter steps: {PARAM_STEPS}")
print()

print("🚀 Running benchmark through backend core...")
print()

try:
    # Build artifacts
    artifacts = build_portfolio_optimization_artifacts(
        csv_bytes=csv_bytes,
        job_id=f"test-{int(__import__('time').time())}",
        filename=csv_path.name,
        config=PortfolioOptimizationConfig(
            max_assets_considered=MAX_ASSETS,
            risk_aversion=0.5,
            parameter_search_steps=PARAM_STEPS,
            budget=None,
        ),
    )

    # Extract results
    payload = artifacts.payload
    print("✅ Benchmark complete!")
    print()

    # Display results
    print("="*90)
    print("RESULTS")
    print("="*90)
    print()

    dataset = payload.get("dataset", {})
    print("📊 Dataset:")
    print(f"   Companies: {dataset.get('asset_count')}")
    print(f"   Tickers: {dataset.get('selected_tickers', [])}")
    print(f"   Period: {dataset.get('start_date')} to {dataset.get('end_date')}")
    print(f"   Data points: {dataset.get('period_count')}")
    print()

    timings = payload["benchmark"]["timings"]
    classical_ms = timings["classical_end_to_end_duration_ms"]
    quantum_ms = timings["quantum_local_end_to_end_duration_ms"]

    print("⏱️  Performance:")
    print(f"   Classical: {classical_ms}ms")
    print(f"   Quantum: {quantum_ms}ms")
    if quantum_ms > classical_ms:
        print(f"   Winner: Classical ({quantum_ms/classical_ms:.2f}x faster)")
    else:
        print(f"   Winner: ✨ QUANTUM ({classical_ms/quantum_ms:.2f}x faster) ✨")
    print()

    classical_sol = payload["benchmark"]["classical"]
    quantum_sol = payload["benchmark"]["quantum"]

    print("✅ Solution Quality:")
    print(f"   Classical solution: {classical_sol['bitstring']}")
    print(f"   Quantum solution: {quantum_sol['bitstring']}")
    print(f"   Match: {'✅ YES' if classical_sol['bitstring'] == quantum_sol['bitstring'] else '❌ NO'}")
    fidelity = quantum_sol.get('fidelity')
    if fidelity:
        print(f"   Fidelity: {fidelity:.6f} {'✅' if fidelity > 0.99 else '⚠️'}")
    print()

    print("="*90)
    print("BENCHMARK COMPLETE - Using REAL backend core!")
    print("="*90)

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
