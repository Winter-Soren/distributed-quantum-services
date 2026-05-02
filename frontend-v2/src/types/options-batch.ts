/** Types for the batch options benchmark feature. */

export interface BatchOptionsRowResult {
	row_index: number;
	option_type: string;
	current_value: number;
	strike_or_cost: number;
	time_to_expiry: number;
	volatility: number;
	risk_free_rate: number;
	market_price: number | null;

	// Prices
	quantum_price: number;
	classical_bs_price: number;
	classical_binomial_price: number;
	price_difference_pct: number;

	// Market error
	quantum_vs_market_pct: number | null;
	bs_vs_market_pct: number | null;

	// Greeks
	quantum_delta: number;
	classical_delta: number;

	// IQAE metadata
	confidence_interval: [number, number];
	moneyness: string;
	divergence_warning: boolean;
	num_qubits: number;
	analysis_duration_ms: number;
}

export interface BatchOptionsSummary {
	total_rows: number;
	succeeded: number;
	failed: number;
	mean_quantum_bs_diff_pct: number;
	mean_quantum_vs_market_pct: number | null;
	mean_bs_vs_market_pct: number | null;
	rows_with_divergence_warning: number;
	total_duration_ms: number;
}

export interface BatchOptionsError {
	row_index: number;
	error: string;
}

export interface BatchOptionsResult {
	rows: BatchOptionsRowResult[];
	errors: BatchOptionsError[];
	summary: BatchOptionsSummary;
}
