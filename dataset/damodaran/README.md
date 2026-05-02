# Professor Aswath Damodaran's Historical Returns Dataset

## Overview

This directory contains Professor Aswath Damodaran's renowned historical returns datasets from NYU Stern School of Business. These datasets are the gold standard in finance education and are used worldwide in MBA programs for teaching portfolio theory, asset allocation, and risk management.

## Datasets

### 1. Historical Returns (histretSP.xls)
**Coverage**: 1928-2025 (97 years)  
**Last Updated**: January 5, 2026  
**Source**: https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls

**Asset Classes**:
- **S&P 500** (with dividends) - Large-cap US equities
- **US Small Cap** (bottom decile) - Small-cap US equities  
- **3-month T-Bills** - Risk-free rate proxy
- **US Treasury Bonds** (10-year) - Government bonds
- **Baa Corporate Bonds** - Investment-grade corporate debt
- **Real Estate** - Real Estate Investment Trusts (REITs)
- **Gold** - Commodity and inflation hedge

**Data Format**: Annual returns as percentages

### 2. Implied Equity Risk Premiums (histimpl.xls)
**Coverage**: 1960-2025 (66 years)  
**Last Updated**: January 2026  
**Source**: https://www.stern.nyu.edu/~adamodar/pc/datasets/histimpl.xls

**Metrics**:
- Earnings Yield and Dividend Yield
- S&P 500 index values
- Treasury Bond rates  
- Smoothed Growth rates
- Implied Equity Risk Premium (ERP)

## Historical Significance

This dataset captures nearly a century of market history including all major economic events:

### Major Events Captured

| Period | Event | Significance |
|--------|-------|--------------|
| 1929-1939 | Great Depression | Most severe market downturn in history |
| 1945-1970 | Post-WWII Boom | Extended period of economic growth |
| 1970s | Stagflation | High inflation combined with low growth |
| 1987 | Black Monday | Single largest one-day market crash |
| 1990s-2000 | Dot-com Bubble | Technology speculation and crash |
| 2008 | Financial Crisis | Global banking system failure |
| 2020 | COVID-19 Pandemic | Global health crisis and market volatility |
| 2021-2025 | Post-Pandemic | Monetary policy shifts and inflation concerns |

## Usage in Quantum Benchmarking

### Why This Dataset?

1. **Academic Credibility**: Maintained by a renowned finance professor, used in top business schools globally
2. **Long Time Horizon**: 97 years provides statistical significance for portfolio optimization
3. **Diverse Market Conditions**: Captures bull markets, bear markets, crashes, and recoveries
4. **Asset Class Diversity**: Stocks, bonds, real estate, and commodities enable true diversification
5. **Peer-Reviewed**: Data methodology is documented and validated by academic community

### Benchmark Applications

#### 1. Portfolio Optimization
Test quantum vs classical approaches for:
- **Strategic Asset Allocation**: Long-term portfolio construction
- **Tactical Asset Allocation**: Market timing and rebalancing
- **Risk-Adjusted Returns**: Sharpe ratio optimization
- **Drawdown Minimization**: Tail risk management

#### 2. Historical Backtesting
- **Out-of-Sample Testing**: Split data into training and test periods
- **Crisis Resilience**: Test portfolio performance during market downturns
- **Regime Analysis**: Compare performance across different market environments
- **Rolling Windows**: Simulate real-time portfolio management

#### 3. Scaling Analysis
- **Classical Complexity**: C(N,K) combinations grow exponentially
- **Quantum Advantage**: QAOA parameter search remains constant
- **Crossover Point**: Identify where quantum outperforms classical
- **Node Scaling**: Test distributed quantum execution efficiency

## Data Processing

### Conversion to Price Series

The original dataset contains annual returns as percentages. For portfolio optimization, we convert these to cumulative price indices:

```python
# Starting value: $100 invested at beginning of 1928
# For each year with return R%:
Price_t = Price_{t-1} × (1 + R/100)
```

This allows direct calculation of:
- **Total Return**: Price_end / Price_start - 1
- **Volatility**: Standard deviation of price changes
- **Correlations**: Covariance between asset price movements
- **Risk Metrics**: Value-at-Risk, Conditional VaR, Maximum Drawdown

### Data Quality

**Advantages**:
- ✅ No survivorship bias
- ✅ Dividend-adjusted returns for equities
- ✅ Consistent methodology across entire period
- ✅ Regular updates and corrections
- ✅ Transparent data sources

**Limitations**:
- Annual frequency only (no monthly/daily data)
- US-centric (limited international exposure)
- Index-level data (no individual securities)
- Historical data may not predict future performance

## Running Benchmarks

### Basic Usage

