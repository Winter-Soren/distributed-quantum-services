'use client';

import Link from 'next/link';
import { ActivityIcon, GitBranchIcon, Loader2Icon, XCircleIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { FinancialJobResponse, FinancialJobStatus } from '@/types/financial';

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
		<span className={`inline-block rounded px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${cls}`}>
			{status.toLowerCase()}
		</span>
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
		<div className='space-y-3'>
			<div className='flex items-center justify-between gap-2'>
				<p className='text-sm font-semibold text-foreground'>Active run</p>
				{jobId ? (
					<div className='flex gap-2'>
						<Button size='sm' variant='outline' onClick={onRefresh} disabled={isRefreshing}>
							{isRefreshing ? <Loader2Icon className='size-3.5 animate-spin' /> : <ActivityIcon className='size-3.5' />}
							Refresh
						</Button>
						<Button size='sm' variant='ghost' onClick={onClear}>
							Clear
						</Button>
					</div>
				) : null}
			</div>

			{loadError ? (
				<Alert variant='destructive'>
					<XCircleIcon className='size-4' />
					<AlertTitle>Job load failed</AlertTitle>
					<AlertDescription>{loadError}</AlertDescription>
				</Alert>
			) : null}

			{loading && !job ? (
				<div className='flex items-center gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground'>
					<Loader2Icon className='size-4 animate-spin' />
					Loading run…
				</div>
			) : null}

			{job ? (
				<div className='rounded-md border border-border bg-card p-4 space-y-3'>
					<div className='flex flex-wrap items-start justify-between gap-3'>
						<div className='space-y-1'>
							<p className='font-medium text-foreground'>{job.filename}</p>
							<p className='font-mono text-xs text-muted-foreground'>{job.job_id}</p>
							<p className='text-xs text-muted-foreground'>
								{job.problem_type ?? job.result?.problem_type ?? 'portfolio_optimization'}
							</p>
						</div>
						<StatusChip status={job.status} />
					</div>
					<div className='grid grid-cols-2 gap-3 text-xs text-muted-foreground'>
						<div>
							<span className='font-medium text-foreground'>Created</span>
							<p>{formatDateTime(job.created_at)}</p>
						</div>
						<div>
							<span className='font-medium text-foreground'>Updated</span>
							<p>{formatDateTime(job.updated_at)}</p>
						</div>
					</div>
					<Button size='sm' asChild className='w-full'>
						<Link href={`/runs/${encodeURIComponent(job.job_id)}`}>
							<GitBranchIcon className='size-3.5' />
							Open run detail
						</Link>
					</Button>
					{job.status === 'FAILED' && job.error ? (
						<Alert variant='destructive'>
							<XCircleIcon className='size-4' />
							<AlertTitle>Job failed</AlertTitle>
							<AlertDescription>{job.error}</AlertDescription>
						</Alert>
					) : null}
				</div>
			) : !loading && !loadError ? (
				<div className='rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground'>
					No run selected. Pick one from the list below or submit a new CSV.
				</div>
			) : null}
		</div>
	);
}
