'use client';

import type { ReactNode } from 'react';
import {
	BarChart2Icon,
	CheckCircle2Icon,
	CpuIcon,
	DatabaseIcon,
	NetworkIcon,
	ScaleIcon
} from 'lucide-react';

import { PortfolioComparisonReportSection } from '@/components/financial/portfolio-comparison-report-section';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { FinancialAnalysisResult } from '@/types/financial';
import type { RunDetail } from '@/types/runs';

const WHITE_CARD_CLASS_NAME =
	'rounded-[1.95rem] border border-[var(--clay-oat)] bg-white p-5 text-foreground shadow-[var(--clay-shadow)]';
const SOFT_PANEL_CLASS_NAME =
	'rounded-[1.45rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.92)] p-4';
const LABEL_CLASS_NAME = 'clay-label text-[var(--clay-charcoal)]';
const TABLE_FRAME_CLASS_NAME =
	'max-h-[28rem] overflow-auto rounded-[1.8rem] border border-[var(--clay-oat)] bg-white shadow-[var(--clay-shadow)]';

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

function SummaryCard({
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

function BenchmarkChoiceCard({
	title,
	bitstring,
	icon,
	toneClassName,
	lines
}: {
	title: string;
	bitstring: string;
	icon: ReactNode;
	toneClassName: string;
	lines: string[];
}) {
	return (
		<div className={cn('rounded-[2rem] border border-black/10 p-5 shadow-[var(--clay-shadow)]', toneClassName)}>
			<div className='flex items-center gap-3'>
				<div className='clay-icon-chip bg-white/80 text-foreground'>{icon}</div>
				<div>
					<p className='clay-label text-foreground'>{title}</p>
					<p className='mt-2 break-all font-mono text-lg font-semibold tracking-[-0.03em] text-foreground'>
						{bitstring || '-'}
					</p>
				</div>
			</div>
			<div className='mt-5 space-y-2 text-sm leading-6 text-black/72'>
				{lines.map(line => (
					<p key={line}>{line}</p>
				))}
			</div>
		</div>
	);
}

export function PortfolioBenchmarkAnalysisSection({
	run,
	result
}: {
	run: RunDetail;
	result: FinancialAnalysisResult;
}) {
	const gateCounts = Object.entries(result.quantum_execution?.circuit_summary?.gate_counts ?? {}).sort(
		(left, right) => right[1] - left[1]
	);
	const topStates = result.quantum_execution?.top_states ?? [];
	const frontier = result.benchmark.frontier.efficient_frontier;

	return (
		<section
			id='analysis'
			className='scroll-mt-4 space-y-8'
		>
			{result.comparison_report ? (
				<PortfolioComparisonReportSection
					report={result.comparison_report}
					jobId={run.id}
				/>
			) : null}

			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<SummaryCard
					icon={<DatabaseIcon className='size-5' />}
					iconClassName='bg-[rgb(248_204_101_/_0.34)] text-black'
					label='Dataset'
					value={`${result.dataset.asset_count} assets`}
					detail={`${result.dataset.period_count} aligned periods from ${result.row_count.toLocaleString()} rows.`}
				/>
				<SummaryCard
					icon={<ScaleIcon className='size-5' />}
					iconClassName='bg-[rgb(132_231_165_/_0.34)] text-[var(--clay-matcha-dark)]'
					label='Search space'
					value={`${result.solver_diagnostics.feasible_portfolio_count} feasible`}
					detail={`${result.solver_diagnostics.total_binary_states.toLocaleString()} total bitstrings at budget ${result.request.budget}.`}
				/>
				<SummaryCard
					icon={<CpuIcon className='size-5' />}
					iconClassName='bg-[rgb(193_176_255_/_0.34)] text-[var(--clay-ube-dark)]'
					label='Quantum rank'
					value={String(result.benchmark.frontier.quantum_rank ?? '-')}
					detail={`Percentile ${formatPercent(result.benchmark.frontier.quantum_percentile)} / feasible mass ${formatPercent(result.benchmark.comparison.feasible_probability_mass)}.`}
				/>
				<SummaryCard
					icon={<NetworkIcon className='size-5' />}
					iconClassName='bg-[rgb(59_211_253_/_0.28)] text-[var(--clay-blueberry)]'
					label='Distributed runtime'
					value={`${result.fragments_executed} fragments`}
					detail={`${result.distributed_nodes_used} nodes / ${formatDuration(result.analysis_duration_ms)}.`}
				/>
			</div>

			<div
				id='benchmark'
				className='grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'
			>
				<div className='clay-section p-4 md:p-6'>
					<div className='space-y-5'>
						<div className='space-y-2'>
							<p className={LABEL_CLASS_NAME}>Benchmark summary</p>
							<h2 className='text-3xl font-semibold leading-[0.98] tracking-[-0.05em] text-foreground md:text-4xl'>
								Exact classical optimum against the highest-ranked feasible quantum state.
							</h2>
						</div>
						<div className='grid gap-4 md:grid-cols-2'>
							<BenchmarkChoiceCard
								title='Classical optimum'
								icon={<CheckCircle2Icon className='size-5' />}
								toneClassName='bg-[linear-gradient(135deg,rgba(248,204,101,0.36),rgba(255,255,255,0.96))]'
								bitstring={result.benchmark.classical.bitstring}
								lines={[
									`Objective: ${formatSignedNumber(result.benchmark.classical.objective)}`,
									`Return: ${formatPercent(result.benchmark.classical.expected_return)}`,
									`Volatility: ${formatPercent(result.benchmark.classical.volatility)}`,
									`Assets: ${result.benchmark.classical.selected_assets.join(', ') || '-'}`
								]}
							/>
							<BenchmarkChoiceCard
								title='Quantum candidate'
								icon={<CpuIcon className='size-5' />}
								toneClassName='bg-[linear-gradient(135deg,rgba(59,211,253,0.28),rgba(255,255,255,0.96))]'
								bitstring={result.benchmark.quantum.bitstring}
								lines={[
									`Objective: ${formatSignedNumber(result.benchmark.quantum.objective)}`,
									`Return: ${formatPercent(result.benchmark.quantum.expected_return)}`,
									`Volatility: ${formatPercent(result.benchmark.quantum.volatility)}`,
									`Probability: ${formatPercent(result.benchmark.quantum.probability)}`
								]}
							/>
						</div>
						<div className='grid gap-3 md:grid-cols-4'>
							<div className={SOFT_PANEL_CLASS_NAME}>
								<p className={LABEL_CLASS_NAME}>Objective gap</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
									{formatSignedNumber(result.benchmark.comparison.objective_gap)}
								</p>
							</div>
							<div className={SOFT_PANEL_CLASS_NAME}>
								<p className={LABEL_CLASS_NAME}>Asset overlap</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
									{result.benchmark.comparison.overlap_count} / {result.request.budget}
								</p>
							</div>
							<div className={SOFT_PANEL_CLASS_NAME}>
								<p className={LABEL_CLASS_NAME}>On frontier</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
									{result.benchmark.frontier.quantum_on_frontier ? 'Yes' : 'No'}
								</p>
							</div>
							<div className={SOFT_PANEL_CLASS_NAME}>
								<p className={LABEL_CLASS_NAME}>Advantage flag</p>
								<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
									{result.benchmark.comparison.quantum_advantage_detected ? 'Detected' : 'Not detected'}
								</p>
							</div>
						</div>
						<dl className='grid gap-x-6 gap-y-3 text-sm leading-6 text-foreground md:grid-cols-[10rem_minmax(0,1fr)]'>
							<dt className='text-muted-foreground'>Objective</dt>
							<dd className='break-words'>{result.benchmark.objective_label}</dd>
							<dt className='text-muted-foreground'>Allocation model</dt>
							<dd>{result.benchmark.allocation_model ?? result.solver_diagnostics.allocation_model}</dd>
							<dt className='text-muted-foreground'>Penalty</dt>
							<dd>{formatNumber(result.request.penalty, 4)}</dd>
							<dt className='text-muted-foreground'>Timings</dt>
							<dd>
								Classical {formatDuration(result.benchmark.timings.classical_duration_ms)} / Quantum{' '}
								{formatDuration(result.benchmark.timings.quantum_duration_ms)}
							</dd>
							<dt className='text-muted-foreground'>Run surface</dt>
							<dd>{run.circuitText.trim() ? 'QASM surfaced in this run' : 'Run text unavailable'}</dd>
						</dl>
					</div>
				</div>

				<div
					id='frontier'
					className={WHITE_CARD_CLASS_NAME}
				>
					<div className='space-y-2'>
						<p className={LABEL_CLASS_NAME}>Exact frontier</p>
						<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
							Every point below is an exact feasible portfolio from the screened binary search space.
						</h3>
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

			<div className='grid gap-6 xl:grid-cols-[0.9fr_1.1fr]'>
				<div
					id='execution'
					className='rounded-[2.4rem] border border-black/10 bg-[var(--clay-blueberry)] p-4 text-white shadow-[var(--clay-shadow)] md:p-6'
				>
					<div className='space-y-5'>
						<div className='space-y-2'>
							<p className='clay-label text-white/70'>Execution metadata</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-white'>
								QAOA search settings, compiled circuit size, and routed execution metadata.
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
						<dl className='grid gap-x-6 gap-y-3 text-sm leading-6 text-white/85 md:grid-cols-[11rem_minmax(0,1fr)]'>
							<dt className='text-white/60'>Quantum solver</dt>
							<dd>{result.solver_diagnostics.quantum_solver.strategy}</dd>
							<dt className='text-white/60'>Parameter evaluations</dt>
							<dd>{result.solver_diagnostics.quantum_solver.parameter_evaluations}</dd>
							<dt className='text-white/60'>Coarse grid</dt>
							<dd>{result.solver_diagnostics.quantum_solver.coarse_grid_steps} steps</dd>
							<dt className='text-white/60'>Local refinement</dt>
							<dd>{result.solver_diagnostics.quantum_solver.local_refinement_rounds} rounds</dd>
							<dt className='text-white/60'>Fragments</dt>
							<dd>{result.fragments_executed}</dd>
							<dt className='text-white/60'>Nodes used</dt>
							<dd>{result.distributed_nodes_used}</dd>
						</dl>
						<div className='rounded-[1.6rem] border border-white/12 bg-white/10 p-5'>
							<p className='clay-label text-white/70'>Gate counts</p>
							<div className='mt-4 flex flex-wrap gap-2'>
								{gateCounts.length ? (
									gateCounts.map(([gate, count]) => (
										<Badge
											key={gate}
											className='rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white'
										>
											{gate}: {count}
										</Badge>
									))
								) : (
									<span className='text-sm leading-6 text-white/75'>No circuit summary returned.</span>
								)}
							</div>
						</div>
					</div>
				</div>

				<div
					id='states'
					className={WHITE_CARD_CLASS_NAME}
				>
					<div className='space-y-5'>
						<div className='space-y-2'>
							<p className={LABEL_CLASS_NAME}>Top quantum states</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
								Highest-probability states from the QAOA wavefunction after parameter search.
							</h3>
						</div>
						<div className='overflow-x-auto'>
							<div className='max-h-[24rem] overflow-auto rounded-[1.8rem] border border-[var(--clay-oat)] bg-white shadow-[var(--clay-shadow)]'>
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
													<TableCell className='max-w-[12rem] break-all font-mono'>
														{state.bitstring}
													</TableCell>
													<TableCell className='text-right'>
														{formatPercent(state.probability)}
													</TableCell>
													<TableCell className='text-right'>
														{formatSignedNumber(state.objective)}
													</TableCell>
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
						<div className='rounded-[1.6rem] border border-black/10 bg-[linear-gradient(135deg,rgba(59,211,253,0.22),rgba(255,255,255,0.96))] p-5 shadow-[var(--clay-shadow)]'>
							<div className='flex items-center gap-3'>
								<div className='clay-icon-chip bg-white/80 text-[var(--clay-blueberry)]'>
									<BarChart2Icon className='size-5' />
								</div>
								<div>
									<p className={LABEL_CLASS_NAME}>Asset universe</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										Selection mass across the screened tickers.
									</p>
								</div>
							</div>
							<div className='mt-4 overflow-x-auto'>
								<div className='max-h-[18rem] overflow-auto rounded-[1.4rem] border border-[var(--clay-oat)] bg-white/90 shadow-[var(--clay-shadow)]'>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Ticker</TableHead>
												<TableHead className='text-right'>Return</TableHead>
												<TableHead className='text-right'>Volatility</TableHead>
												<TableHead className='text-right'>Selection</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{result.asset_universe.map(asset => (
												<TableRow key={`asset-${asset.ticker}`}>
													<TableCell className='font-medium'>{asset.ticker}</TableCell>
													<TableCell className='text-right'>
														{formatPercent(asset.annualized_return)}
													</TableCell>
													<TableCell className='text-right'>
														{formatPercent(asset.annualized_volatility)}
													</TableCell>
													<TableCell className='text-right'>
														{formatPercent(asset.selection_probability)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{result.warnings.length ? (
				<div className='rounded-[2.2rem] border border-black/10 bg-[linear-gradient(135deg,rgba(248,204,101,0.24),rgba(255,255,255,0.96))] p-4 shadow-[var(--clay-shadow)] md:p-6'>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<p className={LABEL_CLASS_NAME}>Warnings</p>
							<h3 className='text-[2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-foreground'>
								Carry these caveats into any quantum-vs-classical claims.
							</h3>
						</div>
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
					</div>
				</div>
			) : null}
		</section>
	);
}
