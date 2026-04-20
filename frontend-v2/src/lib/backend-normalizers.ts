import type {
	BackendJobFragmentResult,
	BackendJobQuantumResult,
	BackendPlanResponse
} from '@/types/backend';
import type {
	ColumnProfile,
	CorrelationPair,
	DCFOutput,
	FinancialAnalysisResult,
	FinancialJobResponse,
	FinancialJobStatus,
	FinancialQuantumExecution,
	NodeExecutionSegment,
	QuantumFeatureMapping,
	QuantumSignalSummary,
	ScenarioOutput,
	TimeSeriesInsight
} from '@/types/financial';
import type { BackendFinancialJobListItem } from '@/types/runs';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
	return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown) {
	return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asScalarArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
		: [];
}

function asObjectArray(value: unknown) {
	return Array.isArray(value) ? value.filter(isRecord) : [];
}

function normalizeIsoDate(value: unknown, fallback: string) {
	return asString(value)?.trim() || fallback;
}

function normalizeColumnType(value: unknown): ColumnProfile['dtype'] {
	const normalized = asString(value)?.trim().toLowerCase();

	if (normalized === 'datetime' || normalized === 'date' || normalized === 'time') {
		return 'datetime';
	}

	if (normalized === 'numeric' || normalized === 'number') {
		return 'numeric';
	}

	return 'categorical';
}

const FINANCIAL_STATUS_MAP: Record<string, FinancialJobStatus> = {
	queued: 'QUEUED',
	ingesting: 'INGESTING',
	analyzing: 'ANALYSING',
	analysing: 'ANALYSING',
	completed: 'COMPLETED',
	failed: 'FAILED'
};

export function normalizeFinancialJobStatus(value: unknown): FinancialJobStatus {
	const normalized = asString(value)?.trim().toLowerCase() ?? '';
	return FINANCIAL_STATUS_MAP[normalized] ?? 'QUEUED';
}

function normalizeColumnProfileFromRecord(record: UnknownRecord, fallbackName: string): ColumnProfile {
	const dtype = normalizeColumnType(record.dtype ?? record.kind);
	const sampleValues = asScalarArray(record.sample_values);
	const count = asNumber(record.count);
	const nonNullCount = asNumber(record.non_null_count) ?? count ?? 0;
	const uniqueCount = asNumber(record.unique_count) ?? (dtype === 'numeric' ? 0 : count ?? sampleValues.length);

	return {
		name: asString(record.name) ?? fallbackName,
		dtype,
		non_null_count: nonNullCount,
		null_count: asNumber(record.null_count) ?? 0,
		null_pct: asNumber(record.null_pct) ?? 0,
		unique_count: uniqueCount,
		sample_values: sampleValues,
		mean: asNumber(record.mean) ?? undefined,
		median: asNumber(record.median) ?? undefined,
		std: asNumber(record.std) ?? undefined,
		min: asNumber(record.min) ?? undefined,
		max: asNumber(record.max) ?? undefined,
		q1: asNumber(record.q1) ?? undefined,
		q3: asNumber(record.q3) ?? undefined,
		iqr: asNumber(record.iqr) ?? undefined,
		skewness: asNumber(record.skewness) ?? undefined,
		kurtosis: asNumber(record.kurtosis) ?? undefined,
		cv: asNumber(record.cv) ?? undefined,
		outlier_count: asNumber(record.outlier_count) ?? undefined,
		outlier_pct: asNumber(record.outlier_pct) ?? undefined
	};
}

function normalizeColumnProfiles(value: unknown) {
	if (Array.isArray(value)) {
		return asObjectArray(value).map((item, index) => normalizeColumnProfileFromRecord(item, `column_${index + 1}`));
	}

	if (!isRecord(value)) {
		return [];
	}

	return Object.entries(value).map(([name, profile]) =>
		normalizeColumnProfileFromRecord(isRecord(profile) ? profile : {}, name)
	);
}

