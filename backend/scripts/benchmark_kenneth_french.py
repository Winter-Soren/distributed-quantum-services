#!/usr/bin/env python3
"""Benchmark quantum vs classical on Kenneth French 100 Portfolios dataset.

This is a simplified standalone benchmark that doesn't require full quantum_backend_v2 stack.
"""

import sys
import time
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

print("="*90)
print("QUANTUM VS CLASSICAL - KENNETH FRENCH 100 PORTFOLIOS BENCHMARK")
print("="*90)
print()

# Configuration - Use S&P 500 real companies instead
DATASET_PATH = Path(__file__).parents[2] / 'benchmark-data' / 'massive' / 'sp500' / 'sp500_top50_5y.csv'
MAX_ASSETS = 12  # 12 real companies - pushes toward crossover
RISK_AVERSION = 0.5  # Risk parameter

print(f"📁 Dataset: {DATASET_PATH.name}")
print(f"🎯 Testing with: {MAX_ASSETS} assets")
print(f"⚖️  Risk aversion: {RISK_AVERSION}")
print()

# Load data
print("📥 Loading dataset...")
prices_df = pd.read_csv(DATASET_PATH, index_col=0, parse_dates=True)
print(f"   Shape: {prices_df.shape[0]} days × {prices_df.shape[1]} portfolios")
print(f"   Date range: {prices_df.index.min()} to {prices_df.index.max()}")

# Select subset
selected_cols = prices_df.columns[:MAX_ASSETS]
prices_df = prices_df[selected_cols]
print(f"   Selected: {MAX_ASSETS} portfolios")
print()

# Calculate returns
print("📊 Calculating returns...")
returns_df = prices_df.pct_change().dropna()
mean_returns = returns_df.mean().values
cov_matrix = returns_df.cov().values
print(f"   Mean returns: {mean_returns[:3]}...")
print(f"   Covariance shape: {cov_matrix.shape}")
print()

# ============================================================================
# CLASSICAL OPTIMIZATION (Exact Enumeration for small N)
# ============================================================================

print("="*90)
print("CLASSICAL OPTIMIZATION - Exact Enumeration")
print("="*90)

classical_start = time.time()

n_assets = len(mean_returns)
best_objective = -np.inf
best_allocation = None

print(f"Testing all 2^{n_assets} = {2**n_assets} possible portfolios...")

for i in range(2**n_assets):
    # Binary allocation
    allocation = np.array([(i >> j) & 1 for j in range(n_assets)])

    if allocation.sum() == 0:
        continue  # Skip empty portfolio

    # Normalize
    weights = allocation / allocation.sum()

    # Calculate portfolio metrics
    portfolio_return = np.dot(weights, mean_returns)
    portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))

    # Objective: return - risk_aversion * variance
    objective = portfolio_return - RISK_AVERSION * portfolio_variance

    if objective > best_objective:
        best_objective = objective
        best_allocation = allocation

classical_time = (time.time() - classical_start) * 1000  # ms

classical_weights = best_allocation / best_allocation.sum()
classical_return = np.dot(classical_weights, mean_returns)
classical_risk = np.sqrt(np.dot(classical_weights, np.dot(cov_matrix, classical_weights)))

print(f"✅ Classical complete in {classical_time:.2f}ms")
print(f"   Best allocation: {best_allocation}")
print(f"   Objective: {best_objective:.6f}")
print(f"   Return: {classical_return:.6f}")
print(f"   Risk (std): {classical_risk:.6f}")
print()

# ============================================================================
# QUANTUM OPTIMIZATION (QAOA Simulation)
# ============================================================================

print("="*90)
print("QUANTUM OPTIMIZATION - QAOA Simulation")
print("="*90)