```bash
# Full history, single configuration
python scripts/benchmark_damodaran_dataset.py \
  --time-period full \
  --max-assets 5 \
  --peer-count 20

# Recent period, multiple scales
python scripts/benchmark_damodaran_dataset.py \
  --time-period recent \
  --run-multiple-scales \
  --peer-count 30 \
  --parameter-search-steps 7

# Financial crisis analysis
python scripts/benchmark_damodaran_dataset.py \
  --time-period crisis \
  --max-assets 4 \
  --peer-count 15
```

### Time Period Options

| Option | Years | Data Points | Use Case |
|--------|-------|-------------|----------|
| `full` | 1928-2025 | 97 | Long-term strategic allocation |
| `modern` | 1980-2025 | 45 | Contemporary portfolio construction |
| `recent` | 2000-2025 | 25 | Recent historical validation |
| `decade` | 2015-2025 | 10 | Last decade performance |
| `crisis` | 2007-2010 | 3 | Financial crisis stress test |
| `depression` | 1929-1940 | 11 | Great Depression analysis |

### Output Files

- **damodaran_benchmark_results.json**: Multi-scale comprehensive results
- **damodaran_benchmark_{period}.json**: Single-period detailed results

### Visualization

```bash
# Analyze and visualize results
python scripts/visualize_damodaran_results.py \
  --results benchmark-data/damodaran_benchmark_results.json
```

## Research Applications

### 1. Algorithm Development
- QAOA parameter tuning strategies
- Circuit depth vs accuracy tradeoffs
- Distributed execution optimization
- Quantum error mitigation techniques

### 2. Performance Attribution
- Return decomposition across asset classes
- Factor exposure analysis
- Risk contribution by asset
- Attribution to market conditions

### 3. Risk Management
- Tail risk analysis using crisis periods
- Drawdown minimization strategies
- Value-at-Risk (VaR) optimization
- Stress testing against historical scenarios

### 4. Comparative Analysis
- Quantum vs classical solution quality
- Computational complexity scaling
- Time-to-solution comparison
- Resource utilization efficiency

## Academic References

### Primary Source
**Damodaran, Aswath** (2026). "Historical Returns on Stocks, Bonds and Bills: 1928-2025"  
NYU Stern School of Business  
URL: https://pages.stern.nyu.edu/~adamodar/

### Related Literature

1. **Markowitz, H.** (1952). "Portfolio Selection"  
   *The Journal of Finance*, 7(1), 77-91  
   DOI: 10.2307/2975974

2. **Sharpe, W. F.** (1964). "Capital Asset Prices: A Theory of Market Equilibrium under Conditions of Risk"  
   *The Journal of Finance*, 19(3), 425-442

3. **Farhi, E., Goldstone, J., Gutmann, S.** (2014). "A Quantum Approximate Optimization Algorithm"  
   arXiv:1411.4028

4. **Egger, D.J., et al.** (2020). "Quantum Computing for Finance: State of the Art and Future Prospects"  
   *IEEE Transactions on Quantum Engineering*, Vol. 1

## Data License and Usage

### Terms of Use

Professor Damodaran generously makes this data available for:
- ✅ Educational purposes
- ✅ Academic research
- ✅ Non-commercial analysis

### Attribution

When using this dataset, please cite:

```bibtex
@misc{damodaran2026historical,
  author = {Damodaran, Aswath},
  title = {Historical Returns on Stocks, Bonds and Bills: 1928-2025},
  year = {2026},
  institution = {NYU Stern School of Business},
  url = {https://pages.stern.nyu.edu/~adamodar/}
}
```

### Commercial Use

For commercial applications, consult the data provider's terms at:
https://pages.stern.nyu.edu/~adamodar/New_Home_Page/data.html

## Data Updates

### Update Schedule
- **Major updates**: Early January each year (typically January 5-10)
- **Minor corrections**: Throughout the year as needed
- **Methodology changes**: Documented in update notes

### Checking for Updates

```bash
# Download latest version
curl -L -o benchmark-data/damodaran/histretSP_new.xls \
  "https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls"

# Compare file sizes and dates
ls -lh benchmark-data/damodaran/histretSP*.xls
```

## Support and Questions

### Dataset Questions
- **Website**: https://pages.stern.nyu.edu/~adamodar/
- **Data Documentation**: Available on the data download page
- **Methodology Papers**: Linked from SSRN on the website

### Benchmark Implementation
- **GitHub Issues**: Report bugs or request features in the repository
- **Documentation**: See `/docs/research/DAMODARAN_BENCHMARK_ANALYSIS.md`

## Contributing

Contributions to improve the benchmark framework are welcome:

1. **Bug Reports**: File issues for data processing errors
2. **Feature Requests**: Suggest new analysis methods
3. **Documentation**: Improve usage guides and examples
4. **Code**: Submit PRs for optimization improvements

## Changelog

### 2026-04-28
- ✅ Initial benchmark implementation
- ✅ Support for all historical periods
- ✅ Multi-scale testing capability
- ✅ Comprehensive result visualization

---

**Last Updated**: April 28, 2026  
**Dataset Version**: January 2026  
**Benchmark Framework**: v2.0
