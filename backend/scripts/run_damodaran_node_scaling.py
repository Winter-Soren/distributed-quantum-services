"""Node scaling benchmark for Damodaran dataset - tests 5, 10, 50 quantum nodes.

This benchmark validates:
1. Data flows correctly through the quantum pipeline
2. Node scaling effects on performance
3. Comparison with existing benchmarks in BENCHMARK.md
"""

import sys
import asyncio
import json
import logging
import time
from pathlib import Path
from datetime import datetime

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from run_track_b_market_benchmark import _run_distributed_benchmark

logging.getLogger("qiskit").setLevel(logging.WARNING)

print("="*100)
print("NODE SCALING BENCHMARK - DAMODARAN DATASET")
print("Professor Aswath Damodaran's Historical Returns (1928-2025)")
print("="*100)
print("\nOBJECTIVE: Test quantum node scaling effects on portfolio optimization")
print("- Compare 5, 10, 50 quantum nodes")
print("- Verify data pipeline integrity")
print("- Analyze performance breakdown")
print("- Compare with BENCHMARK.md results")
print("="*100)

# Read the CSV
csv_path = Path(__file__).parents[2] / 'benchmark-data' / 'damodaran' / 'histretSP.csv'
if not csv_path.exists():
    print(f"❌ CSV file not found: {csv_path}")
    sys.exit(1)

csv_bytes = csv_path.read_bytes()
print(f"\n✅ Dataset loaded: {csv_path.name}")
print(f"   Size: {len(csv_bytes)} bytes")
print(f"   Period: 1928-2025 (98 years)")
print(f"   Asset classes: 7 (SP500, Small Cap, T-Bills, T-Bonds, Baa Bonds, Real Estate, Gold)")

# Node scaling configurations
configs = [
    {
        'name': 'Baseline (5 nodes)',
        'max_assets': 4,
        'peers': 5,
        'steps': 5,
        'description': 'Baseline configuration - minimal nodes'
    },
    {
        'name': 'Medium Scale (10 nodes)',
        'max_assets': 4,
        'peers': 10,
        'steps': 5,
        'description': '2x node scaling'
    },
    {
        'name': 'Large Scale (50 nodes)',
        'max_assets': 4,
        'peers': 50,
        'steps': 5,
        'description': '10x node scaling'
    },
]

print(f"\n{'='*100}")
print(f"CONFIGURATIONS TO TEST: {len(configs)}")
print(f"{'='*100}")
for idx, cfg in enumerate(configs, 1):
    print(f"{idx}. {cfg['name']}")
    print(f"   Assets: {cfg['max_assets']}, Nodes: {cfg['peers']}, Steps: {cfg['steps']}")
    print(f"   {cfg['description']}")

results = []