function normalizeCorrelationPair(value: UnknownRecord): CorrelationPair {
	const pearson = asNumber(value.pearson) ?? 0;
	const direction = pearson >= 0 ? 'positive' : 'negative';
	const strength =
		asString(value.strength) === 'strong' || asString(value.strength) === 'moderate' || asString(value.strength) === 'weak'
			? (value.strength as CorrelationPair['strength'])
			: Math.abs(pearson) >= 0.7
				? 'strong'
				: Math.abs(pearson) >= 0.4
					? 'moderate'
					: 'weak';

	return {
		col_a: asString(value.col_a) ?? 'unknown_a',
		col_b: asString(value.col_b) ?? 'unknown_b',
		pearson,
		strength,
		direction:
			asString(value.direction) === 'negative'
				? 'negative'
				: direction
	};
}

function normalizeTimeSeriesInsight(value: UnknownRecord): TimeSeriesInsight {
	return {
		column: asString(value.column) ?? 'unknown',
		trend:
			asString(value.trend) === 'upward' ||
			asString(value.trend) === 'downward' ||
			asString(value.trend) === 'volatile'
				? (value.trend as TimeSeriesInsight['trend'])
				: 'flat',
		trend_slope: asNumber(value.trend_slope) ?? 0,
		volatility: asNumber(value.volatility) ?? 0,
		period_avg: asNumber(value.period_avg) ?? 0,
		period_high: asNumber(value.period_high) ?? 0,
		period_low: asNumber(value.period_low) ?? 0,
		momentum: asNumber(value.momentum) ?? 0,
		cagr: asNumber(value.cagr) ?? undefined
	};
}

function normalizeNodeExecutionSegment(value: UnknownRecord): NodeExecutionSegment {
	return {
		node_id: asString(value.node_id) ?? 'unknown-node',
		task: asString(value.task) ?? 'unknown_task',
		rows_processed: asNumber(value.rows_processed) ?? 0,
		duration_ms: asNumber(value.duration_ms) ?? 0,
		fidelity_score: asNumber(value.fidelity_score) ?? 0
	};
}

function normalizeQuantumFeatureMapping(value: UnknownRecord, qubit: number): QuantumFeatureMapping {
	return {
		column: asString(value.column) ?? `q${qubit}`,
		qubit: asNumber(value.qubit) ?? qubit,
		mean_rotation: asNumber(value.mean_rotation) ?? 0,
		volatility_rotation: asNumber(value.volatility_rotation) ?? 0,
		momentum_rotation: asNumber(value.momentum_rotation) ?? 0,
		anomaly_pressure: asNumber(value.anomaly_pressure) ?? 0,
		correlation_degree: asNumber(value.correlation_degree) ?? 0
	};
}

function normalizeQuantumSignalSummary(value: unknown, encodedColumns: string[]): QuantumSignalSummary {
	const record = isRecord(value) ? value : {};
	const columnActivation: Record<string, number> = isRecord(record.column_activation)
		? Object.entries(record.column_activation).reduce<Record<string, number>>((acc, [column, activation]) => {
				if (typeof activation === 'number' && Number.isFinite(activation)) {
					acc[column] = activation;
				}

				return acc;
			}, {})
		: encodedColumns.reduce<Record<string, number>>((acc, column) => {
				acc[column] = 0;
				return acc;
			}, {});

	return {
		qubit_count: asNumber(record.qubit_count) ?? encodedColumns.length,
		encoded_columns: encodedColumns,
		dominant_state: asString(record.dominant_state) ?? null,
		dominant_state_probability: asNumber(record.dominant_state_probability),
		concentration_score: asNumber(record.concentration_score) ?? 0,
		entanglement_score: asNumber(record.entanglement_score) ?? 0,
		interference_score: asNumber(record.interference_score) ?? 0,
		execution_fidelity: asNumber(record.execution_fidelity),
		column_activation: columnActivation
	};
}

