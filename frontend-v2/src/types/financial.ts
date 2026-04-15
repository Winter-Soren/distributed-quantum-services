import type { BackendJobFragmentResult, BackendJobQuantumResult, BackendPlanResponse } from '@/types/backend';

export type FinancialJobStatus = 'QUEUED' | 'INGESTING' | 'ANALYSING' | 'COMPLETED' | 'FAILED';

export interface ColumnProfile {
	name: string;
	dtype: 'numeric' | 'categorical' | 'datetime';
	non_null_count: number;
	null_count: number;
	null_pct: number;
	unique_count: number;
	sample_values: (string | number)[];
	mean?: number;
	median?: number;
	std?: number;
	min?: number;
	max?: number;
	q1?: number;
	q3?: number;
	iqr?: number;
	skewness?: number;
	kurtosis?: number;
	cv?: number;
	outlier_count?: number;
	outlier_pct?: number;
}

export interface CorrelationPair {
	col_a: string;
	col_b: string;
	pearson: number;
	strength: 'strong' | 'moderate' | 'weak';
	direction: 'positive' | 'negative';
}

export interface TimeSeriesInsight {
	column: string;
	trend: 'upward' | 'downward' | 'flat' | 'volatile';
	trend_slope: number;
	volatility: number;
	period_avg: number;
	period_high: number;
	period_low: number;
	momentum: number;
	cagr?: number;
}

export interface ScenarioOutput {
	label: string;
	revenue_projection: number;
	margin_projection: number;
	valuation_estimate: number;
	growth_rate: number;
	discount_rate: number;
	terminal_value: number;
}

export interface DCFOutput {
	wacc: number;
	terminal_growth: number;
	projection_years: number;
	yearly_cashflows: number[];
	terminal_value: number;
	enterprise_value: number;
	equity_value: number;
	per_share_value?: number;
	bull: ScenarioOutput;
	base: ScenarioOutput;
	bear: ScenarioOutput;
}

export interface AnomalyPoint {
	row_index: number;
	column: string;
	value: number;
	z_score: number;
	label: 'extreme_high' | 'extreme_low';
}

export interface NodeExecutionSegment {
	node_id: string;
	task: string;
	rows_processed: number;
	duration_ms: number;
	fidelity_score: number;
}

export interface QuantumFeatureMapping {
	column: string;
	qubit: number;
	mean_rotation: number;
	volatility_rotation: number;
	momentum_rotation: number;
	anomaly_pressure: number;
	correlation_degree: number;
}

export interface QuantumSignalSummary {
	qubit_count: number;
	encoded_columns: string[];
	dominant_state?: string | null;
	dominant_state_probability?: number | null;
	concentration_score: number;
	entanglement_score: number;
	interference_score: number;
	execution_fidelity?: number | null;
	column_activation: Record<string, number>;
}

export interface FinancialQuantumExecution {
	circuit_text: string;
	encoded_columns: string[];
	feature_mapping: QuantumFeatureMapping[];
	plan: BackendPlanResponse;
	fragment_results: BackendJobFragmentResult[];
	quantum_result: BackendJobQuantumResult | null;
	signal_summary: QuantumSignalSummary;
}

export interface FinancialAnalysisResult {
	job_id: string;
	filename: string;
	row_count: number;
	col_count: number;
	numeric_columns: string[];
	categorical_columns: string[];
	datetime_columns: string[];
	column_profiles: ColumnProfile[];
	correlations: CorrelationPair[];
	top_correlations: CorrelationPair[];
	time_series_insights: TimeSeriesInsight[];
	dcf?: DCFOutput;
	anomalies: AnomalyPoint[];
	summary_stats: Record<string, unknown>;
	node_execution: NodeExecutionSegment[];
	quantum_execution?: FinancialQuantumExecution | null;
	analysis_duration_ms: number;
	distributed_nodes_used: number;
	fragments_executed: number;
	generated_at: string;
}

export interface FinancialJobResponse {
	job_id: string;
	status: FinancialJobStatus;
	filename: string;
	row_count?: number;
	col_count?: number;
	error?: string;
	created_at: string;
	updated_at: string;
	result?: FinancialAnalysisResult;
}
