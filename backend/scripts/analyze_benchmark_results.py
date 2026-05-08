"""Analyze and visualize benchmark results.

This script creates comprehensive visualizations and analysis of the benchmark data:
- Scaling curves (classical vs quantum time)
- Crossover point identification
- Quality comparison
- Parameter search overhead analysis
"""

import json
import sys
from pathlib import Path
from datetime import datetime

try:
    import matplotlib.pyplot as plt
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("Warning: matplotlib not available. Skipping visualizations.")

def load_benchmark_results(filepath: Path) -> dict:
    """Load benchmark results from JSON file."""
    if not filepath.exists():
        print(f"Error: File not found: {filepath}")
        sys.exit(1)

    with open(filepath, 'r') as f:
        return json.load(f)

def analyze_scaling_behavior(results: list[dict]):
    """Analyze scaling behavior from benchmark results."""
    print("\n" + "="*80)
    print("SCALING BEHAVIOR ANALYSIS")
    print("="*80 + "\n")

    successful = [r for r in results if r.get('success')]

    if not successful:
        print("No successful results to analyze")
        return

    # Extract data
    assets = [r['config']['max_assets'] for r in successful]
    classical_times = [r['classical_ms'] for r in successful]
    quantum_times = [r['quantum_ms'] for r in successful]
    ratios = [r['ratio'] for r in successful]

    # Calculate growth rates
    print("Growth Rates:")
    print(f"{'From':<6} {'To':<6} {'Classical Growth':<20} {'Quantum Growth':<20} {'Better Scaling':<15}")
    print("-"*80)

    for i in range(1, len(successful)):
        c_growth = classical_times[i] / classical_times[i-1]
        q_growth = quantum_times[i] / quantum_times[i-1]
        better = "Quantum" if q_growth < c_growth else "Classical"

        print(f"{assets[i-1]:<6} {assets[i]:<6} {c_growth:<20.3f} {q_growth:<20.3f} {better:<15}")

    # Find crossover
    print("\nCrossover Analysis:")
    crossover_found = False
    for i, ratio in enumerate(ratios):
        if ratio < 1:
            print(f"  QUANTUM ADVANTAGE at {assets[i]} assets!")
            print(f"    Speedup: {1/ratio:.2f}x")
            print(f"    Quantum: {quantum_times[i]:.1f}ms")
            print(f"    Classical: {classical_times[i]:.1f}ms")
            crossover_found = True
            break

    if not crossover_found:
        print("  No quantum advantage found in tested range")
        print(f"  Best ratio: {min(ratios):.3f}x at {assets[ratios.index(min(ratios))]} assets")

        # Extrapolate to find potential crossover
        if len(ratios) >= 2:
            # Simple linear extrapolation
            last_ratio = ratios[-1]
            second_last_ratio = ratios[-2]
            ratio_improvement = second_last_ratio - last_ratio

            if ratio_improvement > 0:
                steps_to_crossover = (last_ratio - 1.0) / ratio_improvement
                extrapolated_assets = assets[-1] + int(steps_to_crossover) + 1

                print(f"\n  EXTRAPOLATION (rough estimate):")
                print(f"    Trend: Ratio improving by {ratio_improvement:.3f} per asset")
                print(f"    Estimated crossover: ~{extrapolated_assets} assets")
                print(f"    Note: This is a rough linear extrapolation")

    return {
        'assets': assets,
        'classical_times': classical_times,
        'quantum_times': quantum_times,
        'ratios': ratios,
        'crossover_found': crossover_found,
    }

def plot_scaling_curves(data: dict, output_dir: Path):
    """Create scaling curve plots."""
    if not HAS_MATPLOTLIB:
        print("\nSkipping plots (matplotlib not available)")
        return

    print("\nGenerating scaling plots...")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Quantum vs Classical Scaling Analysis - Damodaran Dataset', fontsize=16, fontweight='bold')

    assets = data['assets']
    classical_times = data['classical_times']
    quantum_times = data['quantum_times']
    ratios = data['ratios']

    # Plot 1: Absolute times
    ax1 = axes[0, 0]
    ax1.plot(assets, classical_times, 'o-', label='Classical', linewidth=2, markersize=8, color='blue')
    ax1.plot(assets, quantum_times, 's-', label='Quantum', linewidth=2, markersize=8, color='red')
    ax1.set_xlabel('Portfolio Size (assets)', fontsize=11)
    ax1.set_ylabel('Time (ms)', fontsize=11)
    ax1.set_title('Absolute Execution Time', fontsize=12, fontweight='bold')
    ax1.legend(fontsize=10)
    ax1.grid(True, alpha=0.3)

    # Plot 2: Log scale
    ax2 = axes[0, 1]
    ax2.semilogy(assets, classical_times, 'o-', label='Classical', linewidth=2, markersize=8, color='blue')
    ax2.semilogy(assets, quantum_times, 's-', label='Quantum', linewidth=2, markersize=8, color='red')
    ax2.set_xlabel('Portfolio Size (assets)', fontsize=11)
    ax2.set_ylabel('Time (ms, log scale)', fontsize=11)
    ax2.set_title('Execution Time (Log Scale)', fontsize=12, fontweight='bold')
    ax2.legend(fontsize=10)
    ax2.grid(True, alpha=0.3)

    # Plot 3: Quantum/Classical ratio
    ax3 = axes[1, 0]
    ax3.plot(assets, ratios, 'o-', linewidth=2, markersize=8, color='purple')
    ax3.axhline(y=1.0, color='green', linestyle='--', linewidth=2, label='Parity (Q=C)')
    ax3.fill_between(assets, 0, 1, alpha=0.2, color='green', label='Quantum Advantage')
    ax3.set_xlabel('Portfolio Size (assets)', fontsize=11)
    ax3.set_ylabel('Quantum/Classical Ratio', fontsize=11)
    ax3.set_title('Quantum Speedup Factor', fontsize=12, fontweight='bold')
    ax3.legend(fontsize=10)
    ax3.grid(True, alpha=0.3)

    # Plot 4: Growth rates
    ax4 = axes[1, 1]
    if len(assets) > 1:
        growth_points = assets[1:]
        classical_growth = [classical_times[i] / classical_times[i-1] for i in range(1, len(classical_times))]
        quantum_growth = [quantum_times[i] / quantum_times[i-1] for i in range(1, len(quantum_times))]

        ax4.plot(growth_points, classical_growth, 'o-', label='Classical', linewidth=2, markersize=8, color='blue')
        ax4.plot(growth_points, quantum_growth, 's-', label='Quantum', linewidth=2, markersize=8, color='red')
        ax4.axhline(y=1.0, color='gray', linestyle='--', alpha=0.5)
        ax4.set_xlabel('Portfolio Size (assets)', fontsize=11)
        ax4.set_ylabel('Growth Factor', fontsize=11)
        ax4.set_title('Scaling Growth Rate', fontsize=12, fontweight='bold')
        ax4.legend(fontsize=10)
        ax4.grid(True, alpha=0.3)

    plt.tight_layout()

    # Save plot
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    plot_path = output_dir / f'scaling_analysis_{timestamp}.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"  Saved: {plot_path}")

    plt.close()

