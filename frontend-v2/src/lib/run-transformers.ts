import type {
	BackendHealthResponse,
	BackendJobListItemResponse,
	BackendJobProgressResponse,
	BackendJobQuantumResult,
	BackendJobStatusResponse,
	BackendPlanResponse
} from '@/types/backend';
import {
	getRunBadgeVariant,
	getRunBadgeVariantFinancial,
	getRunStatusGroup,
	getRunStatusGroupFinancial,
	getRunStatusLabel,
	getRunStatusLabelFinancial
} from '@/lib/run-status';
import type { FinancialAnalysisResult, FinancialJobResponse } from '@/types/financial';
import type {
	BackendFinancialJobListItem,
	FinancialJobStatus,
	RunDetailSnapshot,
	RunFragmentResultSummary,
	RunHealthSummary,
	RunMeasurementBucket,
	RunPlanCandidateSummary,
	RunPlanFragmentSummary,
	RunPlanSummary,
	RunProgressSummary,
	RunQuantumSummary,
	RunSummary,
	RunsCountSummary,
	RunsListSnapshot
} from '@/types/runs';

type BuildRunsListSnapshotInput = {
	generatedAt: string;
	health: BackendHealthResponse | null;
	jobs: BackendJobListItemResponse[];
	warnings?: string[];
	jobsListUnavailable?: boolean;
	/** Financial CSV analysis jobs (merged into run history). */
	financialJobs?: BackendFinancialJobListItem[];
};

type BuildRunDetailSnapshotInput = {
	generatedAt: string;
	health: BackendHealthResponse | null;
	job: BackendJobStatusResponse;
	plan: BackendPlanResponse | null;
	warnings?: string[];
};

type BuildFinancialRunDetailSnapshotInput = {
	generatedAt: string;
	health: BackendHealthResponse | null;
	job: FinancialJobResponse;
	warnings?: string[];
};

function formatAbsoluteDateTime(isoValue: string) {
	const date = new Date(isoValue);

	if (Number.isNaN(date.getTime())) {
		return 'Unknown';
	}

	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(date);
}

function formatRelativeTime(isoValue: string | null, referenceDate: Date) {
	if (!isoValue) {
		return 'Unavailable';
	}

	const date = new Date(isoValue);

	if (Number.isNaN(date.getTime())) {
		return 'Unavailable';
	}

	const diffMs = referenceDate.getTime() - date.getTime();
	const absDiffMs = Math.abs(diffMs);
	const suffix = diffMs >= 0 ? 'ago' : 'from now';

	if (absDiffMs < 60_000) {
		return 'just now';
	}

	if (absDiffMs < 3_600_000) {
		return `${Math.round(absDiffMs / 60_000)}m ${suffix}`;
	}

	if (absDiffMs < 86_400_000) {
		return `${Math.round(absDiffMs / 3_600_000)}h ${suffix}`;
	}

	return `${Math.round(absDiffMs / 86_400_000)}d ${suffix}`;
}

function formatUptime(seconds: number) {
	if (seconds < 60) {
		return `${Math.max(0, Math.floor(seconds))}s`;
	}

	if (seconds < 3_600) {
		return `${Math.floor(seconds / 60)}m`;
	}

	if (seconds < 86_400) {
		return `${Math.floor(seconds / 3_600)}h ${Math.floor((seconds % 3_600) / 60)}m`;
	}

	return `${Math.floor(seconds / 86_400)}d ${Math.floor((seconds % 86_400) / 3_600)}h`;
}

function sortMeasurementBuckets(source: Record<string, number> | null | undefined): RunMeasurementBucket[] {
	return Object.entries(source ?? {})
		.sort((left, right) => right[1] - left[1])
		.map(([key, value]) => ({
			key,
			value
		}));
}

