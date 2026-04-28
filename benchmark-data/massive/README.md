# Massive Dataset Collection

**Downloaded**: April 28, 2026  
**Total Size**: 104MB  
**Purpose**: Large-scale quantum vs classical portfolio optimization benchmarking

---

## Downloaded Datasets

### 1. Kenneth French - 100 Portfolios (Daily Returns)

**File**: `100_Portfolios_10x10_Daily.csv`  
**Size**: 88MB uncompressed  
**Source**: Dartmouth Tuck School of Business  
**Data points**: 104,793 daily observations  
**Coverage**: 100 portfolios (10×10 size/book-to-market intersections)  
**Time period**: July 1926 - March 2026 (100 years!)  
**Frequency**: Daily returns

**Structure**:
- 100 portfolios based on market equity (ME) and book-to-market (BE/ME) ratios
- Value-weighted returns
- Constructed using CRSP database
- Missing data indicated by -99.99

**Use case**: 
- Test quantum algorithm on 10-100 portfolios
- Massive time-series data for robust testing
- Industry-standard academic dataset

---

### 2. Damodaran - Industry Beta Estimates

**File**: `betas.xls`  
**Size**: 81KB  
**Source**: NYU Stern School of Business  
**Data points**: ~97 industry sectors  
**Updated**: January 2026  
**Sheets**: 
  - Explanations & FAQ
  - Industry Averages (97 industries)
  - Inputs (settings)

**Structure**:
- Industry-level aggregated data (not individual companies)
- Metrics: Beta, D/E Ratio, Effective Tax Rate, Unlevered Beta, etc.
- Includes total number of firms per industry

**Use case**:
- Industry portfolio construction
- Sector-level optimization
- Risk parameter estimation

---

### 3. Damodaran - Global Beta Estimates

**File**: `betaGlobal.xls`  
**Size**: 81KB  
**Source**: NYU Stern School of Business  
**Coverage**: Global markets (US + International)
**Data points**: Similar to US betas but global scope

**Structure**: Same as betas.xls but with international data

---

### 4. Damodaran - S&P 500 Historical Returns

**File**: `histretSP500.xls`  
**Size**: 516KB  
**Source**: NYU Stern School of Business  
**Coverage**: 1928-2025 (98 years)  
**Data points**: Annual returns for 7 asset classes

**Note**: This is the same dataset we already tested successfully!

---

## Summary Statistics

| Dataset | Size | Assets/Portfolios | Time Period | Data Points | Status |
|---------|------|-------------------|-------------|-------------|--------|
| **Kenneth French 100 Portfolios** | 88MB | 100 | 1926-2026 | 10.5M | ✅ Downloaded |
| **Damodaran Industry Betas** | 81KB | 97 | Current | ~97 | ✅ Downloaded |
| **Damodaran Global Betas** | 81KB | 97 | Current | ~97 | ✅ Downloaded |
| **Damodaran Historical Returns** | 516KB | 7 | 1928-2025 | 686 | ✅ Downloaded + Tested |

**Total**: **104MB** providing **100+ portfolios/assets** for large-scale testing

---

## Next Steps

### Immediate: Convert to Benchmark Format

1. **Kenneth French 100 Portfolios**:
   - Parse CSV (skip header rows)
   - Convert to price series (from returns)
   - Select subsets: 10, 20, 50, 100 portfolios
   - Run benchmarks at each scale

2. **Damodaran Industry Betas**:
   - Extract industry list
   - Use as portfolio weights/constraints
   - Combine with historical returns

### Future: Download More

**Phase 2 Targets** (not yet downloaded):
- Kenneth French 49 Industry Portfolios (~50MB)
- Kenneth French 25 Portfolios (~25MB)
- Damodaran Market Cap data
- Damodaran Valuation Multiples

**Phase 3 Targets** (API-based):
- S&P 500 via yfinance (~500MB)
- Russell 2000 via yfinance (~1-2GB)

---

## Benchmark Test Plan

### Small Scale (10 portfolios)
- **Dataset**: Kenneth French 100 (select first 10)
- **Time period**: Recent 5 years (2021-2026)
- **Expected**: Classical faster, baseline measurement

### Medium Scale (50 portfolios)
- **Dataset**: Kenneth French 100 (select 50)
- **Time period**: Recent 5 years
- **Expected**: Quantum starting to show potential

### Large Scale (100 portfolios)
- **Dataset**: Kenneth French 100 (all portfolios)
- **Time period**: Full 100 years or recent 10 years
- **Expected**: Quantum advantage zone (crossover point)

---

## Technical Notes

**Kenneth French Data Format**:
- CSV with header rows (metadata)
- Actual data starts around row 20
- Date format: YYYYMMDD
- Missing values: -99.99 or -999
- Returns are percentages (e.g., 0.52 = 0.52%)

**Conversion Required**:
- Parse dates correctly
- Filter out header/footer text
- Convert returns to prices (cumulative product)
- Handle missing data appropriately

---

## References

- **Kenneth French Data Library**: https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html
- **Damodaran Data**: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/data.html
- **CRSP Database**: Center for Research in Security Prices (University of Chicago)

---

**Status**: ✅ **PHASE 1 COMPLETE**  
**Ready for**: Large-scale benchmarking (10-100 portfolios)
