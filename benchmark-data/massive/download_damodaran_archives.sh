#!/bin/bash
# Download Damodaran historical archives (2011-2025)
# Each dataset type for all years = 15 files per type

set -e

ARCHIVE_DIR="archives"
mkdir -p "$ARCHIVE_DIR"
cd "$ARCHIVE_DIR"

BASE_URL="https://pages.stern.nyu.edu/~adamodar/pc/archives"

echo "=============================================================================="
echo "DOWNLOADING DAMODARAN HISTORICAL ARCHIVES (2011-2025)"
echo "=============================================================================="
echo ""

# Dataset types to download
declare -a DATASETS=(
    "betaGlobal"      # Global company betas (10,000+ firms)
    "beta"            # US company betas (5,000-6,000 firms)
    "betaEurope"      # European betas
    "betaemerg"       # Emerging markets betas
    "pedata"          # P/E ratios by industry
    "pbvdata"         # Price-to-book ratios
    "psdata"          # Price-to-sales ratios
    "vebitda"         # EV/EBITDA ratios
    "margin"          # Operating margins
    "roe"             # Return on equity
    "wacc"            # Weighted average cost of capital
    "fcfyield"        # Free cash flow yield
)

total_size=0
file_count=0

for dataset in "${DATASETS[@]}"; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Dataset: $dataset"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    dataset_size=0
    dataset_files=0

    for year in {11..25}; do
        filename="${dataset}${year}.xls"
        url="${BASE_URL}/${filename}"

        # Skip if already exists
        if [ -f "$filename" ]; then
            echo "  ✓ $filename (already exists)"
            size=$(stat -f%z "$filename" 2>/dev/null || stat -c%s "$filename" 2>/dev/null)
            dataset_size=$((dataset_size + size))
            dataset_files=$((dataset_files + 1))
            continue
        fi

        # Download with error handling
        if curl -f -s -o "$filename" "$url"; then
            size=$(stat -f%z "$filename" 2>/dev/null || stat -c%s "$filename" 2>/dev/null)

            # Check if file is valid (>100 bytes)
            if [ "$size" -gt 100 ]; then
                echo "  ✓ $filename ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size}B"))"
                dataset_size=$((dataset_size + size))
                dataset_files=$((dataset_files + 1))
            else
                echo "  ⚠ $filename (too small, probably missing)"
                rm -f "$filename"
            fi
        else
            echo "  ✗ $filename (not found)"
        fi
    done

    echo "  Subtotal: $dataset_files files, $(numfmt --to=iec-i --suffix=B $dataset_size 2>/dev/null || echo "${dataset_size}B")"
    echo ""

    total_size=$((total_size + dataset_size))
    file_count=$((file_count + dataset_files))
done

echo "=============================================================================="
echo "DOWNLOAD COMPLETE"
echo "=============================================================================="
echo "Total files: $file_count"
echo "Total size: $(numfmt --to=iec-i --suffix=B $total_size 2>/dev/null || echo "${total_size}B")"
echo ""
echo "Location: $(pwd)"
echo ""
echo "Next: Process these archives into benchmark datasets!"
