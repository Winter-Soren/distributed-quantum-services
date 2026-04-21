'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
	AlertTriangleIcon,
	BarChart2Icon,
	CheckCircle2Icon,
	CpuIcon,
	FileCode2Icon,
	GitBranchIcon,
	NetworkIcon,
	ScaleIcon,
	TrendingUpIcon,
	ZapIcon
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { PortfolioComparisonReportSection } from '@/components/financial/portfolio-comparison-report-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FinancialAnalysisResult, PortfolioQuantumState } from '@/types/financial';

const WHITE_CARD_CLASS_NAME =
	'rounded-[1.95rem] border border-[var(--clay-oat)] bg-white p-5 text-foreground shadow-[var(--clay-shadow)]';
const SOFT_PANEL_CLASS_NAME =
	'rounded-[1.45rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.92)] p-4';
const TABLE_FRAME_CLASS_NAME =
	'max-h-[30rem] overflow-auto rounded-[1.8rem] border border-[var(--clay-oat)] bg-white shadow-[var(--clay-shadow)]';
const LABEL_CLASS_NAME = 'clay-label text-[var(--clay-charcoal)]';
const BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-black/10 bg-[var(--clay-blueberry)] text-white shadow-[var(--clay-shadow)] hover:bg-[var(--clay-ube-dark)]';
const SOFT_BADGE_CLASS_NAME =
	'rounded-full border border-black/10 bg-[rgb(250_249_247_/_0.92)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground shadow-[var(--clay-shadow)]';
const DARK_BADGE_CLASS_NAME =
	'rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white';

function formatNumber(value: number | null | undefined, digits = 4) {
	if (value == null || Number.isNaN(value)) {
		return '-';
	}

	return value.toFixed(digits);
}