function normalizeScenarioOutput(value: unknown, label: string): ScenarioOutput {
	const record = isRecord(value) ? value : {};
	return {
		label: asString(record.label) ?? label,
		revenue_projection: asNumber(record.revenue_projection) ?? 0,
		margin_projection: asNumber(record.margin_projection) ?? 0,
		valuation_estimate: asNumber(record.valuation_estimate) ?? 0,
		growth_rate: asNumber(record.growth_rate) ?? 0,
		discount_rate: asNumber(record.discount_rate) ?? 0,
		terminal_value: asNumber(record.terminal_value) ?? 0
	};
}

function normalizeDcfOutput(value: unknown): DCFOutput | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	return {
		wacc: asNumber(value.wacc) ?? 0,
		terminal_growth: asNumber(value.terminal_growth) ?? 0,
		projection_years: asNumber(value.projection_years) ?? 0,
		yearly_cashflows: Array.isArray(value.yearly_cashflows)
			? value.yearly_cashflows.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
			: [],
		terminal_value: asNumber(value.terminal_value) ?? 0,
		enterprise_value: asNumber(value.enterprise_value) ?? 0,
		equity_value: asNumber(value.equity_value) ?? 0,
		per_share_value: asNumber(value.per_share_value) ?? undefined,
		bull: normalizeScenarioOutput(value.bull, 'Bull'),
		base: normalizeScenarioOutput(value.base, 'Base'),
		bear: normalizeScenarioOutput(value.bear, 'Bear')
	};
}

function normalizeFinancialQuantumExecution(value: unknown): FinancialQuantumExecution | null {
	if (!isRecord(value)) {
		return null;
	}

	const encodedColumns = asStringArray(value.encoded_columns);
	const featureMapping = asObjectArray(value.feature_mapping).map((item, index) =>
		normalizeQuantumFeatureMapping(item, index)
	);

	return {
		circuit_text: asString(value.circuit_text) ?? '',
		encoded_columns: encodedColumns,
		feature_mapping: featureMapping,
		plan: (isRecord(value.plan) ? value.plan : {
			plan_id: '',
			fragment_order: [],
			fragments: {},
			assignments: {},
			quality_snapshot_id: null
		}) as BackendPlanResponse,
		fragment_results: (Array.isArray(value.fragment_results) ? value.fragment_results : []) as BackendJobFragmentResult[],
		quantum_result: (isRecord(value.quantum_result) ? value.quantum_result : null) as BackendJobQuantumResult | null,
		signal_summary: normalizeQuantumSignalSummary(value.signal_summary, encodedColumns)
	};
}

function buildSummaryStats(raw: UnknownRecord) {
	if (isRecord(raw.summary_stats)) {
		return raw.summary_stats;
	}

	if (typeof raw.summary === 'string' && raw.summary.trim()) {
		return {
			summary: raw.summary.trim()
		};
	}

	return {};
}

