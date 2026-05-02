'use client';

import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { FinancialJobStatus } from '@/types/financial';

const STATUS_STEPS: FinancialJobStatus[] = ['QUEUED', 'INGESTING', 'ANALYSING', 'COMPLETED'];

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

export function FinanceJobProgress({ status }: { status: FinancialJobStatus }) {
	const stepIndex = STATUS_STEPS.indexOf(status);
	const isFailed = status === 'FAILED';
	const effectiveIndex = isFailed ? STATUS_STEPS.length - 2 : Math.max(stepIndex, 0);
	const progress = isFailed ? 100 : Math.round(((Math.max(stepIndex, 0) + 1) / STATUS_STEPS.length) * 100);

	return (
		<div className='clay-card clay-panel-slushie space-y-5 p-5'>
			<div className='flex items-center justify-between gap-4'>
				<div>
					<p className='clay-label'>Live workflow</p>
					<p className='mt-2 text-base font-semibold text-foreground'>
						{isFailed
							? 'Execution stopped before completion'
							: status === 'QUEUED'
								? 'Queued for processing'
								: status === 'INGESTING'
									? 'Normalizing portfolio dataset'
									: status === 'ANALYSING'
										? 'Building and routing quantum solve'
										: 'Execution complete'}
					</p>
				</div>
				<div
					className={cn(
						'rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--clay-shadow)]',
						statusBadgeClassName(status)
					)}
				>
					{status.toLowerCase()}
				</div>
			</div>
			<Progress
				value={progress}
				className={cn(
					'h-3 rounded-full border border-black/10 bg-white/70 [&>div]:rounded-full',
					isFailed ? '[&>div]:bg-destructive' : '[&>div]:bg-[var(--clay-blueberry)]'
				)}
			/>
			<div className='grid grid-cols-2 gap-3 text-xs sm:grid-cols-4'>
				{STATUS_STEPS.map((step, index) => {
					const completed = index <= effectiveIndex;
					const current = !isFailed && index === stepIndex && status !== 'COMPLETED';
					const terminalFailure = isFailed && index === STATUS_STEPS.length - 1;

					return (
						<div
							key={step}
							className='rounded-[1.35rem] border border-black/10 bg-white/72 p-3 text-center shadow-[var(--clay-shadow)]'
						>
							<div
								className={cn(
									'mx-auto flex size-8 items-center justify-center rounded-full border text-[11px] shadow-[var(--clay-shadow)]',
									terminalFailure
										? 'border-[rgb(201_76_87_/_0.24)] bg-[rgb(252_121_129_/_0.2)] text-[#842432]'
										: completed
											? 'border-[rgb(2_73_42_/_0.14)] bg-[rgb(132_231_165_/_0.7)] text-[var(--clay-matcha-dark)]'
											: current
												? 'border-[rgb(1_65_141_/_0.16)] bg-[rgb(59_211_253_/_0.3)] text-[var(--clay-blueberry)]'
												: 'border-[var(--clay-oat)] bg-[var(--clay-cream)] text-muted-foreground'
								)}
							>
								{terminalFailure ? (
									<XCircleIcon className='size-3.5' />
								) : current ? (
									<Loader2Icon className='size-3.5 animate-spin' />
								) : completed ? (
									<CheckCircle2Icon className='size-3.5' />
								) : (
									index + 1
								)}
							</div>
							<p className='mt-3 font-medium text-foreground'>
								{step === 'QUEUED'
									? 'Queued'
									: step === 'INGESTING'
										? 'Ingest'
										: step === 'ANALYSING'
											? 'Optimize'
											: isFailed
												? 'Failed'
												: 'Complete'}
							</p>
						</div>
					);
				})}
			</div>
		</div>
	);
}
