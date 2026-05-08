"""Time period analysis - Test quantum vs classical in different market regimes.

This script analyzes how quantum optimization performs during different market conditions:
- Crisis periods (2007-2010): High volatility, correlations break down
- Recent markets (2000-2025): Modern market structure
- Full history (1928-2025): Long-term perspective

The goal is to understand if quantum advantage varies with market regime.
"""

import sys
import asyncio
import json
import logging
import time
import csv
import io
from pathlib import Path
from datetime import datetime
import traceback

# Add scripts dir to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from run_track_b_market_benchmark import _run_distributed_benchmark

logging.getLogger("qiskit").setLevel(logging.WARNING)

def filter_csv_by_year_range(csv_bytes: bytes, start_year: int, end_year: int) -> bytes:
    """Filter CSV data to only include rows within the specified year range."""
    input_stream = io.StringIO(csv_bytes.decode('utf-8'))
    output_stream = io.StringIO()

    reader = csv.reader(input_stream)
    writer = csv.writer(output_stream)

    # Copy header
    header = next(reader)
    writer.writerow(header)

    rows_included = 0
    for row in reader:
        # Date is in first column, format: YYYY-MM-DD
        date_str = row[0]
        year = int(date_str.split('-')[0])

        if start_year <= year <= end_year:
            writer.writerow(row)
            rows_included += 1

    output_stream.seek(0)
    result = output_stream.getvalue().encode('utf-8')

    print(f"  Filtered to {start_year}-{end_year}: {rows_included} data points")

    return result

def print_header():
    """Print benchmark header."""
    print("="*100)
    print("TIME PERIOD ANALYSIS - QUANTUM PERFORMANCE ACROSS MARKET REGIMES")
    print("Using Professor Aswath Damodaran's NYU Historical Returns Dataset")
    print("="*100)
    print("\nOBJECTIVE: Understand quantum performance in different market conditions")
    print("- Crisis period (2007-2010): Financial crisis, high volatility")
    print("- Recent markets (2000-2025): Modern market structure")
    print("- Full history (1928-2025): Long-term perspective")
    print("="*100)

def create_time_period_configs():
    """Create configurations for different time periods."""
    # Use consistent parameters across periods for fair comparison
    base_config = {
        'max_assets': 5,  # Medium scale - good for comparison
        'peers': 20,
        'steps': 6,
    }

    periods = [
        {
            **base_config,
            'period_name': 'Financial Crisis',
            'start_year': 2007,
            'end_year': 2010,
            'description': 'High volatility, correlation breakdown',
        },
        {
            **base_config,
            'period_name': 'Dot-com Era',
            'start_year': 1998,
            'end_year': 2002,
            'description': 'Tech bubble and crash',
        },
        {
            **base_config,
            'period_name': 'Recent Markets',
            'start_year': 2000,
            'end_year': 2025,
            'description': 'Modern market structure (25 years)',
        },
        {
            **base_config,
            'period_name': 'Post-War Era',
            'start_year': 1950,
            'end_year': 1980,
            'description': 'Stable growth period',
        },
        {
            **base_config,
            'period_name': 'Full History',
            'start_year': 1928,
            'end_year': 2025,
            'description': 'Complete dataset (98 years)',
        },
    ]

    return periods

