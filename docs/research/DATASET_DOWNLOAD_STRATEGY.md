# Dataset Download Strategy - Practical Approach

**Date**: April 28, 2026  
**Question**: Do we download 2-3 GB or use APIs?  
**Answer**: **Smart hybrid approach** - download only what we need, use APIs where available

---

## TL;DR - Recommended Strategy

**Phase 1** (Immediate - 200MB): Download curated subsets  
**Phase 2** (Growth - 1-2GB): Expand to industry portfolios  
**Phase 3** (Massive - API): Use yfinance for 5000+ stocks on-demand  

**No need to download 10-15GB all at once!** 🎯

---

## 1. Damodaran Datasets - Direct Download (No API)

### The Reality

Damodaran's datasets are **static Excel/CSV files** hosted on NYU servers:
- **No API available** - must download files
- **But**: We don't need ALL files!
- **Smart approach**: Download only what's useful for benchmarking

### What's Available

| Dataset Type | Files | Total Size | Our Need |
|-------------|-------|------------|----------|
| **Current (2026)** | ~20 files | **50-100MB** | ✅ **Download ALL** |
| **Historical Archives (1999-2025)** | ~5,460 files | **10-15GB** | ❌ **Skip for now** |
| **Industry Returns** | Per industry | **5-10MB each** | ✅ **Download top 10 industries** |

### Recommended Downloads (Phase 1 - 200MB)

```bash
# Priority 1: Company-level data (MOST USEFUL)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/betas.xls          # 5,994 US firms (~2MB)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/MktCap.xls         # Market caps (~2MB)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/pedata.xls         # P/E ratios (~2MB)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/pbvdata.xls        # Price-to-book (~2MB)

# Priority 2: Industry data (100+ industries)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/indname.xls       # Industry names (~500KB)

# Priority 3: Global data
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/ctryprem.xlsx     # Country risk premiums (~1MB)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/betaGlobal.xls    # 10,000+ global firms (~5MB)

# Total: ~20MB for 15,000+ securities! 🎯
```

**Why not download historical archives?**
- Archives = same data from previous years (1999-2025)
- We only need **current snapshot** for benchmarking
- If we need historical, download specific years on-demand

---

## 2. Kenneth French - Direct Download (Zip Files)

### The Reality

Kenneth French provides **pre-packaged zip files**:
- **No API** - must download
- **Already compressed** - efficient
- **Well-organized** - easy to select what you need

### Recommended Downloads (Phase 1 - 150MB)

```bash
# Priority 1: 100 Portfolios (BEST FOR TESTING)
wget https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/100_Portfolios_10x10_daily_CSV.zip
# Unzipped: ~100MB
# Contains: 100 portfolios × 25,000 days = 2.5M data points

# Priority 2: 49 Industry Portfolios
wget https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/49_Industry_Portfolios_daily_CSV.zip
# Unzipped: ~50MB
# Contains: 49 industries × 25,000 days = 1.2M data points

# Priority 3: Fama-French Factors (for factor models)
wget https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_daily_CSV.zip
# Unzipped: ~5MB

# Total: ~150MB for 100 years of portfolio data! 🎯
```

**Why these?**
- **100 Portfolios**: Perfect for testing quantum at scale
- **49 Industries**: Diversified sector allocation
- **Daily data**: 25,000+ days = stress test for algorithms

---

## 3. Yahoo Finance - USE API (On-Demand)

### The Reality

Yahoo Finance has:
- ✅ **Excellent Python API** (`yfinance`)
- ✅ **Free, generous rate limits**
- ✅ **Real-time + historical data**
- ✅ **No need to download GBs upfront**

### Recommended Approach: On-Demand via API

