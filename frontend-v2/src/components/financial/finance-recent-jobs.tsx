'use client';

import { ActivityIcon, Loader2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FinancialJobStatus } from '@/types/financial';
import type { BackendFinancialJobListItem } from '@/types/runs';

const SECONDARY_BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-[var(--clay-oat)] bg-white text-foreground shadow-[var(--clay-shadow)] hover:bg-[rgb(248_204_101_/_0.32)]';
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

function WorkflowStatusBadge({ status }: { status: FinancialJobStatus }) {
	return (
		<div
			className={cn(
				'rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--clay-shadow)]',
				statusBadgeClassName(status)
			)}
		>
			{status.toLowerCase()}
		</div>
	);
}

export function FinanceRecentJobs({
	jobs,
	activeJobId,
	refreshing,
	onRefresh,
	onSelect
}: {
	jobs: BackendFinancialJobListItem[];
	activeJobId: string | null;
	refreshing: boolean;
	onRefresh: () => void;
	onSelect: (jobId: string) => void;
}) {
	return (
		<Card className='clay-card border-[var(--clay-oat)] bg-white/84 shadow-[var(--clay-shadow)]'>
			<CardHeader className='border-b border-[var(--clay-oat)]'>
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div className='space-y-2'>
						<p className='clay-label'>Recent finance jobs</p>
						<CardTitle className='text-2xl font-semibold tracking-[-0.04em]'>Jump back into existing runs.</CardTitle>
						<CardDescription className='text-sm leading-6 text-muted-foreground'>
							Use an existing benchmark result or watch a live submission finish.
						</CardDescription>
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={onRefresh}
						disabled={refreshing}
						className={cn('h-10 px-4', SECONDARY_BUTTON_CLASS_NAME)}
					>
						{refreshing ? <Loader2Icon className='size-4 animate-spin' /> : <ActivityIcon className='size-4' />}
						Refresh jobs
					</Button>
				</div>
			</CardHeader>
			<CardContent className='space-y-3 pt-6'>
				{jobs.length === 0 ? (
					<div className='clay-card clay-dashed p-4 text-sm text-muted-foreground'>
						No finance jobs have been submitted yet.
					</div>
				) : (
					<div className='space-y-3'>
						{jobs.map(job => (
							<button
								key={job.job_id}
								type='button'
								onClick={() => onSelect(job.job_id)}
								className={cn(
									'clay-hover-lift w-full rounded-[1.7rem] border p-4 text-left shadow-[var(--clay-shadow)] transition',
									activeJobId === job.job_id
										? 'border-black/10 bg-[linear-gradient(135deg,rgba(132,231,165,0.34),rgba(255,255,255,0.95))]'
										: 'border-[var(--clay-oat)] bg-white/78 hover:bg-[linear-gradient(135deg,rgba(248,204,101,0.18),rgba(255,255,255,0.95))]'
								)}
							>
								<div className='flex flex-wrap items-start justify-between gap-3'>
									<div className='space-y-2'>
										<p className='font-semibold tracking-[-0.02em] text-foreground'>{job.filename}</p>
										<p className='font-mono text-xs text-muted-foreground'>{job.job_id}</p>
									</div>
									<WorkflowStatusBadge status={job.status} />
								</div>
								<div className='mt-4 flex flex-wrap gap-2'>
									<Badge className={SOFT_BADGE_CLASS_NAME}>{job.problem_type ?? 'portfolio_optimization'}</Badge>
									<Badge className={SOFT_BADGE_CLASS_NAME}>{formatDateTime(job.updated_at)}</Badge>
									<Badge className={SOFT_BADGE_CLASS_NAME}>
										{job.row_count != null && job.col_count != null
											? `${job.row_count.toLocaleString()} rows x ${job.col_count} cols`
											: 'Pending result'}
									</Badge>
								</div>
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
