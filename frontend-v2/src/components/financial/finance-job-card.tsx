'use client';

import Link from 'next/link';
import { ActivityIcon, GitBranchIcon, Loader2Icon, XCircleIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FinancialJobResponse, FinancialJobStatus } from '@/types/financial';

const SECONDARY_BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-[var(--clay-oat)] bg-white text-foreground shadow-[var(--clay-shadow)] hover:bg-[rgb(248_204_101_/_0.32)]';
const PRIMARY_BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-black/10 bg-[var(--clay-blueberry)] text-white shadow-[var(--clay-shadow)] hover:bg-[var(--clay-ube-dark)]';
const GHOST_BUTTON_CLASS_NAME =
	'rounded-full border border-transparent bg-transparent text-[var(--clay-charcoal)] hover:border-[var(--clay-oat)] hover:bg-white/80 hover:text-foreground';
const SOFT_BADGE_CLASS_NAME =
	'rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground shadow-[var(--clay-shadow)]';

function formatDateTime(isoValue: string | null | undefined) {
	if (!isoValue) {
		return '-';
	}

	const date = new Date(isoValue);
	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(date);
}

function statusBadgeClassName(status: FinancialJobStatus) {
	switch (status) {
		case 'COMPLETED':
			return 'border-[rgb(2_73_42_/_0.14)] bg-[rgb(132_231_165_/_0.62)] text-[var(--clay-matcha-dark)]';
		case 'FAILED':
			return 'border-[rgb(201_76_87_/_0.24)] bg-[rgb(252_121_129_/_0.22)] text-[#842432]';
		default:
			return 'border-[rgb(1_65_141_/_0.16)] bg-[rgb(59_211_253_/_0.2)] text-[var(--clay-blueberry)]';
	}
}

function jobSummaryPanelClassName(status: FinancialJobStatus) {
	switch (status) {
		case 'COMPLETED':
			return 'clay-panel-matcha';
		case 'FAILED':
			return 'clay-panel-pomegranate';
		case 'ANALYSING':
			return 'clay-panel-ube';
		default:
			return 'clay-panel-slushie';
	}
}

function WorkflowStatusBadge({ status, className }: { status: FinancialJobStatus; className?: string }) {
	return (
		<Badge
			variant='outline'
			className={cn(
				'rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--clay-shadow)]',
				statusBadgeClassName(status),
				className
			)}
		>
			{status.toLowerCase()}
		</Badge>
	);
}

export function FinanceJobCard({
	job,
	jobId,
	loadError,
	loading,
	isRefreshing,
	onRefresh,
	onClear
}: {
	job: FinancialJobResponse | null;
	jobId: string | null;
	loadError: string | null;
	loading: boolean;
	isRefreshing: boolean;
	onRefresh: () => void;
	onClear: () => void;
}) {
	return (
		<Card className='clay-card border-[var(--clay-oat)] bg-white/84 shadow-[var(--clay-shadow)]'>
			<CardHeader className='border-b border-[var(--clay-oat)]'>
				<div className='space-y-2'>
					<p className='clay-label'>Selected benchmark run</p>
					<CardTitle className='text-2xl font-semibold tracking-[-0.04em]'>Watch the active Track B job.</CardTitle>
					<CardDescription className='text-sm leading-6 text-muted-foreground'>
						{jobId
							? 'Track the live optimization workflow, inspect the result payload, and jump into the distributed run detail.'
							: 'Select a submitted finance job or upload a new market dataset.'}
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className='space-y-4 pt-6'>
				{loadError ? (
					<Alert variant='destructive'>
						<XCircleIcon className='size-4' />
						<AlertTitle>Job load failed</AlertTitle>
						<AlertDescription>{loadError}</AlertDescription>
					</Alert>
				) : null}

				{loading && !job ? (
					<div className='clay-card clay-panel-slushie flex items-center gap-3 p-4 text-sm text-muted-foreground'>
						<Loader2Icon className='size-4 animate-spin' />
						Loading selected finance run...
					</div>
				) : null}

				{job ? (
					<>
						<div
							className={cn(
								'rounded-[2.15rem] border border-black/10 p-5 shadow-[var(--clay-shadow)]',
								jobSummaryPanelClassName(job.status)
							)}
						>
							<div className='flex flex-wrap items-start justify-between gap-4'>
								<div className='space-y-3'>
									<div className='flex flex-wrap items-center gap-2'>
										<WorkflowStatusBadge status={job.status} />
										<Badge className={SOFT_BADGE_CLASS_NAME}>
											{job.problem_type ?? job.result?.problem_type ?? 'portfolio_optimization'}
										</Badge>
									</div>
									<div className='space-y-2'>
										<p className='clay-label text-foreground'>Benchmark file</p>
										<p className='text-2xl font-semibold tracking-[-0.04em] text-foreground'>
											{job.filename}
										</p>
										<p className='font-mono text-xs text-black/65'>{job.job_id}</p>
									</div>
								</div>
								<div className='flex flex-wrap gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={onRefresh}
										disabled={isRefreshing}
										className={cn('h-10 px-4', SECONDARY_BUTTON_CLASS_NAME)}
									>
										{isRefreshing ? (
											<Loader2Icon className='size-4 animate-spin' />
										) : (
											<ActivityIcon className='size-4' />
										)}
										Refresh
									</Button>
									<Button
										size='sm'
										asChild
										className={cn('h-10 px-4', PRIMARY_BUTTON_CLASS_NAME)}
									>
										<Link href={`/runs/${encodeURIComponent(job.job_id)}`}>
											<GitBranchIcon className='size-4' />
											Open run detail
										</Link>
									</Button>
									<Button
										variant='ghost'
										size='sm'
										onClick={onClear}
										className={cn('h-10 px-4', GHOST_BUTTON_CLASS_NAME)}
									>
										Clear
									</Button>
								</div>
							</div>
							<div className='mt-5 grid gap-3 sm:grid-cols-2'>
								<div className='rounded-[1.45rem] border border-black/10 bg-white/74 p-4 shadow-[var(--clay-shadow)]'>
									<p className='clay-label text-[var(--clay-charcoal)]'>Created</p>
									<p className='mt-2 text-sm text-foreground'>{formatDateTime(job.created_at)}</p>
								</div>
								<div className='rounded-[1.45rem] border border-black/10 bg-white/74 p-4 shadow-[var(--clay-shadow)]'>
									<p className='clay-label text-[var(--clay-charcoal)]'>Updated</p>
									<p className='mt-2 text-sm text-foreground'>{formatDateTime(job.updated_at)}</p>
								</div>
							</div>
						</div>

						{job.status === 'FAILED' && job.error ? (
							<Alert variant='destructive'>
								<XCircleIcon className='size-4' />
								<AlertTitle>Finance job failed</AlertTitle>
								<AlertDescription>{job.error}</AlertDescription>
							</Alert>
						) : null}
					</>
				) : !loading && !loadError ? (
					<div className='clay-card clay-dashed p-6 text-sm text-muted-foreground'>
						No finance run selected yet. Pick one from the recent jobs lane or submit a new CSV.
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
