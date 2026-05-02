'use client';

import { ActivityIcon, Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { FinancialJobStatus } from '@/types/financial';
import type { BackendFinancialJobListItem } from '@/types/runs';

function formatDateTime(isoValue: string | null | undefined) {
	if (!isoValue) return '—';
	const date = new Date(isoValue);
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function StatusChip({ status }: { status: FinancialJobStatus }) {
	const cls =
		status === 'COMPLETED'
			? 'bg-green-100 text-green-800'
			: status === 'FAILED'
				? 'bg-red-100 text-red-800'
				: 'bg-blue-100 text-blue-800';
	return (
		<span className={`rounded px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${cls}`}>
			{status.toLowerCase()}
		</span>
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
		<div className='space-y-2'>
			<div className='flex items-center justify-between gap-2'>
				<p className='text-sm font-semibold text-foreground'>Recent jobs</p>
				<Button size='sm' variant='outline' onClick={onRefresh} disabled={refreshing}>
					{refreshing ? <Loader2Icon className='size-3.5 animate-spin' /> : <ActivityIcon className='size-3.5' />}
					Refresh
				</Button>
			</div>

			{jobs.length === 0 ? (
				<div className='rounded-md border border-dashed border-border px-4 py-4 text-sm text-muted-foreground'>
					No finance jobs submitted yet.
				</div>
			) : (
				<div className='divide-y divide-border rounded-md border border-border'>
					{jobs.map(job => (
						<button
							key={job.job_id}
							type='button'
							onClick={() => onSelect(job.job_id)}
							className={`w-full px-4 py-3 text-left transition-colors hover:bg-accent ${
								activeJobId === job.job_id ? 'bg-accent' : ''
							}`}
						>
							<div className='flex items-start justify-between gap-2'>
								<div className='min-w-0 space-y-0.5'>
									<p className='truncate text-sm font-medium text-foreground'>{job.filename}</p>
									<p className='font-mono text-xs text-muted-foreground'>{job.job_id}</p>
									<p className='text-xs text-muted-foreground'>
										{job.problem_type ?? 'portfolio_optimization'} ·{' '}
										{job.row_count != null && job.col_count != null
											? `${job.row_count.toLocaleString()} × ${job.col_count}`
											: 'pending'}{' '}
										· {formatDateTime(job.updated_at)}
									</p>
								</div>
								<StatusChip status={job.status} />
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
}