function formatSignedNumber(value: number | null | undefined, digits = 6) {
	if (value == null || Number.isNaN(value)) {
		return '-';
	}

	return `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
}

function formatPercent(value: number | null | undefined, digits = 2) {
	if (value == null || Number.isNaN(value)) {
		return '-';
	}

	return `${(value * 100).toFixed(digits)}%`;
}

function formatDuration(milliseconds: number | null | undefined) {
	if (milliseconds == null || Number.isNaN(milliseconds)) {
		return '-';
	}

	if (milliseconds < 1000) {
		return `${milliseconds} ms`;
	}

	return `${(milliseconds / 1000).toFixed(2)} s`;
}

function ResultMetricCard({
	icon,
	label,
	value,
	detail,
	iconClassName
}: {
	icon: ReactNode;
	label: string;
	value: string;
	detail: string;
	iconClassName: string;
}) {
	return (
		<div className={WHITE_CARD_CLASS_NAME}>
			<div className='flex items-start justify-between gap-3'>
				<div className='space-y-1'>
					<p className={LABEL_CLASS_NAME}>{label}</p>
					<p className='text-[2rem] leading-[1.1] font-semibold tracking-[-0.04em] text-foreground'>{value}</p>
				</div>
				<div className={cn('clay-icon-chip border-black/10 text-foreground', iconClassName)}>{icon}</div>
			</div>
			<p className='mt-3 text-sm leading-6 text-muted-foreground'>{detail}</p>
		</div>
	);
}

function SelectionSummaryCard({
	title,
	icon,
	selection,
	extraLine,
	toneClassName
}: {
	title: string;
	icon: React.ReactNode;
	selection: PortfolioQuantumState;
	extraLine?: string;
	toneClassName: string;
}) {
	return (
		<div className={cn('rounded-[2rem] border border-black/10 p-5 shadow-[var(--clay-shadow)]', toneClassName)}>
			<div className='flex items-start justify-between gap-3'>
				<div>
					<p className='clay-label text-foreground'>{title}</p>
					<p className='mt-3 break-all font-mono text-xl font-semibold tracking-[-0.03em] text-foreground'>
						{selection.bitstring || '-'}
					</p>
				</div>
				<div className='clay-icon-chip bg-white/82 text-foreground'>{icon}</div>
			</div>
			<div className='mt-5 space-y-2 text-sm leading-6 text-black/72'>
				<p>Objective: {formatSignedNumber(selection.objective)}</p>
				<p>Return: {formatPercent(selection.expected_return)}</p>
				<p>Volatility: {formatPercent(selection.volatility)}</p>
				<p>Assets: {selection.selected_assets.join(', ') || '-'}</p>
				{extraLine ? <p>{extraLine}</p> : null}
			</div>
		</div>
	);
}

function StatTile({ label, value }: { label: string; value: string }) {
	return (
		<div className={SOFT_PANEL_CLASS_NAME}>
			<p className={LABEL_CLASS_NAME}>{label}</p>
			<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>{value}</p>
		</div>
	);
}

export function PortfolioResultDashboard({ result, jobId }: { result: FinancialAnalysisResult; jobId: string }) {
	const frontier = result.benchmark.frontier.efficient_frontier;
	const topStates = result.quantum_execution?.top_states ?? [];
	const gateCounts = Object.entries(result.quantum_execution?.circuit_summary?.gate_counts ?? {}).sort(
		(left, right) => right[1] - left[1]
	);
	const assetChartData = result.asset_universe
		.slice()
		.sort((left, right) => right.selection_probability - left.selection_probability)
		.slice(0, 10)
		.map(asset => ({
			ticker: asset.ticker,
			returnPct: Number((asset.annualized_return * 100).toFixed(2)),
			selectionPct: Number((asset.selection_probability * 100).toFixed(2))
		}));
	const plan = result.quantum_execution?.plan;
	const hasPlan = Boolean(plan?.plan_id);
	const planAssignments = plan?.assignments ?? {};
	const planFragmentCount = hasPlan ? (plan?.fragment_order.length ?? 0) : 0;
	const fragmentResults = result.quantum_execution?.fragment_results ?? [];
	const fragmentStatusCounts = fragmentResults.reduce<Record<string, number>>((acc, fragment) => {
		acc[fragment.status] = (acc[fragment.status] ?? 0) + 1;
		return acc;
	}, {});
	const routedNodeCount = hasPlan
		? new Set(
				Object.values(planAssignments)
					.map(assignment => assignment.primary_node_id)
					.filter(nodeId => nodeId.length > 0)
			).size
		: result.distributed_nodes_used;
	const quantumResult = result.quantum_execution?.quantum_result;
	const observedBasisStates = quantumResult?.counts ? Object.keys(quantumResult.counts).length : 0;
	const hamiltonian = result.quantum_execution?.hamiltonian;

	return (
		<div className='space-y-8'>
			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<ResultMetricCard
					icon={<ScaleIcon className='size-5' />}
					iconClassName='bg-[rgb(248_204_101_/_0.34)] text-black'
					label='Search space'
					value={`${result.solver_diagnostics.feasible_portfolio_count} feasible`}
					detail={`${result.solver_diagnostics.total_binary_states.toLocaleString()} binary states screened at budget ${result.request.budget}.`}
				/>
				<ResultMetricCard
					icon={<ZapIcon className='size-5' />}
					iconClassName='bg-[rgb(193_176_255_/_0.34)] text-[var(--clay-ube-dark)]'
					label='Quantum rank'
					value={String(result.benchmark.frontier.quantum_rank ?? '-')}
					detail={`Percentile ${formatPercent(result.benchmark.frontier.quantum_percentile)} on the exact feasible set.`}
				/>
				<ResultMetricCard
					icon={<TrendingUpIcon className='size-5' />}
					iconClassName='bg-[rgb(132_231_165_/_0.34)] text-[var(--clay-matcha-dark)]'
					label='Feasible mass'
					value={formatPercent(result.benchmark.comparison.feasible_probability_mass)}
					detail={`Optimum state probability ${formatPercent(result.benchmark.comparison.optimum_probability)}.`}
				/>
				<ResultMetricCard
					icon={<NetworkIcon className='size-5' />}
					iconClassName='bg-[rgb(59_211_253_/_0.28)] text-[var(--clay-blueberry)]'
					label='Runtime route'
					value={`${result.fragments_executed} fragments`}
					detail={`${routedNodeCount} routed nodes and ${formatDuration(result.analysis_duration_ms)} end-to-end.`}
				/>
			</div>

			{result.comparison_report ? (
				<PortfolioComparisonReportSection
					report={result.comparison_report}
					jobId={jobId}
				/>
			) : null}

			<div className='grid gap-6 xl:grid-cols-[1.08fr_0.92fr]'>
				<div className='space-y-6'>
					<div className='clay-section p-4 md:p-6'>
						<div className='space-y-5'>
							<div className='space-y-2'>
								<p className={LABEL_CLASS_NAME}>Exact benchmark summary</p>
								<h2
									id='benchmark'
									className='text-3xl font-semibold leading-[0.98] tracking-[-0.05em] text-foreground md:text-4xl'
								>
									Exact classical enumeration versus the best feasible quantum state.
								</h2>
								<p className='max-w-3xl text-sm leading-7 text-muted-foreground md:text-base'>{result.summary}</p>
							</div>

							<div className='grid gap-4 md:grid-cols-2'>
								<SelectionSummaryCard
									title='Classical optimum'
									icon={<CheckCircle2Icon className='size-5' />}
									toneClassName='bg-[linear-gradient(135deg,rgba(248,204,101,0.36),rgba(255,255,255,0.96))]'
									selection={result.benchmark.classical}
								/>
								<SelectionSummaryCard
									title='Quantum candidate'
									icon={<CpuIcon className='size-5' />}
									toneClassName='bg-[linear-gradient(135deg,rgba(59,211,253,0.28),rgba(255,255,255,0.96))]'
									selection={result.benchmark.quantum}
									extraLine={`Probability: ${formatPercent(result.benchmark.quantum.probability)}`}
								/>
							</div>

							<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
								<StatTile
									label='Objective gap'
									value={formatSignedNumber(result.benchmark.comparison.objective_gap)}
								/>
								<StatTile
									label='Objective ratio'
									value={formatNumber(result.benchmark.comparison.objective_ratio, 4)}
								/>
								<StatTile
									label='Asset overlap'
									value={formatPercent(result.benchmark.comparison.overlap_ratio)}
								/>
								<StatTile
									label='On frontier'
									value={result.benchmark.frontier.quantum_on_frontier ? 'Yes' : 'No'}
								/>
							</div>

							<div className='flex flex-wrap gap-2'>
								<Badge className={SOFT_BADGE_CLASS_NAME}>{result.dataset.input_layout} input</Badge>
								<Badge className={SOFT_BADGE_CLASS_NAME}>{result.dataset.inferred_frequency}</Badge>
								<Badge className={SOFT_BADGE_CLASS_NAME}>{result.request.resolved_value_mode}</Badge>
								<Badge className={SOFT_BADGE_CLASS_NAME}>{result.solver_diagnostics.allocation_model}</Badge>
							</div>

							<Button
								asChild
								className={cn('h-11 px-5', BUTTON_CLASS_NAME)}
							>
								<Link href={`/runs/${encodeURIComponent(jobId)}`}>
									<GitBranchIcon className='size-4' />
									Inspect distributed run detail
								</Link>
							</Button>
						</div>
					</div>

					<div
						id='frontier'
						className={WHITE_CARD_CLASS_NAME}
					>
						<div className='space-y-2'>
							<p className={LABEL_CLASS_NAME}>Exact efficient frontier</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
								Every point here is an exact feasible portfolio from the screened search space.
							</h3>
							<p className='text-sm leading-7 text-muted-foreground'>
								The frontier below is not a heuristic sample. It is the ranked feasible set used to evaluate
								the quantum candidate honestly.
							</p>
						</div>
						<div className='mt-5 grid gap-3 sm:grid-cols-3'>
							<StatTile label='Frontier points' value={String(frontier.length)} />
							<StatTile label='Best frontier return' value={formatPercent(frontier[0]?.expected_return)} />
							<StatTile
								label='Quantum percentile'
								value={formatPercent(result.benchmark.frontier.quantum_percentile)}
							/>
						</div>
						<div className='mt-5 overflow-x-auto'>
							<div className={TABLE_FRAME_CLASS_NAME}>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Rank</TableHead>
											<TableHead>Bitstring</TableHead>
											<TableHead className='text-right'>Return</TableHead>
											<TableHead className='text-right'>Volatility</TableHead>
											<TableHead className='text-right'>Objective</TableHead>
											<TableHead>Assets</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{frontier.length ? (
											frontier.map(candidate => (
												<TableRow key={`frontier-${candidate.bitstring}`}>
													<TableCell>{candidate.rank ?? '-'}</TableCell>
													<TableCell className='max-w-[12rem] break-all font-mono'>
														{candidate.bitstring}
													</TableCell>
													<TableCell className='text-right'>
														{formatPercent(candidate.expected_return)}
													</TableCell>
													<TableCell className='text-right'>
														{formatPercent(candidate.volatility)}
													</TableCell>
													<TableCell className='text-right'>
														{formatSignedNumber(candidate.objective)}
													</TableCell>
													<TableCell>{candidate.selected_assets.join(', ') || '-'}</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={6}
													className='text-center text-muted-foreground'
												>
													No frontier points returned.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</div>
					</div>
				</div>

				<div className='space-y-6'>
					<div className={WHITE_CARD_CLASS_NAME}>
						<div className='space-y-2'>
							<p className={LABEL_CLASS_NAME}>Dataset and solver context</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
								Resolved schema, optimization request, and parameter search diagnostics.
							</h3>
						</div>
						<div className='mt-5 space-y-4'>
							<div className={SOFT_PANEL_CLASS_NAME}>
								<p className={LABEL_CLASS_NAME}>Dataset</p>
								<dl className='mt-4 grid gap-x-5 gap-y-2 text-sm leading-6 text-foreground md:grid-cols-[8rem_minmax(0,1fr)]'>
									<dt className='text-muted-foreground'>Date range</dt>
									<dd>
										{result.dataset.start_date} to {result.dataset.end_date}
									</dd>
									<dt className='text-muted-foreground'>Periods</dt>
									<dd>{result.dataset.period_count}</dd>
									<dt className='text-muted-foreground'>Raw assets</dt>
									<dd>{result.dataset.raw_asset_count}</dd>
									<dt className='text-muted-foreground'>Screened assets</dt>
									<dd>{result.dataset.asset_count}</dd>
									<dt className='text-muted-foreground'>Columns</dt>
									<dd>
										{result.dataset.date_column}
										{result.dataset.ticker_column ? ` / ${result.dataset.ticker_column}` : ''}
										{result.dataset.value_column ? ` / ${result.dataset.value_column}` : ''}
									</dd>
									<dt className='text-muted-foreground'>Dropped rows</dt>
									<dd>{result.dataset.dropped_records}</dd>
								</dl>
							</div>
							<div className={SOFT_PANEL_CLASS_NAME}>
								<p className={LABEL_CLASS_NAME}>Solver request</p>
								<dl className='mt-4 grid gap-x-5 gap-y-2 text-sm leading-6 text-foreground md:grid-cols-[8rem_minmax(0,1fr)]'>
									<dt className='text-muted-foreground'>Objective</dt>
									<dd className='break-words'>{result.benchmark.objective_label}</dd>
									<dt className='text-muted-foreground'>Risk aversion</dt>
									<dd>{formatNumber(result.request.risk_aversion, 4)}</dd>
									<dt className='text-muted-foreground'>Penalty</dt>
									<dd>{formatNumber(result.request.penalty, 4)}</dd>
									<dt className='text-muted-foreground'>QAOA reps</dt>
									<dd>{result.request.qaoa_reps}</dd>
									<dt className='text-muted-foreground'>Search steps</dt>
									<dd>{result.request.parameter_search_steps}</dd>
									<dt className='text-muted-foreground'>Timings</dt>
									<dd>
										Classical {formatDuration(result.benchmark.timings.classical_duration_ms)} / Quantum{' '}
										{formatDuration(result.benchmark.timings.quantum_duration_ms)}
									</dd>
								</dl>
							</div>
							<div className={cn(SOFT_PANEL_CLASS_NAME, 'clay-dashed')}>
								<p className={LABEL_CLASS_NAME}>Parameter search</p>
								<dl className='mt-4 grid gap-x-5 gap-y-2 text-sm leading-6 text-foreground md:grid-cols-[9rem_minmax(0,1fr)]'>
									<dt className='text-muted-foreground'>Strategy</dt>
									<dd>{result.solver_diagnostics.quantum_solver.strategy}</dd>
									<dt className='text-muted-foreground'>Evaluations</dt>
									<dd>{result.solver_diagnostics.quantum_solver.parameter_evaluations}</dd>
									<dt className='text-muted-foreground'>Coarse grid</dt>
									<dd>{result.solver_diagnostics.quantum_solver.coarse_grid_steps}</dd>
									<dt className='text-muted-foreground'>Local rounds</dt>
									<dd>{result.solver_diagnostics.quantum_solver.local_refinement_rounds}</dd>
									<dt className='text-muted-foreground'>Local points</dt>
									<dd>{result.solver_diagnostics.quantum_solver.local_refinement_points}</dd>
								</dl>
							</div>
						</div>
					</div>

					<div className='rounded-[2.4rem] border border-black/10 bg-[var(--clay-blueberry)] p-4 text-white shadow-[var(--clay-shadow)] md:p-6'>
						<div
							id='execution'
							className='space-y-5'
						>
							<div className='space-y-2'>
								<p className='clay-label text-white/70'>Runtime evidence</p>
								<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-white'>
									What actually got routed and observed after the portfolio circuit left the solver.
								</h3>
							</div>

							<div className='grid gap-3 sm:grid-cols-2'>
								<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
									<p className='clay-label text-white/70'>Plan</p>
									<p className='mt-2 break-all text-sm font-medium text-white'>
										{hasPlan ? plan?.plan_id : 'Not returned'}
									</p>
								</div>
								<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
									<p className='clay-label text-white/70'>Quality snapshot</p>
									<p className='mt-2 break-all text-sm font-medium text-white'>
										{hasPlan ? plan?.quality_snapshot_id || '-' : '-'}
									</p>
								</div>
								<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
									<p className='clay-label text-white/70'>Plan fragments</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
										{planFragmentCount}
									</p>
								</div>
								<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
									<p className='clay-label text-white/70'>Observed basis states</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
										{observedBasisStates}
									</p>
								</div>
							</div>

							<div className='rounded-[1.6rem] border border-white/12 bg-white/10 p-5'>
								<p className='clay-label text-white/70'>Fragment statuses</p>
								<div className='mt-4 flex flex-wrap gap-2'>
									{Object.keys(fragmentStatusCounts).length ? (
										Object.entries(fragmentStatusCounts).map(([status, count]) => (
											<Badge
												key={status}
												className={DARK_BADGE_CLASS_NAME}
											>
												{status}: {count}
											</Badge>
										))
									) : (
										<span className='text-sm leading-6 text-white/75'>No fragment results returned.</span>
									)}
								</div>
							</div>

							<dl className='grid gap-x-6 gap-y-3 text-sm leading-6 text-white/85 md:grid-cols-[9rem_minmax(0,1fr)]'>
								<dt className='text-white/60'>Shots</dt>
								<dd>{quantumResult?.shots ?? '-'}</dd>
								<dt className='text-white/60'>Measured qubits</dt>
								<dd>{quantumResult?.measured_qubits?.join(', ') || '-'}</dd>
								<dt className='text-white/60'>Top counts</dt>
								<dd>{quantumResult?.counts ? Object.keys(quantumResult.counts).slice(0, 4).join(', ') : '-'}</dd>
								<dt className='text-white/60'>Advantage flag</dt>
								<dd>{result.benchmark.comparison.quantum_advantage_detected ? 'Detected' : 'Not detected'}</dd>
							</dl>
						</div>
					</div>
				</div>
			</div>

			<div className='grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'>
				<div className={WHITE_CARD_CLASS_NAME}>
					<div className='space-y-2'>
						<p className={LABEL_CLASS_NAME}>Screened asset universe</p>
						<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
							Annualized return and selection mass for the tickers that made the binary solve.
						</h3>
					</div>
					<div className='mt-5 h-72 rounded-[1.7rem] border border-[var(--clay-oat)] bg-[rgb(250_249_247_/_0.88)] p-3 shadow-[var(--clay-shadow)]'>
						<ResponsiveContainer
							width='100%'
							height='100%'
						>
							<BarChart data={assetChartData}>
								<CartesianGrid
									stroke='rgb(85 83 78 / 0.18)'
									strokeDasharray='4 4'
									vertical={false}
								/>
								<XAxis
									dataKey='ticker'
									stroke='rgb(85 83 78 / 0.75)'
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									stroke='rgb(85 83 78 / 0.75)'
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip
									cursor={{ fill: 'rgb(250 249 247 / 0.82)' }}
									contentStyle={{
										borderRadius: '18px',
										border: '1px solid var(--clay-oat)',
										boxShadow: 'var(--clay-shadow)',
										background: 'white'
									}}
								/>
								<Bar
									dataKey='returnPct'
									fill='#3bd3fd'
									name='Annualized return %'
									radius={[12, 12, 0, 0]}
								/>
								<Bar
									dataKey='selectionPct'
									fill='#fbbd41'
									name='Selection probability %'
									radius={[12, 12, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className='mt-5 overflow-x-auto'>
						<div className='max-h-[26rem] overflow-auto rounded-[1.8rem] border border-[var(--clay-oat)] bg-white shadow-[var(--clay-shadow)]'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Ticker</TableHead>
										<TableHead className='text-right'>Return</TableHead>
										<TableHead className='text-right'>Volatility</TableHead>
										<TableHead className='text-right'>Selection</TableHead>
										<TableHead>Flags</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.asset_universe.map(asset => (
										<TableRow key={asset.ticker}>
											<TableCell className='font-medium'>{asset.ticker}</TableCell>
											<TableCell className='text-right'>{formatPercent(asset.annualized_return)}</TableCell>
											<TableCell className='text-right'>
												{formatPercent(asset.annualized_volatility)}
											</TableCell>
											<TableCell className='text-right'>{formatPercent(asset.selection_probability)}</TableCell>
											<TableCell>
												<div className='flex flex-wrap gap-2'>
													{asset.selected_classical ? (
														<Badge className={SOFT_BADGE_CLASS_NAME}>classical</Badge>
													) : null}
													{asset.selected_quantum ? (
														<Badge className={SOFT_BADGE_CLASS_NAME}>quantum</Badge>
													) : null}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>
				</div>

				<div className={WHITE_CARD_CLASS_NAME}>
					<div
						id='states'
						className='space-y-5'
					>
						<div className='space-y-2'>
							<p className={LABEL_CLASS_NAME}>Top quantum states</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
								Highest-probability bitstrings seen in the QAOA state distribution after tuning.
							</h3>
						</div>
						<div className='overflow-x-auto'>
							<div className='max-h-[26rem] overflow-auto rounded-[1.8rem] border border-[var(--clay-oat)] bg-white shadow-[var(--clay-shadow)]'>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Rank</TableHead>
											<TableHead>Bitstring</TableHead>
											<TableHead className='text-right'>Probability</TableHead>
											<TableHead className='text-right'>Objective</TableHead>
											<TableHead>Assets</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{topStates.length ? (
											topStates.map(state => (
												<TableRow key={`${state.bitstring}-${state.rank ?? 0}`}>
													<TableCell>{state.rank ?? '-'}</TableCell>
													<TableCell className='max-w-[12rem] break-all font-mono'>{state.bitstring}</TableCell>
													<TableCell className='text-right'>{formatPercent(state.probability)}</TableCell>
													<TableCell className='text-right'>{formatSignedNumber(state.objective)}</TableCell>
													<TableCell>{state.selected_assets.join(', ') || '-'}</TableCell>
												</TableRow>
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={5}
													className='text-center text-muted-foreground'
												>
													No top-state payload returned.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>
						</div>
						<div className='rounded-[1.7rem] border border-black/10 bg-[linear-gradient(135deg,rgba(193,176,255,0.24),rgba(255,255,255,0.96))] p-5 shadow-[var(--clay-shadow)]'>
							<div className='flex items-center gap-3'>
								<div className='clay-icon-chip bg-white/80 text-[var(--clay-ube-dark)]'>
									<BarChart2Icon className='size-5' />
								</div>
								<div>
									<p className='clay-label text-foreground'>Benchmark interpretation</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										The quantum benchmark comes from the actual state distribution.
									</p>
								</div>
							</div>
							<p className='mt-4 text-sm leading-7 text-black/72'>
								The quantum benchmark is derived from the highest-probability feasible bitstring, not a
								classical post-hoc replacement. Non-feasible states stay visible here so you can see where
								amplitude mass was actually concentrated.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className='rounded-[2.4rem] border border-black/10 bg-[linear-gradient(135deg,rgba(1,65,141,0.92),rgba(1,65,141,0.82),rgba(67,8,159,0.86))] p-4 text-white shadow-[var(--clay-shadow)] md:p-6'>
				<div className='grid gap-6 xl:grid-cols-[0.88fr_1.12fr]'>
					<div className='space-y-5'>
						<div className='space-y-2'>
							<p className='clay-label text-white/70'>Quantum execution details</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-white'>
								Compiled QASM, circuit size, and Hamiltonian terms that define the routed solve.
							</h3>
						</div>
						<div className='grid gap-3 sm:grid-cols-2'>
							<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
								<p className='clay-label text-white/70'>Qubits</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
									{result.quantum_execution?.circuit_summary?.qubit_count ?? '-'}
								</p>
							</div>
							<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
								<p className='clay-label text-white/70'>Depth</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
									{result.quantum_execution?.circuit_summary?.depth ?? '-'}
								</p>
							</div>
							<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
								<p className='clay-label text-white/70'>Beta</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
									{formatNumber(result.quantum_execution?.qaoa_parameters?.beta, 4)}
								</p>
							</div>
							<div className='rounded-[1.45rem] border border-white/12 bg-white/10 p-4'>
								<p className='clay-label text-white/70'>Gamma</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
									{formatNumber(result.quantum_execution?.qaoa_parameters?.gamma, 4)}
								</p>
							</div>
						</div>
						<div className='rounded-[1.6rem] border border-white/12 bg-white/10 p-5'>
							<p className='clay-label text-white/70'>Gate counts</p>
							<div className='mt-4 flex flex-wrap gap-2'>
								{gateCounts.length ? (
									gateCounts.map(([gate, count]) => (
										<Badge
											key={gate}
											className={DARK_BADGE_CLASS_NAME}
										>
											{gate}: {count}
										</Badge>
									))
								) : (
									<span className='text-sm leading-6 text-white/75'>No circuit summary returned.</span>
								)}
							</div>
						</div>
						<div className='rounded-[1.6rem] border border-white/12 bg-white/10 p-5'>
							<div className='flex items-center gap-3'>
								<div className='clay-icon-chip bg-white/16 text-white'>
									<FileCode2Icon className='size-5' />
								</div>
								<div>
									<p className='clay-label text-white/70'>Hamiltonian summary</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-white'>
										Cost surface handed to QAOA.
									</p>
								</div>
							</div>
							<dl className='mt-5 grid gap-x-6 gap-y-3 text-sm leading-6 text-white/85 md:grid-cols-[9rem_minmax(0,1fr)]'>
								<dt className='text-white/60'>Offset</dt>
								<dd>{formatSignedNumber(hamiltonian?.offset, 6)}</dd>
								<dt className='text-white/60'>Linear fields</dt>
								<dd>{hamiltonian?.linear_fields.length ?? 0}</dd>
								<dt className='text-white/60'>Couplings</dt>
								<dd>{hamiltonian?.couplings.length ?? 0}</dd>
								<dt className='text-white/60'>Penalty strategy</dt>
								<dd>{hamiltonian?.penalty_strategy ?? '-'}</dd>
							</dl>
						</div>
					</div>
					<div className='space-y-2'>
						<p className='clay-label text-white/70'>Compiled OpenQASM</p>
						<Textarea
							readOnly
							value={result.quantum_execution?.circuit_text ?? ''}
							className='min-h-[16rem] resize-y rounded-[1.8rem] border border-white/12 bg-[rgb(6_17_49_/_0.5)] font-mono text-xs text-white shadow-[var(--clay-shadow)] md:min-h-[22rem]'
						/>
					</div>
				</div>
			</div>

			<div className='rounded-[2.4rem] border border-black/10 bg-[linear-gradient(135deg,rgba(248,204,101,0.26),rgba(252,121,129,0.14),rgba(255,255,255,0.95))] p-4 shadow-[var(--clay-shadow)] md:p-6'>
				<div className='space-y-5'>
					<div className='space-y-2'>
						<p className={LABEL_CLASS_NAME}>Warnings and caveats</p>
						<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
							Carry these into any investor-facing quantum versus classical claim.
						</h3>
					</div>
					<div className='grid gap-4 md:grid-cols-2'>
						<div className='rounded-[1.7rem] border border-black/10 bg-white/86 p-5 shadow-[var(--clay-shadow)]'>
							<div className='flex items-center gap-3'>
								<div className='clay-icon-chip bg-[rgb(132_231_165_/_0.32)] text-[var(--clay-matcha-dark)]'>
									<TrendingUpIcon className='size-5' />
								</div>
								<div>
									<p className='clay-label text-foreground'>Classical selection</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										{result.benchmark.classical.selected_assets.join(', ') || '-'}
									</p>
								</div>
							</div>
						</div>
						<div className='rounded-[1.7rem] border border-black/10 bg-white/86 p-5 shadow-[var(--clay-shadow)]'>
							<div className='flex items-center gap-3'>
								<div className='clay-icon-chip bg-[rgb(59_211_253_/_0.28)] text-[var(--clay-blueberry)]'>
									<CpuIcon className='size-5' />
								</div>
								<div>
									<p className='clay-label text-foreground'>Quantum selection</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										{result.benchmark.quantum.selected_assets.join(', ') || '-'}
									</p>
								</div>
							</div>
						</div>
					</div>
					<div className='space-y-3'>
						<div className='flex items-center gap-3'>
							<div className='clay-icon-chip bg-[rgb(252_121_129_/_0.2)] text-[#842432]'>
								<AlertTriangleIcon className='size-5' />
							</div>
							<div>
								<p className={LABEL_CLASS_NAME}>Warnings</p>
								<p className='mt-1 text-xl font-semibold tracking-[-0.03em] text-foreground'>
									Benchmark caveats worth stating explicitly.
								</p>
							</div>
						</div>
						{result.warnings.length ? (
							<div className='space-y-3'>
								{result.warnings.map(warning => (
									<div
										key={warning}
										className='rounded-[1.45rem] border border-[var(--clay-oat)] bg-white/86 p-4 text-sm leading-7 text-muted-foreground shadow-[var(--clay-shadow)]'
									>
										{warning}
									</div>
								))}
							</div>
						) : (
							<div className='rounded-[1.45rem] border border-dashed border-[var(--clay-oat)] bg-white/80 p-4 text-sm leading-6 text-muted-foreground shadow-[var(--clay-shadow)]'>
								No warnings returned by the backend.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
