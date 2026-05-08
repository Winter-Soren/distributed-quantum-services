"""Extended Damodaran benchmark - Multi-scale analysis to find quantum advantage crossover.

This script runs comprehensive benchmarks across multiple portfolio sizes to identify
where quantum computing becomes competitive with classical optimization.
"""

import sys
import asyncio
import json
import logging
import time
from pathlib import Path
from datetime import datetime
import traceback

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from run_track_b_market_benchmark import _run_distributed_benchmark

logging.getLogger("qiskit").setLevel(logging.WARNING)

def print_header():
    """Print benchmark header."""
    print("="*100)
    print("EXTENDED QUANTUM VS CLASSICAL PORTFOLIO OPTIMIZATION BENCHMARK")
    print("Using Professor Aswath Damodaran's NYU Historical Returns Dataset")
    print("="*100)
    print("\nOBJECTIVE: Find quantum advantage crossover point")
    print("- Testing portfolio sizes: 3-7 assets (all available)")
    print("- Analyzing scaling behavior of classical vs quantum approaches")
    print("- Identifying where quantum becomes competitive")
    print("="*100)

def get_csv_data(csv_path: Path) -> bytes:
    """Load CSV data with error handling."""
    if not csv_path.exists():
        print(f"ERROR: CSV file not found: {csv_path}")
        print("Run: python scripts/convert_damodaran_to_csv.py")
        sys.exit(1)
    return csv_path.read_bytes()

def create_test_configurations():
    """Create comprehensive test configurations for scaling analysis.

    Returns configurations that balance quality and performance:
    - Start with 3 assets (baseline)
    - Scale up to 7 assets (full dataset)
    - Moderate node counts (15-25) to see quantum coordination
    - Parameter steps (5-7) for reasonable search quality
    """
    configs = [
        # Baseline - small scale
        {'max_assets': 3, 'peers': 15, 'steps': 5, 'description': 'Baseline (expected: classical wins)'},

        # Medium scale - where things get interesting
        {'max_assets': 4, 'peers': 18, 'steps': 6, 'description': 'Medium-small scale'},
        {'max_assets': 5, 'peers': 20, 'steps': 6, 'description': 'Medium scale'},

        # Larger scale - potential quantum advantage
        {'max_assets': 6, 'peers': 23, 'steps': 7, 'description': 'Medium-large scale'},
        {'max_assets': 7, 'peers': 25, 'steps': 7, 'description': 'Full dataset (potential quantum advantage)'},
    ]
    return configs

async def run_single_benchmark(config: dict, csv_bytes: bytes, filename: str, idx: int, total: int) -> dict:
    """Run a single benchmark configuration."""
    print(f"\n{'─'*100}")
    print(f"CONFIGURATION {idx}/{total}: {config['description']}")
    print(f"  Portfolio size: {config['max_assets']} assets")
    print(f"  Quantum nodes: {config['peers']}")
    print(f"  Parameter steps: {config['steps']}")
    print(f"  Search space: {config['steps']}^2 = {config['steps']**2} combinations")
    print(f"{'─'*100}")

    start = time.time()

    try:
        benchmark = await _run_distributed_benchmark(
            csv_bytes=csv_bytes,
            filename=filename,
            peer_count=config['peers'],
            max_assets_considered=config['max_assets'],
            parameter_search_steps=config['steps'],
            budget=None,
        )

        elapsed = time.time() - start
        timings = benchmark.get('timings', {})
        scorecard = benchmark.get('comparison_report', {}).get('scorecard', {})

        classical_ms = timings.get('classical_end_to_end_duration_ms', 0)
        quantum_ms = timings.get('quantum_end_to_end_duration_ms', 0)
        ratio = quantum_ms / classical_ms if classical_ms > 0 else 0

        print(f"\n✅ COMPLETED in {elapsed:.2f}s")
        print(f"   Classical time: {classical_ms:.1f}ms")
        print(f"   Quantum time: {quantum_ms:.1f}ms")
        print(f"   Ratio (Q/C): {ratio:.3f}x")
        print(f"   Winner: {scorecard.get('winner_by_runtime', 'unknown')}")

        if ratio > 0 and ratio < 1:
            speedup = 1/ratio
            print(f"   QUANTUM {speedup:.2f}× FASTER!")
        elif ratio >= 1:
            slowdown = ratio
            print(f"   Quantum {slowdown:.2f}× slower")
        else:
            print(f"   Unable to compute speedup")

        # Extract more detailed metrics
        result = {
            'config': config,
            'elapsed_seconds': elapsed,
            'timings': timings,
            'scorecard': scorecard,
            'classical_ms': classical_ms,
            'quantum_ms': quantum_ms,
            'ratio': ratio,
            'success': True,
            'timestamp': datetime.now().isoformat(),
        }

        # Add quality metrics if available
        comparison = benchmark.get('comparison_report', {})
        if comparison:
            result['quality_metrics'] = {
                'classical_sharpe': comparison.get('classical_result', {}).get('sharpe_ratio'),
                'quantum_sharpe': comparison.get('quantum_result', {}).get('sharpe_ratio'),
                'classical_return': comparison.get('classical_result', {}).get('expected_return'),
                'quantum_return': comparison.get('quantum_result', {}).get('expected_return'),
            }

        return result

    except Exception as e:
        elapsed = time.time() - start
        print(f"\nERROR: Benchmark failed after {elapsed:.2f}s")
        print(f"Error: {e}")
        traceback.print_exc()

        return {
            'config': config,
            'elapsed_seconds': elapsed,
            'success': False,
            'error': str(e),
            'error_traceback': traceback.format_exc(),
            'timestamp': datetime.now().isoformat(),
        }