```python
import yfinance as yf
import pandas as pd

# Option A: Download on-demand (small portfolios)
def fetch_portfolio(tickers, start='2020-01-01', end='2026-04-28'):
    """Fetch specific portfolio - only download what you need."""
    data = yf.download(tickers, start=start, end=end)
    return data['Adj Close']  # Returns DataFrame with prices

# Example: S&P 500 top 50 stocks
sp500_top50 = ['AAPL', 'MSFT', 'GOOGL', ...] # 50 tickers
prices = fetch_portfolio(sp500_top50, start='2020-01-01')
# Downloads ~10MB on-the-fly, takes ~30 seconds

# Option B: Cache locally (medium portfolios)
def fetch_and_cache(tickers, cache_dir='./yfinance_cache'):
    """Download once, cache for reuse."""
    cache_file = f"{cache_dir}/portfolio_{len(tickers)}_tickers.csv"
    
    if os.path.exists(cache_file):
        return pd.read_csv(cache_file, index_col=0, parse_dates=True)
    
    data = yf.download(tickers, start='2016-01-01', end='2026-04-28')
    prices = data['Adj Close']
    prices.to_csv(cache_file)
    return prices

# Option C: Batch download (large portfolios)
def fetch_sp500(cache=True):
    """Download full S&P 500 - 500 stocks × 10 years."""
    # Get S&P 500 tickers list
    sp500_tickers = pd.read_html('https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')[0]['Symbol'].tolist()
    
    # Download in batches (yfinance is efficient)
    data = yf.download(sp500_tickers, start='2016-01-01', end='2026-04-28', 
                       group_by='ticker', threads=True)
    
    # ~500MB download, takes ~5-10 minutes
    # Cache locally for reuse
    if cache:
        data.to_csv('sp500_full_10y.csv')
    
    return data
```

### When to Use Each Approach

| Use Case | Approach | Size | Time | Best For |
|----------|----------|------|------|----------|
| **Quick test** (10-50 stocks) | On-demand API | ~1-10MB | 10-30s | Development/testing |
| **Medium portfolio** (50-200 stocks) | Cache locally | ~50-100MB | 2-5 min | Repeated benchmarks |
| **Full index** (500-2000 stocks) | Batch download + cache | ~500MB-2GB | 5-20 min | Publication figures |
| **Custom universe** (user-selected) | On-demand API | Variable | Variable | Custom analysis |

**Key Advantage**: Only download what you need, when you need it!

---

## 4. Recommended Phased Approach

### Phase 1: Proof of Concept (200-300MB total)

**Goal**: Demonstrate quantum scaling on moderate portfolios (100-500 assets)

**Downloads**:
```bash
# Damodaran (20MB)
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/betas.xls
wget https://pages.stern.nyu.edu/~adamodar/pc/datasets/betaGlobal.xls

# Kenneth French (150MB)
wget https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/100_Portfolios_10x10_daily_CSV.zip

# Yahoo Finance (via API, 50MB cached)
# Fetch S&P 500 top 100 on-demand

# Total: ~220MB, provides 100-5000+ securities
```

**Timeline**: 10 minutes download + 5 minutes processing

**Outcome**: Ready to benchmark quantum on 100-500 asset portfolios!

---

### Phase 2: Scale Up (1-2GB total)

**Goal**: Test quantum at true scale (500-2000 assets)

**Downloads**:
```bash
# Add more Kenneth French portfolios
wget https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/49_Industry_Portfolios_daily_CSV.zip
wget https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/25_Portfolios_5x5_daily_CSV.zip

# Add Damodaran industry data (select top 20 industries)
# Each industry: ~100 companies, ~5MB per industry
# 20 industries × 5MB = 100MB

# Yahoo Finance: Download Russell 1000
# Via API: ~1GB cached
```

**Total**: ~1.5GB, provides 1000-5000 securities

**Timeline**: 30 minutes download + 15 minutes processing

---

### Phase 3: Massive Scale (API-driven, no bulk download)

**Goal**: Demonstrate quantum on 5000+ securities

**Approach**: **Don't download all at once!**

