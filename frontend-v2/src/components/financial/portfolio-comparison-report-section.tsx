'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	CpuIcon,
	FileJsonIcon,
	ScaleIcon,
	ShieldCheckIcon,
	TimerIcon
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
	FinancialComparisonPitchPosition,
	FinancialComparisonReport,
	FinancialComparisonWinner
} from '@/types/financial';

const WHITE_CARD_CLASS_NAME =
	'rounded-[1.9rem] border border-[var(--clay-oat)] bg-white p-5 text-foreground shadow-[var(--clay-shadow)]';
const LABEL_CLASS_NAME = 'clay-label text-[var(--clay-charcoal)]';
const BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-black/10 bg-white text-black shadow-[var(--clay-shadow)] hover:bg-[rgb(248_204_101_/_0.32)]';

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

function titleCaseFromKey(value: string) {
	return value
		.split('_')
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function winnerLabel(winner: FinancialComparisonWinner) {
	switch (winner) {
		case 'classical':
			return 'Classical';
		case 'quantum':
			return 'Quantum';
		case 'tie':
			return 'Tie';
		default:
			return 'Inconclusive';
	}
}

function pitchLabel(position: FinancialComparisonPitchPosition) {
	switch (position) {
		case 'numerical_advantage':
			return 'Numerical advantage';
		case 'mixed':
			return 'Mixed signal';
		case 'workflow_evidence':
			return 'Workflow evidence';
		default:
			return 'Not ready';
	}
}

function pitchBadgeClassName(position: FinancialComparisonPitchPosition) {
	switch (position) {
		case 'numerical_advantage':
			return 'border-black/10 bg-[rgb(132_231_165_/_0.22)] text-[var(--clay-matcha-dark)]';
		case 'mixed':
			return 'border-black/10 bg-[rgb(248_204_101_/_0.24)] text-black';
		case 'workflow_evidence':
			return 'border-black/10 bg-[rgb(59_211_253_/_0.2)] text-[var(--clay-blueberry)]';
		default:
			return 'border-black/10 bg-[rgb(252_121_129_/_0.18)] text-[#842432]';
	}
}

function readinessBadgeClassName(readiness: FinancialComparisonReport['verdict']['claim_readiness']) {
	switch (readiness) {
		case 'ready':
			return 'border-black/10 bg-[rgb(132_231_165_/_0.22)] text-[var(--clay-matcha-dark)]';
		case 'qualified':
			return 'border-black/10 bg-[rgb(193_176_255_/_0.24)] text-[var(--clay-ube-dark)]';
		default:
			return 'border-black/10 bg-[rgb(252_121_129_/_0.18)] text-[#842432]';
	}
}

function MetricCard({
	label,
	value,
	detail,
	icon,
	iconClassName
}: {
	label: string;
	value: string;
	detail: string;
	icon: ReactNode;
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

function ClaimList({
	title,
	items,
	icon,
	iconClassName,
	dashed = false
}: {
	title: string;
	items: string[];
	icon: ReactNode;
	iconClassName: string;
	dashed?: boolean;
}) {
	return (
		<div className={cn(WHITE_CARD_CLASS_NAME, dashed && 'clay-dashed')}>
			<div className='flex items-center gap-3'>
				<div className={cn('clay-icon-chip border-black/10 text-foreground', iconClassName)}>{icon}</div>
				<div>
					<p className={LABEL_CLASS_NAME}>Claim framing</p>
					<p className='mt-1 text-2xl font-semibold tracking-[-0.04em] text-foreground'>{title}</p>
				</div>
			</div>
			<div className='mt-5 space-y-3'>
				{items.map(item => (
					<div
						key={item}
						className='rounded-[1.35rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.9)] p-4 text-sm leading-6 text-muted-foreground'
					>
						{item}
					</div>
				))}
			</div>
		</div>
	);
}

function CandidateCard({
	title,
	bitstring,
	assetLine,
	objectiveLine,
	runtimeLine,
	probabilityLine,
	icon,
	toneClassName
}: {
	title: string;
	bitstring: string;
	assetLine: string;
	objectiveLine: string;
	runtimeLine: string;
	probabilityLine?: string;
	icon: ReactNode;
	toneClassName: string;
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
			<div className='mt-5 space-y-2 text-sm leading-6 text-black/70'>
				<p>{assetLine}</p>
				<p>{objectiveLine}</p>
				<p>{runtimeLine}</p>
				{probabilityLine ? <p>{probabilityLine}</p> : null}
			</div>
		</div>
	);
}

export function PortfolioComparisonReportSection({
	report,
	jobId
}: {
	report: FinancialComparisonReport;
	jobId: string;
}) {
	return (
		<section
			id='comparison'
			className='space-y-6'
		>
			<div className='rounded-[2.6rem] border border-black/10 bg-[var(--clay-matcha-dark)] p-4 text-white shadow-[var(--clay-shadow)] md:p-6'>
				<div className='grid gap-6'>
					<div className='flex flex-wrap items-start justify-between gap-4'>
						<div className='max-w-4xl space-y-4'>
							<div className='flex flex-wrap gap-2'>
								<Badge
									variant='outline'
									className={cn(
										'rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--clay-shadow)]',
										pitchBadgeClassName(report.verdict.pitch_position)
									)}
								>
									{pitchLabel(report.verdict.pitch_position)}
								</Badge>
								<Badge
									variant='outline'
									className={cn(
										'rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--clay-shadow)]',
										readinessBadgeClassName(report.verdict.claim_readiness)
									)}
								>
									{titleCaseFromKey(report.verdict.claim_readiness)}
								</Badge>
							</div>
							<div className='space-y-2'>
								<p className='clay-label text-white/70'>Investor comparison</p>
								<h2 className='text-3xl font-semibold leading-[0.96] tracking-[-0.05em] text-white md:text-5xl'>
									Quantum versus classical, framed for the same portfolio problem.
								</h2>
								<p className='max-w-3xl text-base leading-7 text-white/76'>
									Investor-facing readout built from the same dataset, same screened universe, same
									constraints, and same objective. This section is meant to be the honest claim surface for
									Track B.
								</p>
							</div>
						</div>
						<Button
							variant='outline'
							asChild
							className={cn('h-11 px-5', BUTTON_CLASS_NAME)}
						>
							<Link
								href={`/api/finance/${encodeURIComponent(jobId)}/comparison`}
								target='_blank'
							>
								<FileJsonIcon className='size-4' />
								Open JSON
							</Link>
						</Button>
					</div>

					<div className='rounded-[2rem] border border-black/10 bg-white p-5 text-foreground shadow-[var(--clay-shadow)] md:p-6'>
						<p className={LABEL_CLASS_NAME}>Verdict</p>
						<p className='mt-3 text-[2rem] leading-[1.1] font-semibold tracking-[-0.04em] text-foreground'>
							{report.verdict.headline}
						</p>
						<p className='mt-4 max-w-4xl text-sm leading-7 text-muted-foreground md:text-base'>
							{report.verdict.summary}
						</p>
					</div>

					<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
						<MetricCard
							icon={<ShieldCheckIcon className='size-5' />}
							iconClassName='bg-[rgb(132_231_165_/_0.32)] text-[var(--clay-matcha-dark)]'
							label='Fairness'
							value={
								report.fairness.same_dataset &&
								report.fairness.same_constraints &&
								report.fairness.same_objective
									? 'Aligned'
									: 'Check inputs'
							}
							detail='Same screened dataset, portfolio constraints, and objective were used on both sides of the comparison.'
						/>
						<MetricCard
							icon={<ScaleIcon className='size-5' />}
							iconClassName='bg-[rgb(248_204_101_/_0.34)] text-black'
							label='Objective winner'
							value={winnerLabel(report.scorecard.winner_by_objective)}
							detail={`Gap ${formatSignedNumber(report.scorecard.objective_gap)} on ${report.problem.objective_label}.`}
						/>
						<MetricCard
							icon={<TimerIcon className='size-5' />}
							iconClassName='bg-[rgb(193_176_255_/_0.34)] text-[var(--clay-ube-dark)]'
							label='Runtime winner'
							value={winnerLabel(report.scorecard.winner_by_runtime)}
							detail={`Classical ${formatDuration(report.classical.duration_ms)} versus quantum ${formatDuration(report.quantum.duration_ms)}.`}
						/>
						<MetricCard
							icon={<CpuIcon className='size-5' />}
							iconClassName='bg-[rgb(59_211_253_/_0.28)] text-[var(--clay-blueberry)]'
							label='Feasible mass'
							value={formatPercent(report.quantum.feasible_probability_mass)}
							detail={`Quantum candidate rank ${report.quantum.rank ?? '-'} and percentile ${formatPercent(report.quantum.percentile)}.`}
						/>
					</div>

					<div className='grid gap-4 xl:grid-cols-[1.08fr_0.92fr]'>
						<div className={WHITE_CARD_CLASS_NAME}>
							<p className={LABEL_CLASS_NAME}>Benchmark contract</p>
							<p className='mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground'>Same input, same target, same constraints.</p>
							<div className='mt-5 space-y-3'>
								{report.fairness.notes.map(note => (
									<div
										key={note}
									className='rounded-[1.35rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.9)] p-4 text-sm leading-6 text-muted-foreground'
									>
										{note}
									</div>
								))}
							</div>
							<dl className='mt-6 grid gap-x-6 gap-y-3 text-sm leading-6 text-foreground md:grid-cols-[10rem_minmax(0,1fr)]'>
								<dt className='text-muted-foreground'>Dataset window</dt>
								<dd>
									{report.dataset.start_date} to {report.dataset.end_date}
								</dd>
								<dt className='text-muted-foreground'>Shape</dt>
								<dd>
									{report.dataset.row_count.toLocaleString()} rows x {report.dataset.col_count} cols
								</dd>
								<dt className='text-muted-foreground'>Screened assets</dt>
								<dd>{report.dataset.asset_count}</dd>
								<dt className='text-muted-foreground'>Budget</dt>
								<dd>{report.problem.budget}</dd>
								<dt className='text-muted-foreground'>Risk aversion</dt>
								<dd>{report.problem.risk_aversion.toFixed(4)}</dd>
								<dt className='text-muted-foreground'>Quantum strategy</dt>
								<dd>{report.problem.quantum_strategy}</dd>
							</dl>
						</div>

						<div className={cn(WHITE_CARD_CLASS_NAME, 'clay-dashed')}>
							<p className={LABEL_CLASS_NAME}>Scorecard</p>
							<p className='mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground'>What the scoreboard actually says.</p>
							<div className='mt-5 grid gap-3 sm:grid-cols-2'>
								<div className='rounded-[1.4rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.9)] p-4'>
									<p className={LABEL_CLASS_NAME}>Return winner</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										{winnerLabel(report.scorecard.winner_by_return)}
									</p>
									<p className='mt-2 text-sm leading-6 text-muted-foreground'>
										Gap {formatSignedNumber(report.scorecard.return_gap)}
									</p>
								</div>
								<div className='rounded-[1.4rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.9)] p-4'>
									<p className={LABEL_CLASS_NAME}>Risk winner</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										{winnerLabel(report.scorecard.winner_by_risk)}
									</p>
									<p className='mt-2 text-sm leading-6 text-muted-foreground'>
										Variance gap {formatSignedNumber(report.scorecard.variance_gap)}
									</p>
								</div>
								<div className='rounded-[1.4rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.9)] p-4'>
									<p className={LABEL_CLASS_NAME}>Overlap</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										{formatPercent(report.scorecard.overlap_ratio)}
									</p>
									<p className='mt-2 text-sm leading-6 text-muted-foreground'>
										{report.scorecard.overlap_count} shared assets between portfolios
									</p>
								</div>
								<div className='rounded-[1.4rem] border border-[var(--clay-oat-light)] bg-[rgb(250_249_247_/_0.9)] p-4'>
									<p className={LABEL_CLASS_NAME}>Runtime evidence</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										{report.quantum.fragments_executed} fragments
									</p>
									<p className='mt-2 text-sm leading-6 text-muted-foreground'>
										{report.quantum.distributed_nodes_used} nodes and{' '}
										{report.evidence.observed_basis_state_count} observed basis states
									</p>
								</div>
							</div>
						</div>
					</div>

					<div className='grid gap-4 xl:grid-cols-2'>
						<ClaimList
							title='What this run supports'
							items={
								report.verdict.recommended_claims.length
									? report.verdict.recommended_claims
									: report.verdict.strengths
							}
							icon={<CheckCircle2Icon className='size-5' />}
							iconClassName='bg-[rgb(132_231_165_/_0.32)] text-[var(--clay-matcha-dark)]'
						/>
						<ClaimList
							title='What not to claim'
							items={
								report.verdict.avoid_claims.length
									? report.verdict.avoid_claims
									: report.verdict.limitations
							}
							icon={<AlertTriangleIcon className='size-5' />}
							iconClassName='bg-[rgb(252_121_129_/_0.22)] text-[#842432]'
							dashed
						/>
					</div>

					<div className='grid gap-4 xl:grid-cols-2'>
						<ClaimList
							title='Strengths'
							items={report.verdict.strengths}
							icon={<CheckCircle2Icon className='size-5' />}
							iconClassName='bg-[rgb(59_211_253_/_0.28)] text-[var(--clay-blueberry)]'
						/>
						<ClaimList
							title='Limitations'
							items={report.verdict.limitations}
							icon={<AlertTriangleIcon className='size-5' />}
							iconClassName='bg-[rgb(248_204_101_/_0.34)] text-black'
							dashed
						/>
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<CandidateCard
							title='Classical optimum'
							icon={<ScaleIcon className='size-5' />}
							toneClassName='bg-[linear-gradient(135deg,rgba(248,204,101,0.38),rgba(255,255,255,0.96))]'
							bitstring={report.classical.bitstring || '-'}
							assetLine={`Assets: ${report.classical.selected_assets.join(', ') || '-'}`}
							objectiveLine={`Objective: ${formatSignedNumber(report.classical.objective)}`}
							runtimeLine={`Runtime: ${formatDuration(report.classical.duration_ms)}`}
						/>
						<CandidateCard
							title='Quantum candidate'
							icon={<CpuIcon className='size-5' />}
							toneClassName='bg-[linear-gradient(135deg,rgba(59,211,253,0.32),rgba(255,255,255,0.96))]'
							bitstring={report.quantum.bitstring || '-'}
							assetLine={`Assets: ${report.quantum.selected_assets.join(', ') || '-'}`}
							objectiveLine={`Objective: ${formatSignedNumber(report.quantum.objective)}`}
							runtimeLine={`Runtime: ${formatDuration(report.quantum.duration_ms)}`}
							probabilityLine={`Probability: ${formatPercent(report.quantum.probability)}`}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
