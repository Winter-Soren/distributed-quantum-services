#!/usr/bin/env python3
"""Test the benchmark API endpoint with S&P 500 data."""

import sys
import httpx
from pathlib import Path

print("="*90)
print("BENCHMARK API TEST - S&P 500 DATASET")
print("="*90)
print()

# Check if API is running
API_URL = "http://localhost:8000"
BENCHMARK_ENDPOINT = f"{API_URL}/benchmark/portfolio"

print(f"🔍 Checking if API is running at {API_URL}...")
try:
    response = httpx.get(f"{API_URL}/health", timeout=5.0)
    if response.status_code == 200:
        print(f"✅ API is running")
    else:
        print(f"⚠️  API returned status {response.status_code}")
except httpx.ConnectError:
    print(f"❌ API is not running!")
    print(f"   Start it with: cd backend-v2 && source .venv/bin/activate && python -m quantum_backend_v2.main")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error connecting to API: {e}")
    sys.exit(1)

print()

# Load S&P 500 CSV
csv_path = Path(__file__).parents[2] / 'benchmark-data' / 'massive' / 'sp500' / 'sp500_top50_5y.csv'

if not csv_path.exists():
    print(f"❌ CSV not found: {csv_path}")
    sys.exit(1)

print(f"📁 Dataset: {csv_path.name}")
print(f"   Size: {csv_path.stat().st_size / 1024:.1f} KB")
print()

# Configuration
MAX_ASSETS = 12
RISK_AVERSION = 0.5
PARAM_STEPS = 10

print(f"⚙️  Configuration:")
print(f"   Max assets: {MAX_ASSETS} companies")
print(f"   Risk aversion: {RISK_AVERSION}")
print(f"   Parameter steps: {PARAM_STEPS}")
print()

print("🚀 Sending benchmark request to API...")
print(f"   POST {BENCHMARK_ENDPOINT}")
print()

try:
    with open(csv_path, 'rb') as f:
        files = {'csv_file': ('sp500_top50_5y.csv', f, 'text/csv')}
        data = {
            'max_assets': MAX_ASSETS,
            'risk_aversion': RISK_AVERSION,
            'parameter_search_steps': PARAM_STEPS,
        }

        # Send request with 10 minute timeout (quantum computation is slow)
        response = httpx.post(
            BENCHMARK_ENDPOINT,
            files=files,
            data=data,
            timeout=600.0  # 10 minutes
        )

    if response.status_code != 200:
        print(f"❌ API returned status {response.status_code}")
        print(f"   Response: {response.text}")
        sys.exit(1)

    result = response.json()

except httpx.ReadTimeout:
    print(f"❌ Request timed out after 10 minutes")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("✅ Benchmark complete!")
print()

# Display results
print("="*90)
print("RESULTS")
print("="*90)
print()

print("📊 Dataset:")
print(f"   Companies: {len(result['selected_tickers'])}")
print(f"   Tickers: {result['selected_tickers'][:10]}...")
print(f"   Period: {result['dataset_info']['start_date']} to {result['dataset_info']['end_date']}")
print(f"   Data points: {result['dataset_info']['period_count']}")
print()

print("⏱️  Performance:")
print(f"   Classical: {result['classical_time_ms']:.2f}ms")
print(f"   Quantum: {result['quantum_time_ms']:.2f}ms")
if result['quantum_time_ms'] > result['classical_time_ms']:
    print(f"   Winner: Classical ({result['quantum_time_ms']/result['classical_time_ms']:.2f}x faster)")
else:
    print(f"   Winner: ✨ QUANTUM ({result['classical_time_ms']/result['quantum_time_ms']:.2f}x faster) ✨")
print()

print("🔬 Quantum Breakdown:")
param_ms = result['timings']['quantum_parameter_search_ms']
compile_ms = result['timings']['quantum_circuit_compile_ms']
quantum_ms = result['quantum_time_ms']

print(f"   Parameter search: {param_ms:.2f}ms ({param_ms/quantum_ms*100:.1f}%)")
print(f"   Circuit compilation: {compile_ms:.2f}ms ({compile_ms/quantum_ms*100:.1f}%)")
print(f"   Parameter evaluations: {result['timings']['parameter_evaluations']}")
print()

print("✅ Solution Quality:")
print(f"   Classical solution: {result['classical_solution']['bitstring']}")
print(f"   Quantum solution: {result['quantum_solution']['bitstring']}")
print(f"   Match: {'✅ YES' if result['solution_match'] else '❌ NO'}")
print(f"   Fidelity: {result['fidelity']:.6f} {'✅' if result['fidelity'] and result['fidelity'] > 0.99 else '⚠️'}")
print()

print("📈 Classical Solution:")
print(f"   Assets: {result['classical_solution']['selected_assets']}")
print(f"   Objective: {result['classical_solution']['objective']:.6f}")
print(f"   Return: {result['classical_solution']['annualized_return']:.4f}")
print(f"   Variance: {result['classical_solution']['annualized_variance']:.6f}")
print()

print("📈 Quantum Solution:")
print(f"   Assets: {result['quantum_solution']['selected_assets']}")
print(f"   Objective: {result['quantum_solution']['objective']:.6f}")
print(f"   Return: {result['quantum_solution']['annualized_return']:.4f}")
print(f"   Variance: {result['quantum_solution']['annualized_variance']:.6f}")
print(f"   Probability: {result['quantum_solution']['probability']:.4f}")
print()

print(f"🏆 WINNER: {result['winner'].upper()}")
print()

print("="*90)
print("BENCHMARK COMPLETE - Using REAL backend-v2 REST API!")
print("="*90)