def print_scaling_summary(results: list[dict]):
    """Print comprehensive scaling analysis summary."""
    print(f"\n{'='*100}")
    print("SCALING ANALYSIS SUMMARY - QUANTUM ADVANTAGE CROSSOVER STUDY")
    print(f"{'='*100}\n")

    # Main results table
    print(f"{'Assets':<8} {'Nodes':<8} {'Steps':<8} {'Classical(ms)':<15} {'Quantum(ms)':<15} {'Ratio':<10} {'Winner':<12}")
    print(f"{'-'*100}")

    successful_results = [r for r in results if r.get('success')]
    failed_results = [r for r in results if not r.get('success')]

    for result in successful_results:
        cfg = result['config']
        classical_ms = result['classical_ms']
        quantum_ms = result['quantum_ms']
        ratio = result['ratio']

        winner = "QUANTUM" if ratio > 0 and ratio < 1 else "Classical"
        winner_display = f"** {winner} **" if winner == "QUANTUM" else winner

        print(f"{cfg['max_assets']:<8} {cfg['peers']:<8} {cfg['steps']:<8} "
              f"{classical_ms:<15.1f} {quantum_ms:<15.1f} {ratio:<10.3f} {winner_display:<12}")

    for result in failed_results:
        cfg = result['config']
        print(f"{cfg['max_assets']:<8} {cfg['peers']:<8} {cfg['steps']:<8} {'ERROR':<15} {'-':<15} {'-':<10} {'-':<12}")

    # Analysis section
    print(f"\n{'='*100}")
    print("SCALING BEHAVIOR ANALYSIS")
    print(f"{'='*100}\n")

    if successful_results:
        # Find crossover point
        quantum_wins = [r for r in successful_results if r['ratio'] < 1]

        if quantum_wins:
            first_win = quantum_wins[0]
            print(f"QUANTUM ADVANTAGE FOUND!")
            print(f"  First crossover at: {first_win['config']['max_assets']} assets")
            print(f"  Speedup: {1/first_win['ratio']:.2f}x faster")
            print(f"  Quantum time: {first_win['quantum_ms']:.1f}ms")
            print(f"  Classical time: {first_win['classical_ms']:.1f}ms")
        else:
            print(f"NO QUANTUM ADVANTAGE FOUND in tested range (3-7 assets)")
            print(f"  Classical won at all scales tested")
            print(f"  Maximum scale tested: 7 assets")
            print(f"  Recommendation: Test larger portfolios (8+ assets)")

        # Scaling trends
        print(f"\nSCALING TRENDS:")
        print(f"  Portfolio Size  ->  Classical Time  ->  Quantum Time  ->  Trend")
        print(f"  {'-'*70}")

        for i, result in enumerate(successful_results):
            cfg = result['config']
            trend = ""
            if i > 0:
                prev = successful_results[i-1]
                classical_growth = result['classical_ms'] / prev['classical_ms']
                quantum_growth = result['quantum_ms'] / prev['quantum_ms']

                if quantum_growth < classical_growth:
                    trend = "Quantum scaling better"
                elif quantum_growth > classical_growth:
                    trend = "Classical scaling better"
                else:
                    trend = "Similar scaling"

            print(f"  {cfg['max_assets']} assets      {result['classical_ms']:>10.1f}ms  "
                  f"{result['quantum_ms']:>10.1f}ms  {trend}")

        # Quality comparison
        print(f"\nSOLUTION QUALITY:")
        quality_available = any(r.get('quality_metrics') for r in successful_results)
        if quality_available:
            print(f"  Assets  Classical Sharpe  Quantum Sharpe  Quality Comparison")
            print(f"  {'-'*65}")
            for result in successful_results:
                if result.get('quality_metrics'):
                    qm = result['quality_metrics']
                    c_sharpe = qm.get('classical_sharpe', 0)
                    q_sharpe = qm.get('quantum_sharpe', 0)
                    comparison = "Similar" if abs(c_sharpe - q_sharpe) < 0.01 else \
                                ("Quantum better" if q_sharpe > c_sharpe else "Classical better")
                    print(f"  {result['config']['max_assets']:<6} {c_sharpe:>15.4f}  {q_sharpe:>14.4f}  {comparison}")
        else:
            print(f"  Quality metrics not available")

        # Parameter search overhead
        print(f"\nPARAMETER SEARCH OVERHEAD ANALYSIS:")
        print(f"  Assets  Search Space  Quantum Time  Overhead per Point")
        print(f"  {'-'*60}")
        for result in successful_results:
            cfg = result['config']
            search_space = cfg['steps'] ** 2
            time_per_point = result['quantum_ms'] / search_space
            print(f"  {cfg['max_assets']:<6} {search_space:>12}  {result['quantum_ms']:>12.1f}ms  {time_per_point:>17.2f}ms")