def generate_summary_report(results_file: Path):
    """Generate comprehensive summary report."""
    print("\n" + "="*80)
    print("BENCHMARK ANALYSIS AND SUMMARY")
    print("="*80)

    data = load_benchmark_results(results_file)

    print(f"\nDataset: {data['metadata'].get('dataset', 'Unknown')}")
    print(f"Timestamp: {data['metadata'].get('timestamp', 'Unknown')}")
    print(f"Objective: {data['metadata'].get('objective', 'Unknown')}")
    print(f"\nTotal configurations: {data['metadata'].get('total_configurations', 0)}")
    print(f"Successful runs: {data['metadata'].get('successful_runs', 0)}")
    print(f"Failed runs: {data['metadata'].get('failed_runs', 0)}")

    # Analyze results
    results = data.get('results', [])
    scaling_data = analyze_scaling_behavior(results)

    # Generate plots
    if scaling_data:
        output_dir = results_file.parent
        plot_scaling_curves(scaling_data, output_dir)

    # Key findings
    print("\n" + "="*80)
    print("KEY FINDINGS")
    print("="*80 + "\n")

    scaling_analysis = data.get('scaling_analysis', {})

    if scaling_analysis.get('quantum_advantage_found'):
        crossover = scaling_analysis.get('crossover_point', {})
        print("QUANTUM ADVANTAGE DETECTED!")
        print(f"  Crossover point: {crossover.get('assets')} assets")
        print(f"  Speedup: {crossover.get('speedup', 0):.2f}x")
        print(f"  Quantum time: {crossover.get('quantum_ms', 0):.1f}ms")
        print(f"  Classical time: {crossover.get('classical_ms', 0):.1f}ms")
    else:
        print("NO QUANTUM ADVANTAGE in tested range")
        print("  Classical optimization won at all scales")
        print("  Recommendation: Test larger portfolios or optimize quantum overhead")

    # Scaling trends
    trends = scaling_analysis.get('scaling_trends', [])
    if trends:
        print("\nScaling Trends:")
        quantum_better_count = sum(1 for t in trends if t.get('quantum_scales_better', False))
        print(f"  Quantum scales better: {quantum_better_count}/{len(trends)} transitions")

        if quantum_better_count > 0:
            print("  Quantum scaling advantage detected - may win at larger scales")
        else:
            print("  Classical scaling better at all transitions")

    print("\n" + "="*80 + "\n")

def main():
    """Main analysis execution."""
    print("="*80)
    print("BENCHMARK RESULTS ANALYZER")
    print("="*80)

    # Find most recent benchmark file
    benchmark_dir = Path(__file__).parents[2] / 'benchmark-data'

    if len(sys.argv) > 1:
        results_file = Path(sys.argv[1])
    else:
        # Find most recent extended benchmark
        extended_files = list(benchmark_dir.glob('damodaran_extended_benchmark_*.json'))

        if not extended_files:
            print("\nNo benchmark files found!")
            print(f"Looking in: {benchmark_dir}")
            print("\nRun the benchmark first:")
            print("  python scripts/run_extended_damodaran_benchmark.py")
            sys.exit(1)

        results_file = max(extended_files, key=lambda p: p.stat().st_mtime)
        print(f"\nUsing most recent benchmark: {results_file.name}")

    # Generate report
    generate_summary_report(results_file)

    # Also analyze time period results if available
    time_period_files = list(benchmark_dir.glob('damodaran_time_period_analysis_*.json'))
    if time_period_files:
        print("\n" + "="*80)
        print("TIME PERIOD ANALYSIS AVAILABLE")
        print("="*80)
        most_recent = max(time_period_files, key=lambda p: p.stat().st_mtime)
        print(f"\nFound: {most_recent.name}")
        print("Run separately to analyze:")
        print(f"  python scripts/analyze_benchmark_results.py {most_recent}")

if __name__ == '__main__':
    main()
