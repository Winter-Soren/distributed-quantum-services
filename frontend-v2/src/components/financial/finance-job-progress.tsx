'use client';

import { Progress } from '@/components/ui/progress';
import type { FinancialJobStatus } from '@/types/financial';

const STEPS: FinancialJobStatus[] = ['QUEUED', 'INGESTING', 'ANALYSING', 'COMPLETED'];

const STEP_LABEL: Record<string, string> = {
	QUEUED: 'Queued',
	INGESTING: 'Ingest',
	ANALYSING: 'Optimize',
	COMPLETED: 'Complete'
};

const STATUS_DESCRIPTION: Partial<Record<FinancialJobStatus, string>> = {
	QUEUED: 'Queued for processing',
	INGESTING: 'Normalizing portfolio dataset',
	ANALYSING: 'Building and routing quantum solve',
	COMPLETED: 'Execution complete'
};

export function FinanceJobProgress({ status }: { status: FinancialJobStatus }) {
	const isFailed = status === 'FAILED';
	const stepIndex = STEPS.indexOf(status);
	const effectiveIndex = isFailed ? STEPS.indexOf('ANALYSING') : Math.max(stepIndex, 0);
	const progress = isFailed ? 100 : Math.round(((Math.max(stepIndex, 0) + 1) / STEPS.length) * 100);

	return (
		<div className='space-y-3 rounded-md border border-border bg-card p-4'>
			<div className='flex items-center justify-between gap-2'>
				<p className='text-sm text-foreground'>
					{isFailed ? 'Execution stopped' : (STATUS_DESCRIPTION[status] ?? status.toLowerCase())}
				</p>
				<span
					className={`rounded px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${
						isFailed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
					}`}
				>
					{status.toLowerCase()}
				</span>
			</div>

			<Progress
				value={progress}
				className={`h-1.5 ${isFailed ? '[&>div]:bg-destructive' : '[&>div]:bg-primary'}`}
			/>

			<div className='flex gap-2'>
				{STEPS.map((step, index) => {
					const done = index <= effectiveIndex;
					const current = !isFailed && index === stepIndex && status !== 'COMPLETED';
					const terminalFail = isFailed && index === STEPS.length - 1;
					return (
						<div
							key={step}
							className={`flex-1 rounded px-2 py-1.5 text-center text-[0.68rem] font-medium ${
								terminalFail
									? 'bg-red-100 text-red-800'
									: done
										? 'bg-primary/10 text-primary'
										: current
											? 'bg-blue-100 text-blue-800'
											: 'bg-muted text-muted-foreground'
							}`}
						>
							{terminalFail ? 'Failed' : STEP_LABEL[step]}
						</div>
					);
				})}
			</div>
		</div>
	);
}