for idx, config in enumerate(configs, 1):
    print(f"\n{'─'*100}")
    print(f"CONFIGURATION {idx}/{len(configs)}: {config['name']}")
    print(f"{'─'*100}")
    print(f"  Portfolio size: {config['max_assets']} assets")
    print(f"  Quantum nodes: {config['peers']}")
    print(f"  Parameter steps: {config['steps']}")

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
        dataset = benchmark.get('dataset', {})

        # Extract key metrics
        classical_ms = timings.get('classical_end_to_end_duration_ms', 0)
        quantum_ms = timings.get('quantum_end_to_end_duration_ms', 0)
        param_search_ms = timings.get('quantum_parameter_search_duration_ms', 0)
        dist_exec_ms = timings.get('distributed_execution_duration_ms', 0)
        plan_compile_ms = timings.get('plan_compile_duration_ms', 0)

        fragments = benchmark.get('fragments_executed', 0)
        nodes_used = benchmark.get('distributed_nodes_used', 0)

        # Data validation
        selected_tickers = benchmark.get('selected_tickers', [])
        classical_bitstring = benchmark.get('classical_bitstring', '')
        quantum_bitstring = benchmark.get('quantum_bitstring_distributed', '')
        counts_match = benchmark.get('counts_match_classical', False)
        fidelity = benchmark.get('validation_statevector_fidelity', 0)

        print(f"\n✅ BENCHMARK COMPLETED in {elapsed:.2f}s")
        print(f"\n📊 PERFORMANCE METRICS:")
        print(f"   Classical time: {classical_ms}ms")
        print(f"   Quantum time: {quantum_ms}ms")
        print(f"   Speedup ratio: {quantum_ms/classical_ms if classical_ms > 0 else 0:.2f}x")

        print(f"\n⚡ QUANTUM BREAKDOWN:")
        print(f"   Parameter search: {param_search_ms}ms ({param_search_ms/quantum_ms*100 if quantum_ms > 0 else 0:.1f}%)")
        print(f"   Plan compilation: {plan_compile_ms}ms ({plan_compile_ms/quantum_ms*100 if quantum_ms > 0 else 0:.1f}%)")
        print(f"   Distributed execution: {dist_exec_ms}ms ({dist_exec_ms/quantum_ms*100 if quantum_ms > 0 else 0:.1f}%)")

        print(f"\n🌐 DISTRIBUTED EXECUTION:")
        print(f"   Fragments executed: {fragments}")
        print(f"   Nodes used: {nodes_used}")
        print(f"   Fragments per node: {fragments/nodes_used if nodes_used > 0 else 0:.1f}")

        print(f"\n✓ DATA PIPELINE VALIDATION:")
        print(f"   Assets selected: {len(selected_tickers)} → {selected_tickers}")
        print(f"   Dataset period: {dataset.get('start_date')} to {dataset.get('end_date')}")
        print(f"   Data points: {dataset.get('period_count', 0)} years")
        print(f"   Classical solution: {classical_bitstring}")
        print(f"   Quantum solution: {quantum_bitstring}")
        print(f"   Solutions match: {'✅ YES' if counts_match else '❌ NO'}")
        print(f"   Fidelity: {fidelity:.6f} {'✅' if fidelity > 0.99 else '⚠️'}")

        print(f"\n🏆 WINNER: {scorecard.get('winner_by_runtime', 'unknown')}")

        results.append({
            'config': config,
            'elapsed_seconds': elapsed,
            'timings': timings,
            'scorecard': scorecard,
            'dataset': dataset,
            'validation': {
                'selected_tickers': selected_tickers,
                'classical_bitstring': classical_bitstring,
                'quantum_bitstring': quantum_bitstring,
                'counts_match': counts_match,
                'fidelity': fidelity,
            },
            'distribution': {
                'fragments_executed': fragments,
                'nodes_used': nodes_used,
                'fragments_per_node': fragments/nodes_used if nodes_used > 0 else 0,
            },
            'benchmark_details': benchmark,
        })

    except Exception as e:
        print(f"\n❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        results.append({'config': config, 'error': str(e)})

# Comparative Analysis
print(f"\n{'='*100}")
print("COMPARATIVE ANALYSIS - NODE SCALING EFFECTS")
print(f"{'='*100}\n")

print(f"{'Configuration':<25} {'Nodes':<8} {'Classical':<12} {'Quantum':<12} {'Param':<12} {'DistExec':<12} {'Speedup':<10}")
print(f"{'':<25} {'':<8} {'(ms)':<12} {'(ms)':<12} {'(ms)':<12} {'(ms)':<12} {'vs Base':<10}")
print(f"{'-'*100}")

baseline_quantum = None
for result in results:
    if 'error' not in result:
        cfg = result['config']
        timings = result['timings']

        classical_ms = timings['classical_end_to_end_duration_ms']
        quantum_ms = timings['quantum_end_to_end_duration_ms']
        param_ms = timings.get('quantum_parameter_search_duration_ms', 0)
        dist_ms = timings.get('distributed_execution_duration_ms', 0)

        if baseline_quantum is None:
            baseline_quantum = quantum_ms
            speedup_str = "baseline"
        else:
            speedup = baseline_quantum / quantum_ms
            speedup_str = f"{speedup:.2f}x"

        print(f"{cfg['name']:<25} {cfg['peers']:<8} {classical_ms:<12.1f} {quantum_ms:<12.1f} "
              f"{param_ms:<12.1f} {dist_ms:<12.1f} {speedup_str:<10}")
    else:
        print(f"{result['config']['name']:<25} {'ERROR':<8} {'-':<12} {'-':<12} {'-':<12} {'-':<12} {'-':<10}")

# Scaling efficiency analysis
print(f"\n{'='*100}")
print("SCALING EFFICIENCY ANALYSIS")
print(f"{'='*100}\n")

if len([r for r in results if 'error' not in r]) >= 2:
    valid_results = [r for r in results if 'error' not in r]

    print("Distributed Execution Scaling:")
    base_dist = valid_results[0]['timings'].get('distributed_execution_duration_ms', 0)
    base_nodes = valid_results[0]['config']['peers']

    for result in valid_results[1:]:
        dist_ms = result['timings'].get('distributed_execution_duration_ms', 0)
        nodes = result['config']['peers']

        theoretical_speedup = nodes / base_nodes
        actual_speedup = base_dist / dist_ms if dist_ms > 0 else 0
        efficiency = (actual_speedup / theoretical_speedup * 100) if theoretical_speedup > 0 else 0

        print(f"  {base_nodes} → {nodes} nodes:")
        print(f"    Theoretical speedup: {theoretical_speedup:.1f}x")
        print(f"    Actual speedup: {actual_speedup:.2f}x")
        print(f"    Efficiency: {efficiency:.1f}%")
        print(f"    Time: {base_dist:.1f}ms → {dist_ms:.1f}ms")
        print()

# Data validation summary
print(f"{'='*100}")
print("DATA PIPELINE INTEGRITY CHECK")
print(f"{'='*100}\n")

all_valid = True
for idx, result in enumerate(results, 1):
    if 'error' not in result:
        validation = result['validation']
        print(f"{idx}. {result['config']['name']}:")
        print(f"   ✓ Assets selected: {len(validation['selected_tickers'])}")
        print(f"   ✓ Classical solution: {validation['classical_bitstring']}")
        print(f"   ✓ Quantum solution: {validation['quantum_bitstring']}")
        print(f"   ✓ Match: {'YES ✅' if validation['counts_match'] else 'NO ❌'}")
        print(f"   ✓ Fidelity: {validation['fidelity']:.6f} {'✅' if validation['fidelity'] > 0.99 else '⚠️'}")

        if not validation['counts_match'] or validation['fidelity'] < 0.99:
            all_valid = False
        print()

if all_valid:
    print("🎉 ALL BENCHMARKS PASSED DATA VALIDATION!")
else:
    print("⚠️  SOME BENCHMARKS FAILED DATA VALIDATION - REVIEW RESULTS")

# Save results
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_path = Path(__file__).parents[2] / 'benchmark-data' / f'damodaran_node_scaling_{timestamp}.json'
output_path.write_text(json.dumps(results, indent=2))
print(f"\n📁 Results saved to: {output_path}")

print(f"\n{'='*100}")
print("NODE SCALING BENCHMARK COMPLETE")
print(f"{'='*100}\n")