def save_results(results: list[dict], output_path: Path):
    """Save comprehensive results to JSON."""
    output = {
        'metadata': {
            'benchmark_name': 'Extended Damodaran Scaling Analysis',
            'dataset': 'Professor Aswath Damodaran NYU Historical Returns (1928-2025)',
            'timestamp': datetime.now().isoformat(),
            'objective': 'Find quantum advantage crossover point',
            'total_configurations': len(results),
            'successful_runs': sum(1 for r in results if r.get('success')),
            'failed_runs': sum(1 for r in results if not r.get('success')),
        },
        'results': results,
        'scaling_analysis': analyze_scaling(results),
    }

    output_path.write_text(json.dumps(output, indent=2))
    print(f"\n{'='*100}")
    print(f"RESULTS SAVED TO: {output_path}")
    print(f"{'='*100}\n")

def analyze_scaling(results: list[dict]) -> dict:
    """Analyze scaling behavior and return structured insights."""
    successful = [r for r in results if r.get('success')]

    if not successful:
        return {'error': 'No successful runs to analyze'}

    analysis = {
        'quantum_advantage_found': False,
        'crossover_point': None,
        'scaling_trends': [],
    }

    for result in successful:
        if result['ratio'] < 1:
            analysis['quantum_advantage_found'] = True
            if not analysis['crossover_point']:
                analysis['crossover_point'] = {
                    'assets': result['config']['max_assets'],
                    'speedup': 1 / result['ratio'],
                    'quantum_ms': result['quantum_ms'],
                    'classical_ms': result['classical_ms'],
                }

    # Calculate scaling trends
    for i in range(1, len(successful)):
        prev = successful[i-1]
        curr = successful[i]

        classical_growth = curr['classical_ms'] / prev['classical_ms']
        quantum_growth = curr['quantum_ms'] / prev['quantum_ms']

        analysis['scaling_trends'].append({
            'from_assets': prev['config']['max_assets'],
            'to_assets': curr['config']['max_assets'],
            'classical_growth_factor': classical_growth,
            'quantum_growth_factor': quantum_growth,
            'quantum_scales_better': quantum_growth < classical_growth,
        })

    return analysis

async def main():
    """Main benchmark execution."""
    print_header()

    # Load dataset
    csv_path = Path(__file__).parents[2] / 'benchmark-data' / 'damodaran' / 'histretSP.csv'
    csv_bytes = get_csv_data(csv_path)

    print(f"\nDataset loaded: histretSP.csv")
    print(f"Period: 1928-2025 (98 years)")
    print(f"Asset classes: 7 (SP500, Small Cap, T-Bills, T-Bonds, Baa Bonds, Real Estate, Gold)")

    # Create test configurations
    configs = create_test_configurations()
    print(f"\nTotal configurations to test: {len(configs)}")

    # Run benchmarks
    results = []
    start_time = time.time()

    for idx, config in enumerate(configs, 1):
        result = await run_single_benchmark(
            config=config,
            csv_bytes=csv_bytes,
            filename='histretSP.csv',
            idx=idx,
            total=len(configs)
        )
        results.append(result)

    total_elapsed = time.time() - start_time

    # Print summary
    print_scaling_summary(results)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = Path(__file__).parents[2] / 'benchmark-data' / f'damodaran_extended_benchmark_{timestamp}.json'
    save_results(results, output_path)

    print(f"\nTotal benchmark time: {total_elapsed:.2f}s ({total_elapsed/60:.1f} minutes)")
    print(f"\n{'='*100}\n")

if __name__ == '__main__':
    asyncio.run(main())
