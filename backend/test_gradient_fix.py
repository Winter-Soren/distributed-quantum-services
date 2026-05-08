"""Quick test to verify parameter-shift gradients are now enabled."""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from quantum_backend_v2.application.financial_portfolio import optimize_portfolio_qaoa


async def main():
    # Small test dataset (10 assets, 3 days)
    csv_content = """date,AAPL,MSFT,GOOGL,AMZN,TSLA,NVDA,META,BRK-B,JPM,V
2024-01-01,180.5,390.2,140.3,175.8,245.6,550.1,420.3,380.7,190.2,280.4
2024-01-02,182.3,392.5,142.1,177.2,248.3,555.7,422.9,382.1,192.8,282.1
2024-01-03,181.7,391.8,141.5,176.5,246.9,553.2,421.5,381.3,191.5,281.2"""

    print("Running test with gradient-enabled optimizer...")
    print("This should use: lbfgsb_expectation_parameter_shift_gradients_transfer_learning")
    print()

    result = await optimize_portfolio_qaoa(
        csv_bytes=csv_content.encode(),
        filename="test_gradient.csv",
        max_assets_considered=10,
        budget=3,
        parameter_search_steps=3,
        risk_aversion=2.0,
    )

    print(f"\nOptimizer Strategy: {result['optimizer_strategy']}")
    print(f"Parameter Evaluations: {result['parameter_evaluations']}")

    if "parameter_shift_gradients" in result["optimizer_strategy"]:
        print("✅ SUCCESS: Parameter-shift gradients are ENABLED!")
    else:
        print("❌ FAILURE: Gradients not detected in optimizer strategy")
        print(f"   Expected: 'parameter_shift_gradients' in strategy string")
        print(f"   Got: {result['optimizer_strategy']}")


if __name__ == "__main__":
    asyncio.run(main())