try:
    from qiskit import QuantumCircuit
    from qiskit.circuit import Parameter
    from qiskit.quantum_info import Statevector
    from scipy.optimize import minimize

    quantum_start = time.time()

    # Build QAOA circuit
    print(f"🔧 Building QAOA circuit for {n_assets} qubits...")

    # Parameters
    beta = Parameter('β')
    gamma = Parameter('γ')

    # Create circuit
    qc = QuantumCircuit(n_assets)

    # Initial state: equal superposition
    qc.h(range(n_assets))

    # Problem Hamiltonian (simplified - encode objective into phases)
    for i in range(n_assets):
        qc.rz(2 * gamma * mean_returns[i], i)

    for i in range(n_assets):
        for j in range(i+1, n_assets):
            qc.cx(i, j)
            qc.rz(2 * gamma * cov_matrix[i,j], j)
            qc.cx(i, j)

    # Mixer Hamiltonian
    for i in range(n_assets):
        qc.rx(2 * beta, i)

    print(f"   Circuit depth: {qc.depth()}")
    print(f"   Gates: {qc.size()}")

    # Parameter optimization
    print(f"🔍 Optimizing parameters...")

    def qaoa_objective(params):
        """Evaluate QAOA expectation value."""
        bound_circuit = qc.assign_parameters({beta: params[0], gamma: params[1]})
        state = Statevector.from_instruction(bound_circuit)

        # Measure expectation value
        expectation = 0.0
        for i in range(2**n_assets):
            allocation = np.array([(i >> j) & 1 for j in range(n_assets)])
            if allocation.sum() == 0:
                continue

            weights = allocation / allocation.sum()
            portfolio_return = np.dot(weights, mean_returns)
            portfolio_variance = np.dot(weights, np.dot(cov_matrix, weights))
            objective_val = portfolio_return - RISK_AVERSION * portfolio_variance

            prob = abs(state[i])**2
            expectation += prob * objective_val

        return -expectation  # Minimize negative = maximize

    # Optimize
    result = minimize(qaoa_objective, x0=[0.5, 0.5], method='COBYLA',
                     options={'maxiter': 50})

    print(f"   Optimization iterations: {result.nfev}")
    print(f"   Optimal parameters: β={result.x[0]:.4f}, γ={result.x[1]:.4f}")

    # Get final state
    final_circuit = qc.assign_parameters({beta: result.x[0], gamma: result.x[1]})
    final_state = Statevector.from_instruction(final_circuit)

    # Sample most likely outcome
    probs = [abs(final_state[i])**2 for i in range(2**n_assets)]
    quantum_allocation_idx = np.argmax(probs)
    quantum_allocation = np.array([(quantum_allocation_idx >> j) & 1 for j in range(n_assets)])

    quantum_time = (time.time() - quantum_start) * 1000  # ms

    if quantum_allocation.sum() == 0:
        print("⚠️  Quantum found empty portfolio, using second best...")
        probs[quantum_allocation_idx] = 0
        quantum_allocation_idx = np.argmax(probs)
        quantum_allocation = np.array([(quantum_allocation_idx >> j) & 1 for j in range(n_assets)])

    quantum_weights = quantum_allocation / quantum_allocation.sum()
    quantum_return = np.dot(quantum_weights, mean_returns)
    quantum_risk = np.sqrt(np.dot(quantum_weights, np.dot(cov_matrix, quantum_weights)))
    quantum_objective = quantum_return - RISK_AVERSION * quantum_risk**2

    print(f"✅ Quantum complete in {quantum_time:.2f}ms")
    print(f"   Best allocation: {quantum_allocation}")
    print(f"   Objective: {quantum_objective:.6f}")
    print(f"   Return: {quantum_return:.6f}")
    print(f"   Risk (std): {quantum_risk:.6f}")
    print(f"   Probability: {probs[quantum_allocation_idx]:.4f}")
    print()

    # Comparison
    print("="*90)
    print("COMPARISON")
    print("="*90)
    print(f"{'Metric':<30} {'Classical':<20} {'Quantum':<20} {'Match'}")
    print("-"*90)
    print(f"{'Runtime':<30} {classical_time:.2f}ms{' ':<15} {quantum_time:.2f}ms{' ':<15} {'Classical' if classical_time < quantum_time else 'Quantum'}")
    print(f"{'Speedup':<30} {'baseline':<20} {f'{quantum_time/classical_time:.2f}x slower':<20}")
    print(f"{'Allocation':<30} {str(best_allocation):<20} {str(quantum_allocation):<20} {'✅' if np.array_equal(best_allocation, quantum_allocation) else '❌'}")
    print(f"{'Objective':<30} {best_objective:.6f}{' ':<13} {quantum_objective:.6f}{' ':<13} {'✅' if abs(best_objective - quantum_objective) < 0.01 else '❌'}")
    print(f"{'Return':<30} {classical_return:.6f}{' ':<13} {quantum_return:.6f}{' ':<13}")
    print(f"{'Risk':<30} {classical_risk:.6f}{' ':<13} {quantum_risk:.6f}{' ':<13}")
    print()

    if classical_time < quantum_time:
        print(f"🏆 WINNER: Classical ({classical_time/quantum_time:.1f}x faster)")
    else:
        print(f"🏆 WINNER: Quantum ({quantum_time/classical_time:.1f}x faster) 🚀")

    print()
    print(f"✅ Solution quality: {'EXACT MATCH' if np.array_equal(best_allocation, quantum_allocation) else 'DIFFERENT'}")

except ImportError as e:
    print(f"❌ Qiskit not available: {e}")
    print("   Install with: pip install qiskit")
    sys.exit(1)

print()
print("="*90)
print("BENCHMARK COMPLETE")
print("="*90)
