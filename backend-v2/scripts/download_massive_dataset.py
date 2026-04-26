"""Download massive financial dataset for heavy quantum benchmarking.

Targets:
1. S&P 500 top 100 stocks (market cap weighted)
2. 5 years of daily price data
3. ~130,000 data points total

Sources:
- Yahoo Finance API (primary)
- Alternative: Kenneth French Data Library
- Alternative: NYU Stern historical data
"""

from __future__ import annotations

import csv
import io
import json
import logging
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

# Top 100 S&P 500 stocks by market cap (as of 2024)
SP500_TOP_100 = [
    # Mega-cap tech (FAANG+)
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    # Finance
    "BRK-B", "JPM", "V", "MA", "BAC", "WFC", "GS", "MS", "C", "AXP", "SCHW", "BLK",
    # Healthcare/Pharma
    "UNH", "JNJ", "LLY", "ABBV", "MRK", "PFE", "TMO", "ABT", "DHR", "CVS", "BMY", "AMGN",
    # Consumer
    "WMT", "HD", "PG", "KO", "PEP", "COST", "MCD", "NKE", "DIS", "CMCSA", "NFLX", "SBUX",
    # Energy
    "XOM", "CVX", "COP", "SLB", "EOG", "PXD", "MPC",
    # Industrials
    "BA", "CAT", "HON", "UNP", "RTX", "LMT", "GE", "MMM", "DE",
    # Tech (non-FAANG)
    "AVGO", "ORCL", "CSCO", "ADBE", "CRM", "INTC", "AMD", "TXN", "QCOM", "NOW",
    # Telecom
    "VZ", "T",
    # Misc
    "UPS", "NEE", "DUK", "SO", "AIG", "CB", "PGR", "TRV",
    # Biotech
    "GILD", "VRTX", "REGN", "BIIB",
    # Semiconductors
    "ASML", "TSM", "AMAT", "LRCX", "KLAC",
    # Retail
    "TGT", "LOW", "TJX", "ROST",
    # Additional top names
    "SPGI", "CME", "ICE", "MCO", "ISRG", "ZTS", "CI", "HUM",
]

YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
USER_AGENT = "QuantumPortfolioBenchmark/1.0"


def fetch_ticker_data(ticker: str, *, range_name: str = "5y", interval: str = "1d") -> list[dict[str, str]]:
    """Fetch historical price data for a single ticker."""
    params = urllib.parse.urlencode({
        "interval": interval,
        "range": range_name,
        "includeAdjustedClose": "true",
        "events": "div,splits",
    })
    url = YAHOO_CHART_ENDPOINT.format(ticker=urllib.parse.quote(ticker)) + f"?{params}"
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.load(response)

        result = payload.get("chart", {}).get("result") or []
        if not result:
            print(f"  ⚠️  No data returned for {ticker}")
            return []

        record = result[0]
        timestamps = record.get("timestamp") or []
        indicators = record.get("indicators", {})
        adjclose = (indicators.get("adjclose") or [{}])[0].get("adjclose")
        closes = (indicators.get("quote") or [{}])[0].get("close") or []
        values = adjclose or closes

        if not values or not timestamps:
            print(f"  ⚠️  Empty price series for {ticker}")
            return []

        rows = []
        for ts, price in zip(timestamps, values):
            if price is not None:
                dt = datetime.fromtimestamp(ts)
                rows.append({"date": dt.strftime("%Y-%m-%d"), "ticker": ticker, "price": f"{price:.2f}"})

        print(f"  ✅ {ticker}: {len(rows)} data points")
        return rows

    except Exception as e:
        print(f"  ❌ Failed to fetch {ticker}: {e}")
        return []


def build_wide_format_csv(ticker_data: dict[str, list[dict[str, str]]]) -> list[dict[str, str]]:
    """Convert ticker data to wide-format CSV (date × tickers)."""
    # Collect all unique dates
    all_dates = set()
    for rows in ticker_data.values():
        for row in rows:
            all_dates.add(row["date"])

    sorted_dates = sorted(all_dates)

    # Build date → ticker → price mapping
    price_map: dict[str, dict[str, str]] = {}
    for ticker, rows in ticker_data.items():
        for row in rows:
            date = row["date"]
            if date not in price_map:
                price_map[date] = {}
            price_map[date][ticker] = row["price"]

    # Only keep dates with data for ALL tickers (aligned)
    tickers = sorted(ticker_data.keys())
    aligned_rows = []
    for date in sorted_dates:
        if date in price_map and all(ticker in price_map[date] for ticker in tickers):
            row = {"date": date}
            row.update({ticker: price_map[date][ticker] for ticker in tickers})
            aligned_rows.append(row)

    return aligned_rows


def main() -> None:
    output_dir = Path(__file__).resolve().parents[2] / "benchmark-data"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "sp500_top100_5y_daily.csv"

    print(f"\n{'='*80}")
    print("DOWNLOADING MASSIVE FINANCIAL DATASET")
    print(f"{'='*80}")
    print(f"Target: Top 100 S&P 500 stocks")
    print(f"Period: 5 years daily data")
    print(f"Expected size: ~130,000 data points")
    print(f"Output: {output_file}")
    print(f"{'='*80}\n")

    ticker_data: dict[str, list[dict[str, str]]] = {}
    successful = 0
    failed = 0

    print(f"Fetching {len(SP500_TOP_100)} tickers...\n")

    for idx, ticker in enumerate(SP500_TOP_100, 1):
        print(f"[{idx}/{len(SP500_TOP_100)}] {ticker}")
        rows = fetch_ticker_data(ticker, range_name="5y", interval="1d")
        if rows:
            ticker_data[ticker] = rows
            successful += 1
        else:
            failed += 1
        time.sleep(0.5)  # Rate limiting

    print(f"\n{'─'*80}")
    print(f"Download Summary:")
    print(f"  ✅ Successful: {successful}")
    print(f"  ❌ Failed: {failed}")
    print(f"{'─'*80}\n")

    if not ticker_data:
        print("❌ No data downloaded. Exiting.")
        return

    # Convert to wide format (aligned dates)
    print("Building wide-format CSV (aligned dates only)...")
    wide_rows = build_wide_format_csv(ticker_data)

    if not wide_rows:
        print("❌ No aligned dates found. Exiting.")
        return

    # Write CSV
    tickers = sorted(ticker_data.keys())
    with output_file.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["date"] + tickers)
        writer.writeheader()
        writer.writerows(wide_rows)

    print(f"\n{'='*80}")
    print(f"✅ DATASET CREATED SUCCESSFULLY")
    print(f"{'='*80}")
    print(f"File: {output_file}")
    print(f"Tickers: {len(tickers)}")
    print(f"Aligned dates: {len(wide_rows)}")
    print(f"Total data points: {len(wide_rows) * len(tickers):,}")
    print(f"Date range: {wide_rows[0]['date']} to {wide_rows[-1]['date']}")
    print(f"File size: {output_file.stat().st_size / 1024:.1f} KB")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
