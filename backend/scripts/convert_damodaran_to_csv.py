"""Convert Damodaran Excel files to CSV format for easier processing."""

import pandas as pd
from pathlib import Path


def convert_histret_to_csv():
    """Convert historical returns Excel to CSV with cumulative prices."""
    project_root = Path(__file__).resolve().parents[2]
    excel_path = project_root / "benchmark-data" / "damodaran" / "histretSP.xls"
    csv_path = project_root / "benchmark-data" / "damodaran" / "histretSP.csv"

    print(f"Converting {excel_path.name} to CSV...")

    # Read Excel file with pandas
    df = pd.read_excel(excel_path, engine='xlrd')

    # Find the actual data start (skip description rows)
    year_col_idx = None
    for idx, col in enumerate(df.columns):
        if 'year' in str(col).lower() or (pd.api.types.is_numeric_dtype(df[col]) and df[col].iloc[0] >= 1900):
            year_col_idx = idx
            break

    if year_col_idx is None:
        # Try to find first numeric column that looks like years
        for idx, col in enumerate(df.columns):
            if pd.api.types.is_numeric_dtype(df[col]):
                first_val = df[col].iloc[0]
                if pd.notna(first_val) and 1900 <= first_val <= 2100:
                    year_col_idx = idx
                    break

    if year_col_idx is None:
        raise ValueError("Could not find year column in data")

    # Extract headers and clean them
    headers = list(df.columns)
    cleaned_headers = []
    for header in headers:
        if pd.isna(header) or 'unnamed' in str(header).lower():
            break
        cleaned = str(header).strip().replace(" ", "_").replace("&", "and").replace("/", "_").replace("%", "pct")
        cleaned_headers.append(cleaned)

    # Rename first column to 'date'
    if year_col_idx == 0:
        cleaned_headers[0] = "date"

    # Keep only the columns with actual headers
    df = df.iloc[:, :len(cleaned_headers)]
    df.columns = cleaned_headers

    # Remove any rows before actual data starts
    df = df[df['date'].apply(lambda x: pd.notna(x) and (isinstance(x, (int, float)) and 1900 <= x <= 2100))]

    # Convert year to date string
    df['date'] = df['date'].apply(lambda x: f"{int(x)}-12-31")

    # Convert percentage returns to cumulative prices (starting at $100)
    price_data = {'date': df['date']}

    for col in cleaned_headers[1:]:
        if col in df.columns:
            # Start with $100, apply returns cumulatively
            prices = [100.0]
            for ret in df[col].values:
                try:
                    if pd.notna(ret):
                        return_decimal = float(ret) / 100.0
                        prices.append(prices[-1] * (1 + return_decimal))
                    else:
                        prices.append(prices[-1])
                except (ValueError, TypeError):
                    prices.append(prices[-1])

            price_data[col] = [f"{p:.2f}" for p in prices[1:]]

    # Create new DataFrame with prices
    price_df = pd.DataFrame(price_data)

    # Save to CSV
    price_df.to_csv(csv_path, index=False)

    print(f"✅ Converted {len(price_df)} rows to {csv_path}")
    print(f"   Period: {price_df['date'].iloc[0]} to {price_df['date'].iloc[-1]}")
    print(f"   Columns: {', '.join(price_df.columns)}")
    return csv_path


if __name__ == "__main__":
    convert_histret_to_csv()