export function normalizeFinancialAnalysisResult(
	value: unknown,
	{
		jobId,
		filename,
		generatedAt
	}: {
		jobId: string;
		filename: string;
		generatedAt: string;
	}
): FinancialAnalysisResult | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	const columnProfiles = normalizeColumnProfiles(value.column_profiles);
	const derivedNumericColumns = columnProfiles.filter(profile => profile.dtype === 'numeric').map(profile => profile.name);
	const derivedCategoricalColumns = columnProfiles
		.filter(profile => profile.dtype === 'categorical')
		.map(profile => profile.name);
	const derivedDatetimeColumns = columnProfiles.filter(profile => profile.dtype === 'datetime').map(profile => profile.name);
	const correlations = asObjectArray(value.correlations).map(normalizeCorrelationPair);
	const topCorrelations =
		asObjectArray(value.top_correlations).map(normalizeCorrelationPair).length > 0
			? asObjectArray(value.top_correlations).map(normalizeCorrelationPair)
			: [...correlations].sort((left, right) => Math.abs(right.pearson) - Math.abs(left.pearson)).slice(0, 10);
	const timeSeriesInsights = asObjectArray(value.time_series_insights).map(normalizeTimeSeriesInsight);
	const nodeExecution = asObjectArray(value.node_execution).map(normalizeNodeExecutionSegment);
	const quantumExecution = normalizeFinancialQuantumExecution(value.quantum_execution);
	const distributedNodesUsed =
		asNumber(value.distributed_nodes_used) ??
		new Set(nodeExecution.map(segment => segment.node_id)).size;
	const fragmentsExecuted =
		asNumber(value.fragments_executed) ??
		(nodeExecution.length > 0 ? nodeExecution.length : (quantumExecution?.fragment_results.length ?? 0));

	return {
		job_id: asString(value.job_id) ?? jobId,
		filename: asString(value.filename) ?? filename,
		row_count: asNumber(value.row_count) ?? 0,
		col_count: asNumber(value.col_count) ?? 0,
		numeric_columns: asStringArray(value.numeric_columns).length
			? asStringArray(value.numeric_columns)
			: derivedNumericColumns,
		categorical_columns: asStringArray(value.categorical_columns).length
			? asStringArray(value.categorical_columns)
			: derivedCategoricalColumns,
		datetime_columns: asStringArray(value.datetime_columns).length
			? asStringArray(value.datetime_columns)
			: derivedDatetimeColumns,
		column_profiles: columnProfiles,
		correlations,
		top_correlations: topCorrelations,
		time_series_insights: timeSeriesInsights,
		dcf: normalizeDcfOutput(value.dcf),
		anomalies: asObjectArray(value.anomalies).map(item => ({
			row_index: asNumber(item.row_index) ?? 0,
			column: asString(item.column) ?? 'unknown',
			value: asNumber(item.value) ?? 0,
			z_score: asNumber(item.z_score) ?? 0,
			label: asString(item.label) === 'extreme_high' ? 'extreme_high' : 'extreme_low'
		})),
		summary_stats: buildSummaryStats(value),
		node_execution: nodeExecution,
		quantum_execution: quantumExecution,
		analysis_duration_ms: asNumber(value.analysis_duration_ms) ?? 0,
		distributed_nodes_used: distributedNodesUsed,
		fragments_executed: fragmentsExecuted,
		generated_at: normalizeIsoDate(value.generated_at, generatedAt)
	};
}

export function normalizeFinancialJobListItem(value: unknown): BackendFinancialJobListItem | null {
	if (!isRecord(value)) {
		return null;
	}

	const createdAt = normalizeIsoDate(value.created_at, new Date(0).toISOString());
	const updatedAt = normalizeIsoDate(value.updated_at, createdAt);

	return {
		job_id: asString(value.job_id) ?? 'fin-unknown',
		status: normalizeFinancialJobStatus(value.status),
		filename: asString(value.filename) ?? 'financial.csv',
		row_count: asNumber(value.row_count),
		col_count: asNumber(value.col_count),
		error: asString(value.error),
		created_at: createdAt,
		updated_at: updatedAt
	};
}

export function normalizeFinancialJobList(value: unknown) {
	return Array.isArray(value)
		? value
				.map(normalizeFinancialJobListItem)
				.filter((item): item is BackendFinancialJobListItem => item !== null)
		: [];
}

export function normalizeFinancialJobResponse(value: unknown): FinancialJobResponse | null {
	if (!isRecord(value)) {
		return null;
	}

	const createdAt = normalizeIsoDate(value.created_at, new Date(0).toISOString());
	const updatedAt = normalizeIsoDate(value.updated_at, createdAt);
	const jobId = asString(value.job_id) ?? 'fin-unknown';
	const filename = asString(value.filename) ?? 'financial.csv';

	return {
		job_id: jobId,
		status: normalizeFinancialJobStatus(value.status),
		filename,
		row_count: asNumber(value.row_count) ?? undefined,
		col_count: asNumber(value.col_count) ?? undefined,
		error: asString(value.error) ?? undefined,
		created_at: createdAt,
		updated_at: updatedAt,
		result: normalizeFinancialAnalysisResult(value.result, {
			jobId,
			filename,
			generatedAt: updatedAt
		})
	};
}