async def run_period_benchmark(config: dict, csv_bytes: bytes, idx: int, total: int) -> dict:
    """Run benchmark for a specific time period."""
    print(f"\n{'─'*100}")
    print(f"TIME PERIOD {idx}/{total}: {config['period_name']} ({config['start_year']}-{config['end_year']})")
    print(f"  Description: {config['description']}")
    print(f"  Portfolio size: {config['max_assets']} assets")
    print(f"  Quantum nodes: {config['peers']}")
    print(f"  Parameter steps: {config['steps']}")
    print(f"{'─'*100}")

    start = time.time()

    try:
        # Filter CSV to time period
        filtered_csv = filter_csv_by_year_range(
            csv_bytes,
            config['start_year'],
            config['end_year']
        )

        benchmark = await _run_distributed_benchmark(
            csv_bytes=filtered_csv,
            filename=f"histretSP_{config['start_year']}_{config['end_year']}.csv",
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

        # Extract quality metrics
        comparison = benchmark.get('comparison_report', {})
        classical_result = comparison.get('classical_result', {})
        quantum_result = comparison.get('quantum_result', {})

        result = {
            'period_config': config,
            'elapsed_seconds': elapsed,
            'timings': timings,
            'scorecard': scorecard,
            'classical_ms': classical_ms,
            'quantum_ms': quantum_ms,
            'ratio': ratio,
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'quality_metrics': {
                'classical_sharpe': classical_result.get('sharpe_ratio'),
                'quantum_sharpe': quantum_result.get('sharpe_ratio'),
                'classical_return': classical_result.get('expected_return'),
                'quantum_return': quantum_result.get('expected_return'),
                'classical_volatility': classical_result.get('volatility'),
                'quantum_volatility': quantum_result.get('volatility'),
            }
        }

        return result

    except Exception as e:
        elapsed = time.time() - start
        print(f"\nERROR: Benchmark failed after {elapsed:.2f}s")
        print(f"Error: {e}")
        traceback.print_exc()

        return {
            'period_config': config,
            'elapsed_seconds': elapsed,
            'success': False,
            'error': str(e),
            'error_traceback': traceback.format_exc(),
            'timestamp': datetime.now().isoformat(),
        }

def print_period_summary(results: list[dict]):
    """Print time period analysis summary."""
    print(f"\n{'='*100}")
    print("TIME PERIOD ANALYSIS SUMMARY")
    print(f"{'='*100}\n")

    # Main results table
    print(f"{'Period':<20} {'Years':<15} {'Classical(ms)':<15} {'Quantum(ms)':<15} {'Ratio':<10} {'Winner':<12}")
    print(f"{'-'*100}")

    successful_results = [r for r in results if r.get('success')]
    failed_results = [r for r in results if not r.get('success')]

    for result in successful_results:
        cfg = result['period_config']
        period_str = f"{cfg['start_year']}-{cfg['end_year']}"
        classical_ms = result['classical_ms']
        quantum_ms = result['quantum_ms']
        ratio = result['ratio']

        winner = "QUANTUM" if ratio > 0 and ratio < 1 else "Classical"
        winner_display = f"** {winner} **" if winner == "QUANTUM" else winner

        print(f"{cfg['period_name']:<20} {period_str:<15} "
              f"{classical_ms:<15.1f} {quantum_ms:<15.1f} {ratio:<10.3f} {winner_display:<12}")

    for result in failed_results:
        cfg = result['period_config']
        period_str = f"{cfg['start_year']}-{cfg['end_year']}"
        print(f"{cfg['period_name']:<20} {period_str:<15} {'ERROR':<15} {'-':<15} {'-':<10} {'-':<12}")

    # Market regime analysis
    print(f"\n{'='*100}")
    print("MARKET REGIME INSIGHTS")
    print(f"{'='*100}\n")

    if successful_results:
        # Find which regime quantum performs best
        best_quantum_perf = min(successful_results, key=lambda r: r['ratio'])
        worst_quantum_perf = max(successful_results, key=lambda r: r['ratio'])

        print(f"BEST QUANTUM PERFORMANCE:")
        print(f"  Period: {best_quantum_perf['period_config']['period_name']} "
              f"({best_quantum_perf['period_config']['start_year']}-{best_quantum_perf['period_config']['end_year']})")
        print(f"  Ratio: {best_quantum_perf['ratio']:.3f}x")
        if best_quantum_perf['ratio'] < 1:
            print(f"  Speedup: {1/best_quantum_perf['ratio']:.2f}x FASTER")
        else:
            print(f"  Still slower by {best_quantum_perf['ratio']:.2f}x")

        print(f"\nWORST QUANTUM PERFORMANCE:")
        print(f"  Period: {worst_quantum_perf['period_config']['period_name']} "
              f"({worst_quantum_perf['period_config']['start_year']}-{worst_quantum_perf['period_config']['end_year']})")
        print(f"  Ratio: {worst_quantum_perf['ratio']:.3f}x")

        # Quality comparison across periods
        print(f"\nSOLUTION QUALITY ACROSS PERIODS:")
        print(f"{'Period':<20} {'Classical Sharpe':<18} {'Quantum Sharpe':<18} {'Quality':<15}")
        print(f"{'-'*80}")

        for result in successful_results:
            qm = result.get('quality_metrics', {})
            c_sharpe = qm.get('classical_sharpe', 0) or 0
            q_sharpe = qm.get('quantum_sharpe', 0) or 0

            if c_sharpe and q_sharpe:
                diff = abs(c_sharpe - q_sharpe)
                if diff < 0.01:
                    quality = "Similar"
                elif q_sharpe > c_sharpe:
                    quality = "Quantum better"
                else:
                    quality = "Classical better"

                print(f"{result['period_config']['period_name']:<20} "
                      f"{c_sharpe:<18.4f} {q_sharpe:<18.4f} {quality:<15}")

        # Insights
        print(f"\nKEY INSIGHTS:")
        quantum_wins = [r for r in successful_results if r['ratio'] < 1]
        if quantum_wins:
            print(f"  Quantum achieved advantage in {len(quantum_wins)}/{len(successful_results)} periods")
            for win in quantum_wins:
                cfg = win['period_config']
                print(f"    - {cfg['period_name']} ({cfg['start_year']}-{cfg['end_year']}): "
                      f"{1/win['ratio']:.2f}x faster")
        else:
            print(f"  Classical won in all {len(successful_results)} time periods tested")
            print(f"  This suggests quantum overhead dominates at this scale (5 assets)")

def save_results(results: list[dict], output_path: Path):
    """Save comprehensive results to JSON."""
    output = {
        'metadata': {
            'benchmark_name': 'Time Period Analysis - Market Regime Study',
            'dataset': 'Professor Aswath Damodaran NYU Historical Returns',
            'timestamp': datetime.now().isoformat(),
            'objective': 'Understand quantum performance across different market conditions',
            'total_periods': len(results),
            'successful_runs': sum(1 for r in results if r.get('success')),
            'failed_runs': sum(1 for r in results if not r.get('success')),
        },
        'results': results,
        'regime_analysis': analyze_regimes(results),
    }

    output_path.write_text(json.dumps(output, indent=2))
    print(f"\n{'='*100}")
    print(f"RESULTS SAVED TO: {output_path}")
    print(f"{'='*100}\n")

def analyze_regimes(results: list[dict]) -> dict:
    """Analyze performance across different market regimes."""
    successful = [r for r in results if r.get('success')]

    if not successful:
        return {'error': 'No successful runs to analyze'}

    analysis = {
        'best_quantum_period': None,
        'worst_quantum_period': None,
        'quantum_advantage_periods': [],
        'regime_comparison': [],
    }

    # Find best and worst quantum performance
    best = min(successful, key=lambda r: r['ratio'])
    worst = max(successful, key=lambda r: r['ratio'])

    analysis['best_quantum_period'] = {
        'period': best['period_config']['period_name'],
        'years': f"{best['period_config']['start_year']}-{best['period_config']['end_year']}",
        'ratio': best['ratio'],
        'speedup': 1/best['ratio'] if best['ratio'] < 1 else None,
    }

    analysis['worst_quantum_period'] = {
        'period': worst['period_config']['period_name'],
        'years': f"{worst['period_config']['start_year']}-{worst['period_config']['end_year']}",
        'ratio': worst['ratio'],
    }

    # Find periods where quantum wins
    for result in successful:
        if result['ratio'] < 1:
            analysis['quantum_advantage_periods'].append({
                'period': result['period_config']['period_name'],
                'years': f"{result['period_config']['start_year']}-{result['period_config']['end_year']}",
                'speedup': 1/result['ratio'],
            })

        # Regime comparison
        analysis['regime_comparison'].append({
            'period': result['period_config']['period_name'],
            'description': result['period_config']['description'],
            'years': f"{result['period_config']['start_year']}-{result['period_config']['end_year']}",
            'quantum_ms': result['quantum_ms'],
            'classical_ms': result['classical_ms'],
            'ratio': result['ratio'],
            'quantum_won': result['ratio'] < 1,
        })

    return analysis

async def main():
    """Main benchmark execution."""
    print_header()

    # Load full dataset
    csv_path = Path(__file__).parents[2] / 'benchmark-data' / 'damodaran' / 'histretSP.csv'
    if not csv_path.exists():
        print(f"ERROR: CSV file not found: {csv_path}")
        sys.exit(1)

    csv_bytes = csv_path.read_bytes()
    print(f"\nFull dataset loaded: histretSP.csv (1928-2025)")

    # Create period configurations
    periods = create_time_period_configs()
    print(f"Time periods to test: {len(periods)}")

    # Run benchmarks
    results = []
    start_time = time.time()

    for idx, config in enumerate(periods, 1):
        result = await run_period_benchmark(
            config=config,
            csv_bytes=csv_bytes,
            idx=idx,
            total=len(periods)
        )
        results.append(result)

    total_elapsed = time.time() - start_time

    # Print summary
    print_period_summary(results)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = Path(__file__).parents[2] / 'benchmark-data' / f'damodaran_time_period_analysis_{timestamp}.json'
    save_results(results, output_path)

    print(f"\nTotal benchmark time: {total_elapsed:.2f}s ({total_elapsed/60:.1f} minutes)")
    print(f"\n{'='*100}\n")

if __name__ == '__main__':
    asyncio.run(main())
