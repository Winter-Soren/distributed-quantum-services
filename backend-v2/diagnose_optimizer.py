"""Diagnose optimizer behavior: with/without gradients."""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from quantum_backend_v2.application import financial_portfolio

# Small test CSV
csv_content = """date,AAPL,MSFT,GOOGL,AMZN,TSLA
2024-01-01,180.5,390.2,140.3,175.8,245.6
2024-01-02,182.3,392.5,142.1,177.2,248.3
2024-01-03,181.7,391.8,141.5,176.5,246.9"""

print("="*80)
print("OPTIMIZER DIAGNOSTICS")
print("="*80)
print()

# Test 1: Advanced optimizer ENABLED (with gradients)
print("TEST 1: Advanced Optimizer ENABLED (should use gradients for 5 qubits)")
print("-"*80)
financial_portfolio._USE_ADVANCED_OPTIMIZER = True
financial_portfolio._USE_PARAMETER_SHIFT_GRADIENTS = True

start = time.time()
result1 = financial_portfolio.build_portfolio_optimization_artifacts(
    csv_bytes=csv_content.encode(),
    filename="test.csv",
    max_assets_considered=5,
    budget=2,
    parameter_search_steps=3,
    risk_aversion=2.0,
)
elapsed1 = time.time() - start

print(f"Time: {elapsed1:.3f}s")
print(f"Optimizer Strategy: {result1.get('optimizer_strategy', 'N/A')}")
print(f"Parameter Evaluations: {result1.get('parameter_evaluations', 'N/A')}")
print()

# Test 2: Advanced optimizer DISABLED (COBYLA baseline)
print("TEST 2: Advanced Optimizer DISABLED (COBYLA baseline)")
print("-"*80)
financial_portfolio._USE_ADVANCED_OPTIMIZER = False

start = time.time()
result2 = financial_portfolio.build_portfolio_optimization_artifacts(
    csv_bytes=csv_content.encode(),
    filename="test.csv",
    max_assets_considered=5,
    budget=2,
    parameter_search_steps=3,
    risk_aversion=2.0,
)
elapsed2 = time.time() - start

print(f"Time: {elapsed2:.3f}s")
print(f"Optimizer Strategy: {result2.get('optimizer_strategy', 'N/A')}")
print(f"Parameter Evaluations: {result2.get('parameter_evaluations', 'N/A')}")
print()

# Comparison
print("="*80)
print("COMPARISON")
print("="*80)
speedup = elapsed2 / elapsed1
if speedup > 1:
    print(f"✅ Advanced optimizer is {speedup:.2f}× FASTER")
elif speedup < 1:
    print(f"❌ Advanced optimizer is {1/speedup:.2f}× SLOWER")
else:
    print(f"⚖️  No significant difference")

eval1 = result1.get('parameter_evaluations', 0)
eval2 = result2.get('parameter_evaluations', 0)
if eval1 > 0 and eval2 > 0:
    eval_ratio = eval2 / eval1
    print(f"Evaluation reduction: {eval_ratio:.2f}× ({eval2} → {eval1})")

print()
print("Expected with gradients: 2-3× fewer evaluations, 2-3× faster")
print("="*80)