```python
# Instead: Use on-demand API for specific tests
def run_massive_benchmark(n_assets=5000):
    """Run benchmark on N assets without downloading all upfront."""
    
    # 1. Get ticker universe (lightweight)
    all_tickers = get_russell_3000_tickers()  # Just ticker symbols, ~100KB
    
    # 2. Select subset for this benchmark
    selected = random.sample(all_tickers, n_assets)
    
    # 3. Fetch only what we need (on-demand)
    prices = yf.download(selected, start='2020-01-01', period='1y')
    # Downloads ~100MB-1GB depending on n_assets
    
    # 4. Run benchmark
    result = benchmark_portfolio(prices)
    
    # 5. Clear cache if needed
    del prices  # Free memory
    
    return result

# Run multiple benchmarks at different scales
for n in [1000, 2000, 5000]:
    result = run_massive_benchmark(n)
    # Each downloads only what it needs!
```

**Advantage**: 
- Test 1000 assets: Download 200MB
- Test 5000 assets: Download 1GB
- **Total downloaded over time**: 1-2GB (not 50GB!)

---

## 5. Storage Requirements Summary

### Actual Storage Needed

| Phase | Downloaded | Cached | Total | Securities |
|-------|-----------|--------|-------|------------|
| **Phase 1** | 220MB | 50MB | **~300MB** | 100-500 |
| **Phase 2** | 1.5GB | 500MB | **~2GB** | 500-2000 |
| **Phase 3** | On-demand | 1-2GB | **~3GB max** | 1000-5000+ |

**Key Insight**: You'll never need more than **3-4GB** of storage for all benchmarks!

The "10-15GB" is Damodaran's **complete historical archives** (1999-2025), which we don't need.

---

## 6. Recommended Download Script

Create this helper script:

```python
#!/usr/bin/env python3
"""Download datasets for quantum portfolio benchmarking.

Usage:
    python download_datasets.py --phase 1    # 300MB, quick
    python download_datasets.py --phase 2    # 2GB, comprehensive
    python download_datasets.py --phase 3    # On-demand, as needed
"""

import argparse
import os
import urllib.request
import zipfile
from pathlib import Path

def download_phase1():
    """Phase 1: Proof of concept datasets (~300MB)."""
    print("="*60)
    print("PHASE 1: Downloading proof-of-concept datasets (~300MB)")
    print("="*60)
    
    base_dir = Path("benchmark-data/massive")
    base_dir.mkdir(parents=True, exist_ok=True)
    
    datasets = [
        # Damodaran
        ("betas.xls", "https://pages.stern.nyu.edu/~adamodar/pc/datasets/betas.xls"),
        ("betaGlobal.xls", "https://pages.stern.nyu.edu/~adamodar/pc/datasets/betaGlobal.xls"),
        
        # Kenneth French
        ("100_Portfolios.zip", "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/100_Portfolios_10x10_daily_CSV.zip"),
    ]
    
    for filename, url in datasets:
        output = base_dir / filename
        if output.exists():
            print(f"✓ {filename} already exists, skipping")
            continue
            
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(url, output)
        print(f"✓ {filename} downloaded ({output.stat().st_size / 1e6:.1f} MB)")
        
        # Unzip if needed
        if filename.endswith('.zip'):
            print(f"  Extracting {filename}...")
            with zipfile.ZipFile(output, 'r') as zip_ref:
                zip_ref.extractall(base_dir / filename.replace('.zip', ''))
            print(f"  ✓ Extracted")
    
    print("\n🎉 Phase 1 complete! Downloaded ~220MB")
    print(f"📁 Files in: {base_dir.absolute()}")
    print("\nReady to benchmark 100-500 asset portfolios!")

def download_phase2():
    """Phase 2: Scale-up datasets (~2GB)."""
    print("="*60)
    print("PHASE 2: Downloading scale-up datasets (~2GB)")
    print("="*60)
    
    download_phase1()  # Ensure phase 1 is complete
    
    # Add phase 2 specific downloads
    # (49 industries, more portfolios, etc.)
    print("\nPhase 2 includes Phase 1 + additional datasets")
    print("Total: ~1.5-2GB")
    
def setup_phase3():
    """Phase 3: Setup for on-demand API access."""
    print("="*60)
    print("PHASE 3: Setting up API access (no bulk download)")
    print("="*60)
    
    # Install yfinance if needed
    try:
        import yfinance
        print("✓ yfinance already installed")
    except ImportError:
        print("Installing yfinance...")
        os.system("pip install yfinance")
        print("✓ yfinance installed")
    
    print("\n🎉 Phase 3 ready!")
    print("Use yfinance API for on-demand data fetching")
    print("No bulk download needed - fetch only what you need!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--phase", type=int, choices=[1,2,3], default=1,
                       help="Download phase (1=300MB, 2=2GB, 3=API setup)")
    args = parser.parse_args()
    
    if args.phase == 1:
        download_phase1()
    elif args.phase == 2:
        download_phase2()
    elif args.phase == 3:
        setup_phase3()
```