function toRunHealthSummary(health: BackendHealthResponse | null): RunHealthSummary | null {
	if (!health) {
		return null;
	}

	return {
		status: health.status,
		service: health.service,
		version: health.version,
		environment: health.environment,
		uptimeLabel: formatUptime(health.uptime_seconds)
	};
}

function toRunProgressSummary(
	progress: BackendJobProgressResponse | null,
	referenceDate: Date
): RunProgressSummary | null {
	if (!progress) {
		return null;
	}

	return {
		totalFragments: progress.total_fragments,
		completedFragments: progress.completed_fragments,
		activeFragments: progress.active_fragments,
		completionRatio: progress.completion_ratio,
		completionPercentage: Math.round(progress.completion_ratio * 100),
		latestEventAt: progress.latest_event_at,
		latestEventLabel: formatRelativeTime(progress.latest_event_at, referenceDate),
		finalizing: progress.finalizing
	};
}

export function buildCircuitPreview(circuitText: string | null | undefined, maxLength = 96) {
	if (circuitText == null || circuitText === '') {
		return 'Circuit submitted';
	}

	let fallback: string | null = null;

	for (const line of circuitText.split('\n')) {
		const normalized = line.trim().replace(/\s+/g, ' ');

		if (!normalized) {
			continue;
		}

		const preview = normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}...`;

		if (!fallback) {
			fallback = preview;
		}

		const upperLine = normalized.toUpperCase();

		if (
			upperLine.startsWith('OPENQASM') ||
			upperLine.startsWith('INCLUDE ') ||
			upperLine.startsWith('QREG ') ||
			upperLine.startsWith('CREG ') ||
			upperLine.startsWith('QUBIT[') ||
			upperLine.startsWith('BIT[')
		) {
			continue;
		}

		return preview;
	}

	return fallback ?? 'Circuit submitted';
}

export function sortRunSummaries(runs: RunSummary[]) {
	return [...runs].sort((left, right) => {
		const updatedDelta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

		if (updatedDelta !== 0) {
			return updatedDelta;
		}

		return right.id.localeCompare(left.id);
	});
}

export function countRuns(runs: RunSummary[]): RunsCountSummary {
	return runs.reduce<RunsCountSummary>(
		(counts, run) => {
			counts.total += 1;
			counts[run.statusGroup] += 1;
			return counts;
		},
		{
			total: 0,
			queued: 0,
			running: 0,
			completed: 0,
			failed: 0
		}
	);
}

export function toRunSummaryFromListItem(job: BackendJobListItemResponse, referenceDate: Date): RunSummary {
	return {
		id: job.job_id,
		jobKind: 'circuit',
		backendStatus: job.status,
		statusLabel: getRunStatusLabel(job.status),
		statusGroup: getRunStatusGroup(job.status),
		badgeVariant: getRunBadgeVariant(job.status),
		circuitPreview: job.circuit_preview,
		planId: job.plan_id,
		error: job.error,
		resultAvailable: job.result_available,
		createdAt: job.created_at,
		createdAtLabel: formatAbsoluteDateTime(job.created_at),
		updatedAt: job.updated_at,
		updatedAtLabel: formatRelativeTime(job.updated_at, referenceDate),
		progress: toRunProgressSummary(job.progress, referenceDate)
	};
}

const FINANCIAL_FRAGMENTS_TOTAL = 6;

function financialProgressSynthetic(status: FinancialJobStatus): RunProgressSummary | null {
	let completed = 0;
	switch (status) {
		case 'QUEUED':
			completed = 0;
			break;
		case 'INGESTING':
			completed = 1;
			break;
		case 'ANALYSING':
			completed = 4;
			break;
		case 'COMPLETED':
			completed = FINANCIAL_FRAGMENTS_TOTAL;
			break;
		case 'FAILED':
			completed = 0;
			break;
		default:
			return null;
	}
	const ratio = completed / FINANCIAL_FRAGMENTS_TOTAL;
	return {
		totalFragments: FINANCIAL_FRAGMENTS_TOTAL,
		completedFragments: completed,
		activeFragments: Math.max(0, FINANCIAL_FRAGMENTS_TOTAL - completed),
		completionRatio: ratio,
		completionPercentage: Math.round(ratio * 100),
		latestEventAt: null,
		latestEventLabel: '—',
		finalizing: status === 'ANALYSING' || status === 'INGESTING'
	};
}

export function toRunSummaryFromFinancialListItem(row: BackendFinancialJobListItem, referenceDate: Date): RunSummary {
	const status = row.status;
	return {
		id: row.job_id,
		jobKind: 'financial',
		backendStatus: status,
		statusLabel: getRunStatusLabelFinancial(status),
		statusGroup: getRunStatusGroupFinancial(status),
		badgeVariant: getRunBadgeVariantFinancial(status),
		circuitPreview: `Financial · ${row.filename}`,
		planId: null,
		error: row.error,
		resultAvailable: status === 'COMPLETED',
		createdAt: row.created_at,
		createdAtLabel: formatAbsoluteDateTime(row.created_at),
		updatedAt: row.updated_at,
		updatedAtLabel: formatRelativeTime(row.updated_at, referenceDate),
		progress: financialProgressSynthetic(status)
	};
}

export function toRunSummaryFromDetail(job: BackendJobStatusResponse, referenceDate: Date): RunSummary {
	return {
		id: job.job_id,
		jobKind: 'circuit',
		backendStatus: job.status,
		statusLabel: getRunStatusLabel(job.status),
		statusGroup: getRunStatusGroup(job.status),
		badgeVariant: getRunBadgeVariant(job.status),
		circuitPreview: buildCircuitPreview(job.circuit_text),
		planId: job.plan_id,
		error: job.error,
		resultAvailable: job.result !== null,
		createdAt: job.created_at,
		createdAtLabel: formatAbsoluteDateTime(job.created_at),
		updatedAt: job.updated_at,
		updatedAtLabel: formatRelativeTime(job.updated_at, referenceDate),
		progress: toRunProgressSummary(job.progress, referenceDate)
	};
}

function buildQuantumSummary(quantumResult: BackendJobQuantumResult | null): RunQuantumSummary | null {
	if (!quantumResult) {
		return null;
	}

	return {
		shots: quantumResult.shots ?? null,
		measuredQubits: quantumResult.measured_qubits ?? [],
		countBuckets: sortMeasurementBuckets(quantumResult.counts),
		measuredProbabilities: sortMeasurementBuckets(quantumResult.measured_probabilities),
		observableExpectations: sortMeasurementBuckets(quantumResult.observable_expectations),
		entanglementEntropy: sortMeasurementBuckets(quantumResult.entanglement_entropy),
		blochVectors: quantumResult.bloch_vectors ?? null,
		fidelity: quantumResult.fidelity ?? null,
		topBasisStates: quantumResult.top_basis_states ?? [],
		statevector: quantumResult.statevector ?? null,
		reducedDensityMatrices: quantumResult.reduced_density_matrices ?? null
	};
}

function buildPlanSummary(plan: BackendPlanResponse | null): RunPlanSummary | null {
	if (!plan) {
		return null;
	}

	const fragments: RunPlanFragmentSummary[] = plan.fragment_order.map(fragmentId => {
		const fragment = plan.fragments[fragmentId];
		const assignment = plan.assignments[fragmentId];
		const qubits = fragment?.qubits ?? [];
		const dependencies = fragment?.dependencies ?? [];
		const operationIds = fragment?.operation_ids ?? [];
		const candidates: RunPlanCandidateSummary[] = (assignment?.candidates ?? []).map(candidate => ({
			nodeId: candidate.node_id,
			totalCost: candidate.total_cost,
			latencyCost: candidate.latency_cost,
			failureRiskCost: candidate.failure_risk_cost,
			loadCost: candidate.load_cost,
			fidelity: candidate.fidelity
		}));

		return {
			fragmentId,
			serviceType: fragment?.service_type ?? 'unknown',
			qubits,
			qubitsLabel: qubits.length ? qubits.join(', ') : 'None',
			operationIds,
			dependencies,
			operationCount: operationIds.length,
			dependencyCount: dependencies.length,
			primaryNodeId: assignment?.primary_node_id ?? null,
			fallbackNodeIds: assignment?.fallback_node_ids ?? [],
			candidateCount: candidates.length,
			candidates
		};
	});

	return {
		planId: plan.plan_id,
		qualitySnapshotId: plan.quality_snapshot_id,
		fragmentOrder: plan.fragment_order,
		fragments
	};
}

function mapFragmentResults(
	fragmentResults: Array<{
		fragment_id: string;
		node_id: string;
		status: string;
		attempts: number;
		observed_fidelity?: number | null;
		started_at?: string | null;
		finished_at?: string | null;
		error?: string | null;
	}>,
	referenceDate: Date
): RunFragmentResultSummary[] {
	return fragmentResults.map(fragment => ({
		fragmentId: fragment.fragment_id,
		nodeId: fragment.node_id,
		status: fragment.status,
		attempts: fragment.attempts,
		observedFidelityRatio: typeof fragment.observed_fidelity === 'number' ? fragment.observed_fidelity : null,
		observedFidelity:
			typeof fragment.observed_fidelity === 'number' ? `${(fragment.observed_fidelity * 100).toFixed(2)}%` : null,
		startedAt: fragment.started_at ?? null,
		startedAtLabel: formatRelativeTime(fragment.started_at ?? null, referenceDate),
		finishedAt: fragment.finished_at ?? null,
		finishedAtLabel: formatRelativeTime(fragment.finished_at ?? null, referenceDate),
		error: fragment.error ?? null
	}));
}

export function buildRunsListSnapshot({
	generatedAt,
	health,
	jobs,
	warnings = [],
	jobsListUnavailable = false,
	financialJobs = []
}: BuildRunsListSnapshotInput): RunsListSnapshot {
	const referenceDate = new Date(generatedAt);
	const circuitRuns = jobs.map(job => toRunSummaryFromListItem(job, referenceDate));
	const financialRuns = financialJobs.map(row => toRunSummaryFromFinancialListItem(row, referenceDate));
	const runs = sortRunSummaries([...circuitRuns, ...financialRuns]);

	return {
		generatedAt,
		warnings,
		...(jobsListUnavailable ? { jobsListUnavailable: true } : {}),
		health: toRunHealthSummary(health),
		counts: countRuns(runs),
		runs
	};
}

function toRunSummaryFromFinancialJob(job: FinancialJobResponse, referenceDate: Date): RunSummary {
	const row: BackendFinancialJobListItem = {
		job_id: job.job_id,
		status: job.status,
		filename: job.filename,
		row_count: job.row_count ?? null,
		col_count: job.col_count ?? null,
		error: job.error ?? null,
		created_at: job.created_at,
		updated_at: job.updated_at
	};
	return toRunSummaryFromFinancialListItem(row, referenceDate);
}

function truncateLabel(s: string, max: number): string {
	if (s.length <= max) return s;
	return `${s.slice(0, Math.max(0, max - 1))}…`;
}

/** Linear DAG: each financial pipeline stage depends on the previous (matches engine ordering). */
function buildFinancialPlanFromResult(result: FinancialAnalysisResult, jobId: string): RunPlanSummary {
	const segs = result.node_execution;
	const fragmentOrder = segs.map((_, i) => `fin-frag-${i}`);
	const fragments: RunPlanFragmentSummary[] = segs.map((seg, i) => {
		const fragmentId = `fin-frag-${i}`;
		const deps = i === 0 ? [] : [`fin-frag-${i - 1}`];
		const label = seg.task.replace(/_/g, ' ');
		const candidate: RunPlanCandidateSummary = {
			nodeId: seg.node_id,
			totalCost: seg.duration_ms,
			latencyCost: seg.duration_ms * 0.4,
			failureRiskCost: Math.max(0, 1 - seg.fidelity_score),
			loadCost: seg.rows_processed,
			fidelity: seg.fidelity_score
		};
		return {
			fragmentId,
			serviceType: label,
			qubits: [],
			qubitsLabel: '—',
			operationIds: [seg.task],
			dependencies: deps,
			operationCount: 1,
			dependencyCount: deps.length,
			primaryNodeId: seg.node_id,
			fallbackNodeIds: [],
			candidateCount: 1,
			candidates: [candidate]
		};
	});

	return {
		planId: jobId,
		qualitySnapshotId: null,
		fragmentOrder,
		fragments
	};
}

function buildFinancialFragmentResults(
	result: FinancialAnalysisResult,
	referenceDate: Date
): RunFragmentResultSummary[] {
	return result.node_execution.map((seg, i) => ({
		fragmentId: `fin-frag-${i}`,
		nodeId: seg.node_id,
		status: 'COMPLETED',
		attempts: 1,
		observedFidelityRatio: seg.fidelity_score,
		observedFidelity: `${(seg.fidelity_score * 100).toFixed(2)}%`,
		startedAt: null,
		startedAtLabel: formatRelativeTime(null, referenceDate),
		finishedAt: null,
		finishedAtLabel: formatRelativeTime(null, referenceDate),
		error: null
	}));
}

function buildFinancialQuantumSummary(result: FinancialAnalysisResult): RunQuantumSummary {
	const dtypeBuckets: RunMeasurementBucket[] = [];
	let n = 0,
		c = 0,
		d = 0;
	for (const p of result.column_profiles) {
		if (p.dtype === 'numeric') n++;
		else if (p.dtype === 'categorical') c++;
		else d++;
	}
	if (n) dtypeBuckets.push({ key: 'numeric columns', value: n });
	if (c) dtypeBuckets.push({ key: 'categorical columns', value: c });
	if (d) dtypeBuckets.push({ key: 'datetime columns', value: d });

	const correlations = result.top_correlations.slice(0, 32);
	const measuredProbabilities: RunMeasurementBucket[] = correlations.map(pair => ({
		key: `${truncateLabel(pair.col_a, 10)}↔${truncateLabel(pair.col_b, 10)}`,
		value: Math.min(1, Math.abs(pair.pearson))
	}));

	const topBasisStates = correlations.slice(0, 16).map(pair => ({
		basis_state: `${pair.col_a} ↔ ${pair.col_b}`,
		probability: Math.min(1, Math.abs(pair.pearson))
	}));

	const observableExpectations: RunMeasurementBucket[] = result.time_series_insights.slice(0, 24).map(insight => ({
		key: truncateLabel(insight.column, 18),
		value: Math.max(-1, Math.min(1, insight.momentum / 100))
	}));

	const entanglementEntropy: RunMeasurementBucket[] = result.time_series_insights.slice(0, 20).map(insight => ({
		key: truncateLabel(insight.column, 22),
		value: Math.min(1, Math.log1p(Math.max(0, insight.volatility)) / 8)
	}));

	const maxDur = Math.max(...result.node_execution.map(s => s.duration_ms), 1);
	const maxRows = Math.max(...result.node_execution.map(s => s.rows_processed), 1);
	const blochVectors: Record<string, Record<string, number>> = {};
	result.node_execution.forEach((seg, i) => {
		blochVectors[`frag-${i}`] = {
			x: (seg.duration_ms / maxDur) * 2 - 1,
			y: seg.fidelity_score * 2 - 1,
			z: (seg.rows_processed / maxRows) * 2 - 1
		};
	});

	const fids = result.node_execution.map(s => s.fidelity_score);
	const meanFid = fids.length ? fids.reduce((a, b) => a + b, 0) / fids.length : 0;
	const minFid = fids.length ? Math.min(...fids) : 0;

	return {
		shots: result.row_count,
		measuredQubits: result.node_execution.map((_, i) => i),
		countBuckets: dtypeBuckets,
		measuredProbabilities,
		observableExpectations,
		entanglementEntropy,
		blochVectors,
		fidelity: {
			fidelity_to_target_state: meanFid,
			estimated_execution_fidelity: minFid,
			target_state: result.filename
		},
		topBasisStates,
		statevector: null,
		reducedDensityMatrices: null
	};
}

function buildFinancialCircuitText(job: FinancialJobResponse, result: FinancialAnalysisResult): string {
	const lines = [
		'Financial CSV analysis (distributed pipeline)',
		`Job id: ${job.job_id}`,
		`File: ${result.filename}`,
		`Shape: ${result.row_count.toLocaleString()} rows × ${result.col_count} columns`,
		`Pipeline fragments: ${result.fragments_executed} · Nodes used: ${result.distributed_nodes_used}`,
		`Wall time: ${(result.analysis_duration_ms / 1000).toFixed(2)}s`,
		`Anomalies flagged: ${result.anomalies.length} · Strong correlations: ${result.correlations.filter(c => c.strength === 'strong').length}`,
		'',
		'Open “Full analytics” on the Financial page for charts, DCF, and interactive tables.'
	];
	return lines.join('\n');
}

/** Maps a financial CSV job into the same surfaces as circuit runs (plan, peers, fragments, analysis). */
export function buildFinancialRunDetailSnapshot({
	generatedAt,
	health,
	job,
	warnings = []
}: BuildFinancialRunDetailSnapshotInput): RunDetailSnapshot {
	const referenceDate = new Date(generatedAt);
	const baseSummary = toRunSummaryFromFinancialJob(job, referenceDate);
	const result = job.result ?? null;

	if (!result) {
		return {
			generatedAt,
			warnings,
			health: toRunHealthSummary(health),
			financialResult: null,
			run: {
				...baseSummary,
				circuitText: '',
				fragmentResults: [],
				quantumSummary: null
			},
			plan: null
		};
	}

	const quantumExecution = result.quantum_execution ?? null;
	const plan = quantumExecution
		? buildPlanSummary(quantumExecution.plan)
		: buildFinancialPlanFromResult(result, job.job_id);
	const fragmentResults = quantumExecution
		? mapFragmentResults(quantumExecution.fragment_results, referenceDate)
		: buildFinancialFragmentResults(result, referenceDate);
	const quantumSummary = quantumExecution
		? buildQuantumSummary(quantumExecution.quantum_result)
		: buildFinancialQuantumSummary(result);
	const circuitText =
		quantumExecution?.circuit_text && quantumExecution.circuit_text.trim()
			? quantumExecution.circuit_text
			: buildFinancialCircuitText(job, result);

	return {
		generatedAt,
		warnings,
		health: toRunHealthSummary(health),
		financialResult: result,
		run: {
			...baseSummary,
			planId: quantumExecution?.plan?.plan_id ?? job.job_id,
			circuitText,
			fragmentResults,
			quantumSummary
		},
		plan
	};
}

export function buildRunDetailSnapshot({
	generatedAt,
	health,
	job,
	plan,
	warnings = []
}: BuildRunDetailSnapshotInput): RunDetailSnapshot {
	const referenceDate = new Date(generatedAt);
	const summary = toRunSummaryFromDetail(job, referenceDate);

	return {
		generatedAt,
		warnings,
		health: toRunHealthSummary(health),
		run: {
			...summary,
			circuitText: job.circuit_text ?? '',
			fragmentResults: mapFragmentResults(job.result?.fragment_results ?? [], referenceDate),
			quantumSummary: buildQuantumSummary(job.result?.quantum_result ?? null)
		},
		plan: buildPlanSummary(plan)
	};
}
