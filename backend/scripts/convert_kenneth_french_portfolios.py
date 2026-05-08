#!/usr/bin/env python3
"""Convert Kenneth French 100 Portfolios dataset to benchmark format.

This script:
1. Parses the Kenneth French daily returns CSV
2. Converts returns to cumulative price series
3. Generates subsets (10, 20, 50, 100 portfolios)
4. Saves in format compatible with quantum benchmark pipeline
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime

# Kenneth French data format
HEADER_ROWS = 19  # Skip metadata rows
MISSING_VALUES = [-99.99, -999]  # Indicators for missing data

def load_kenneth_french_portfolios(csv_path, max_portfolios=100):
    """Load and parse Kenneth French 100 Portfolios CSV.

    Args:
        csv_path: Path to 100_Portfolios_10x10_Daily.csv
        max_portfolios: Maximum number of portfolios to load (1-100)

    Returns:
        DataFrame with date index and portfolio columns
    """
    print(f"Loading Kenneth French dataset: {csv_path}")

    # Read CSV, skipping header rows
    df = pd.read_csv(csv_path, skiprows=HEADER_ROWS)

    # First column is date (YYYYMMDD format)
    # Remaining columns are portfolio returns
    date_col = df.columns[0]
    portfolio_cols = df.columns[1:101]  # 100 portfolios

    # Convert date column
    df[date_col] = pd.to_datetime(df[date_col].astype(str), format='%Y%m%d', errors='coerce')

    # Filter out rows with invalid dates (footer text)
    df = df[df[date_col].notna()].copy()

    # Set date as index
    df.set_index(date_col, inplace=True)

    # Convert returns to numeric, handling missing values
    for col in portfolio_cols[:max_portfolios]:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        # Replace missing value indicators with NaN
        df.loc[df[col].isin(MISSING_VALUES), col] = np.nan

    # Select only the portfolios we want
    df = df[portfolio_cols[:max_portfolios]]

    # Drop rows with any NaN values
    initial_rows = len(df)
    df = df.dropna()
    dropped_rows = initial_rows - len(df)

    print(f"  Loaded {len(df)} daily observations")
    print(f"  Portfolios: {len(df.columns)}")
    print(f"  Date range: {df.index.min()} to {df.index.max()}")
    print(f"  Dropped {dropped_rows} rows with missing data")

    return df

def convert_returns_to_prices(returns_df, initial_price=100.0):
    """Convert percentage returns to cumulative price series.

    Args:
        returns_df: DataFrame with percentage returns (e.g., 0.52 = 0.52%)
        initial_price: Starting price for all portfolios

    Returns:
        DataFrame with cumulative prices
    """
    print(f"\nConverting returns to prices (initial = ${initial_price})")

    # Convert percentage returns to multiplicative factors
    # Return of 0.52% becomes factor of 1.0052
    factors = 1 + (returns_df / 100.0)

    # Cumulative product for each column
    prices = factors.cumprod() * initial_price

    print(f"  Price range: ${prices.min().min():.2f} to ${prices.max().max():.2f}")

    return prices

def filter_time_period(prices_df, start_date=None, end_date=None):
    """Filter data to specific time period.

    Args:
        prices_df: DataFrame with date index
        start_date: Start date (string or datetime), None = earliest
        end_date: End date (string or datetime), None = latest

    Returns:
        Filtered DataFrame
    """
    if start_date:
        start_date = pd.to_datetime(start_date)
        prices_df = prices_df[prices_df.index >= start_date]
        print(f"  Filtered to start: {start_date}")

    if end_date:
        end_date = pd.to_datetime(end_date)
        prices_df = prices_df[prices_df.index <= end_date]
        print(f"  Filtered to end: {end_date}")

    return prices_df

def save_benchmark_csv(prices_df, output_path, description=""):
    """Save prices as CSV for quantum benchmark pipeline.

    Args:
        prices_df: DataFrame with date index and portfolio columns
        output_path: Output CSV file path
        description: Optional description for filename
    """
    # Rename columns to simpler format
    prices_df.columns = [f'Portfolio_{i+1:03d}' for i in range(len(prices_df.columns))]

    # Save CSV
    prices_df.to_csv(output_path)

    file_size = Path(output_path).stat().st_size
    print(f"\n✅ Saved: {output_path}")
    print(f"   Size: {file_size / 1024:.1f} KB")
    print(f"   Rows: {len(prices_df)} days")
    print(f"   Columns: {len(prices_df.columns)} portfolios")
    if description:
        print(f"   Description: {description}")

def main():
    """Main conversion workflow."""
    print("="*80)
    print("KENNETH FRENCH 100 PORTFOLIOS CONVERTER")
    print("="*80)

    # Paths
    data_dir = Path(__file__).parents[2] / 'benchmark-data' / 'massive'
    input_csv = data_dir / '100_Portfolios_10x10_Daily.csv'
    output_dir = data_dir / 'converted'
    output_dir.mkdir(exist_ok=True)

    if not input_csv.exists():
        print(f"❌ Input file not found: {input_csv}")
        print("   Run the download script first!")
        sys.exit(1)

    # Configuration: Generate multiple subsets
    configs = [
        {
            'name': 'kenneth_french_10_portfolios_recent_5y',
            'portfolios': 10,
            'start_date': '2021-01-01',
            'end_date': None,
            'description': '10 portfolios, recent 5 years (2021-2026)'
        },
        {
            'name': 'kenneth_french_20_portfolios_recent_5y',
            'portfolios': 20,
            'start_date': '2021-01-01',
            'end_date': None,
            'description': '20 portfolios, recent 5 years (2021-2026)'
        },
        {
            'name': 'kenneth_french_50_portfolios_recent_10y',
            'portfolios': 50,
            'start_date': '2016-01-01',
            'end_date': None,
            'description': '50 portfolios, recent 10 years (2016-2026)'
        },
        {
            'name': 'kenneth_french_100_portfolios_recent_10y',
            'portfolios': 100,
            'start_date': '2016-01-01',
            'end_date': None,
            'description': '100 portfolios, recent 10 years (2016-2026)'
        },
        {
            'name': 'kenneth_french_50_portfolios_full_history',
            'portfolios': 50,
            'start_date': None,
            'end_date': None,
            'description': '50 portfolios, full 100-year history (1926-2026)'
        },
    ]

    print(f"\nConfigurations to generate: {len(configs)}")
    for i, cfg in enumerate(configs, 1):
        print(f"  {i}. {cfg['name']}: {cfg['portfolios']} portfolios")

    # Process each configuration
    for idx, config in enumerate(configs, 1):
        print(f"\n{'─'*80}")
        print(f"CONFIGURATION {idx}/{len(configs)}: {config['name']}")
        print(f"{'─'*80}")

        try:
            # Load returns
            returns_df = load_kenneth_french_portfolios(
                input_csv,
                max_portfolios=config['portfolios']
            )

            # Filter time period
            if config['start_date'] or config['end_date']:
                returns_df = filter_time_period(
                    returns_df,
                    start_date=config['start_date'],
                    end_date=config['end_date']
                )

            # Convert to prices
            prices_df = convert_returns_to_prices(returns_df)

            # Save
            output_path = output_dir / f"{config['name']}.csv"
            save_benchmark_csv(prices_df, output_path, config['description'])

            print(f"✅ SUCCESS")

        except Exception as e:
            print(f"❌ FAILED: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n{'='*80}")
    print(f"CONVERSION COMPLETE")
    print(f"{'='*80}")
    print(f"\nOutput directory: {output_dir}")
    print(f"\nNext step: Run benchmarks with these datasets!")
    print(f"  python scripts/run_damodaran_quick.py --dataset {output_dir}/kenneth_french_10_portfolios_recent_5y.csv")

if __name__ == '__main__':
    main()