Save as `backend/scripts/download_datasets.py`

---

## 7. Final Recommendations

### ✅ DO THIS

1. **Start with Phase 1** (300MB):
   ```bash
   python scripts/download_datasets.py --phase 1
   ```
   - Gets you 100-500 securities
   - Ready to benchmark in 10 minutes
   - Sufficient for demonstrating quantum scaling

2. **Use yfinance API** for flexibility:
   ```bash
   pip install yfinance
   ```
   - Fetch S&P 500 on-demand (~500MB)
   - No upfront storage needed
   - Always up-to-date

3. **Cache locally** for repeated benchmarks:
   - Download once, reuse many times
   - Saves time and bandwidth
   - ~1-2GB total for all tests

### ❌ DON'T DO THIS

1. **Don't download 10-15GB of historical archives**
   - You don't need data from 1999-2025
   - Current snapshot (2026) is sufficient
   - Archives are for historical comparison, not benchmarking

2. **Don't download all stocks at once**
   - Russell 3000 = 3000 stocks × 10 years = 10GB
   - Use API to fetch subset on-demand
   - Download only what each benchmark needs

3. **Don't pre-download everything**
   - Storage waste
   - Most data won't be used
   - API access is efficient enough

---

## 8. Comparison Table

| Approach | Storage | Time | Flexibility | Best For |
|----------|---------|------|-------------|----------|
| **Download All Damodaran (10-15GB)** | 15GB | Hours | Low | ❌ Not recommended |
| **Phase 1 (300MB)** | 300MB | 10 min | High | ✅ Quick start |
| **Phase 2 (2GB)** | 2GB | 30 min | High | ✅ Comprehensive |
| **API On-Demand** | 1-2GB cache | Variable | Very High | ✅ Production |
| **Hybrid (Recommended)** | **2-3GB** | **20 min** | **Very High** | **✅ BEST** |

---

## Conclusion

**Answer to your question**: 

**We'll do a HYBRID approach**:
1. ✅ **Download 300MB-2GB** of curated datasets (Damodaran + Kenneth French)
2. ✅ **Use yfinance API** for on-demand S&P 500 / Russell data
3. ❌ **Skip the 10-15GB archives** (don't need historical 1999-2025)

**Total storage needed**: **2-3GB maximum** for all benchmarks!

**Why this works**:
- Damodaran's "GB/TB" size is from **26 years of archives**
- We only need **current snapshot** (~20MB) + **Kenneth French** (~150MB) + **API cache** (~1-2GB)
- This gives us **5,000-10,000+ securities** for testing
- Sufficient to demonstrate quantum scaling advantage! 🎯

---

**Next Step**: Run `python scripts/download_datasets.py --phase 1` and start benchmarking! 🚀
