#!/usr/bin/env python3
"""Download S&P 500 stock data via yfinance - this will be 500MB+!

This creates a truly massive dataset with individual company data.
"""

import sys
from pathlib import Path
import pandas as pd
import yfinance as yf
from datetime import datetime
import time

print("="*80)
print("S&P 500 MASSIVE DATASET DOWNLOADER (via yfinance)")
print("="*80)
print()

# Check if yfinance is installed
try:
    import yfinance as yf
except ImportError:
    print("❌ yfinance not installed!")
    print("   Installing now...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "yfinance"], check=True)
    import yfinance as yf
    print("✅ yfinance installed!")
    print()

# Get S&P 500 tickers from Wikipedia
print("📥 Fetching S&P 500 ticker list from Wikipedia...")
try:
    url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    sp500_table = pd.read_html(url)[0]
    tickers = sp500_table['Symbol'].tolist()
    print(f"✅ Found {len(tickers)} S&P 500 companies")
    print(f"   Sample: {tickers[:10]}")
    print()
except Exception as e:
    print(f"❌ Failed to fetch ticker list: {e}")
    print("   Using fallback list of top 50 companies...")
    tickers = [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
        'V', 'XOM', 'WMT', 'LLY', 'JPM', 'PG', 'MA', 'HD', 'CVX', 'MRK',
        'ABBV', 'KO', 'PEP', 'AVGO', 'COST', 'ADBE', 'MCD', 'TMO', 'CSCO', 'ACN',
        'ABT', 'NKE', 'CRM', 'DHR', 'VZ', 'NFLX', 'TXN', 'NEE', 'CMCSA', 'WFC',
        'DIS', 'INTC', 'AMD', 'PM', 'QCOM', 'UPS', 'BMY', 'HON', 'ORCL', 'IBM'
    ]

# Download configurations - Start with smaller ones first
configs = [
    {
        'name': 'sp500_top50_5y',
        'tickers': tickers[:50],
        'period': '5y',
        'description': 'Top 50 S&P 500, 5 years (~25MB)'
    },
    {
        'name': 'sp500_top100_5y',
        'tickers': tickers[:100],
        'period': '5y',
        'description': 'Top 100 S&P 500, 5 years (~50MB)'
    },
    {
        'name': 'sp500_top200_5y',
        'tickers': tickers[:200],
        'period': '5y',
        'description': 'Top 200 S&P 500, 5 years (~100MB)'
    },
    {
        'name': 'sp500_full_5y',
        'tickers': tickers,
        'period': '5y',
        'description': f'Full S&P 500 ({len(tickers)} stocks), 5 years (~250MB) 🚀'
    },
]

output_dir = Path(__file__).parents[2] / 'benchmark-data' / 'massive' / 'sp500'
output_dir.mkdir(exist_ok=True)

print(f"Output directory: {output_dir}")
print()
print(f"Configurations: {len(configs)}")
for i, cfg in enumerate(configs, 1):
    print(f"  {i}. {cfg['name']}: {len(cfg['tickers'])} stocks, {cfg['period']}")
print()

# Process each configuration
for idx, config in enumerate(configs, 1):
    print("─"*80)
    print(f"CONFIGURATION {idx}/{len(configs)}: {config['name']}")
    print("─"*80)
    print(f"  Stocks: {len(config['tickers'])}")
    print(f"  Period: {config['period']}")
    print()

    output_file = output_dir / f"{config['name']}.csv"

    if output_file.exists():
        print(f"  ⚠️  File already exists: {output_file.name}")
        size_mb = output_file.stat().st_size / (1024*1024)
        print(f"     Size: {size_mb:.1f} MB")
        print(f"  ✅ SKIPPING (already downloaded)")
        print()
        continue

    print(f"  📥 Downloading {len(config['tickers'])} stocks...")
    print(f"     This may take 5-15 minutes depending on size...")
    print()

    start_time = time.time()

    try:
        # Download with threading for speed
        data = yf.download(
            config['tickers'],
            period=config['period'],
            group_by='ticker',
            threads=True,
            progress=False  # Disable progress bar to keep output clean
        )

        if data.empty:
            print("  ❌ Download failed - no data returned")
            continue

        # Extract close prices
        if len(config['tickers']) == 1:
            # Single ticker
            if 'Close' in data.columns:
                prices = data['Close'].to_frame()
                prices.columns = config['tickers']
            else:
                prices = data[['Close']]
        else:
            # Multi-ticker format - extract 'Close' for each ticker
            prices = pd.DataFrame()
            for ticker in config['tickers']:
                if (ticker, 'Close') in data.columns:
                    prices[ticker] = data[(ticker, 'Close')]
                elif ticker in data.columns:
                    if 'Close' in data[ticker].columns:
                        prices[ticker] = data[ticker]['Close']

        # Drop any columns that are all NaN
        prices = prices.dropna(axis=1, how='all')

        # Drop any rows that are all NaN
        prices = prices.dropna(axis=0, how='all')

        elapsed = time.time() - start_time

        print(f"  ✅ Downloaded successfully in {elapsed:.1f}s")
        print(f"     Shape: {prices.shape[0]} days × {prices.shape[1]} stocks")
        print(f"     Date range: {prices.index.min()} to {prices.index.max()}")
        print(f"     Missing: {prices.columns.difference(config['tickers']).tolist() if len(config['tickers']) > len(prices.columns) else 'None'}")
        print()

        # Save to CSV
        print(f"  💾 Saving to {output_file.name}...")
        prices.to_csv(output_file)

        file_size_mb = output_file.stat().st_size / (1024*1024)
        print(f"  ✅ Saved: {file_size_mb:.1f} MB")
        print(f"     {config['description']}")
        print()

    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        print()

print("="*80)
print("DOWNLOAD COMPLETE")
print("="*80)
print()
print(f"📁 Output directory: {output_dir}")
print()

# Summary
print("Downloaded files:")
for file in sorted(output_dir.glob("*.csv")):
    size_mb = file.stat().st_size / (1024*1024)
    print(f"  ✓ {file.name}: {size_mb:.1f} MB")

total_size = sum(f.stat().st_size for f in output_dir.glob("*.csv"))
print()
print(f"🎉 Total: {total_size / (1024*1024):.1f} MB of S&P 500 data!")
print()
print("Next: Use these datasets for large-scale quantum benchmarks!")
