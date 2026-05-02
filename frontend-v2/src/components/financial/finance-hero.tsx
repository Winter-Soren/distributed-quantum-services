'use client';

import { CheckCircle2Icon, CpuIcon, BarChart2Icon, FileTextIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SOFT_BADGE_CLASS_NAME =
	'rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground shadow-[var(--clay-shadow)]';

function HeroSignalCard({
	icon,
	label,
	description,
	toneClassName
}: {
	icon: React.ReactNode;
	label: string;
	description: string;
	toneClassName: string;
}) {
	return (
		<div
			className={cn(
				'clay-hover-lift rounded-[2rem] border border-black/10 p-5 shadow-[var(--clay-shadow)]',
				toneClassName
			)}
		>
			<div className='flex items-center gap-3'>
				<div className='clay-icon-chip bg-white/72 text-foreground'>{icon}</div>
				<p className='clay-label text-foreground'>{label}</p>
			</div>
			<p className='mt-4 text-sm leading-6 text-black/72'>{description}</p>
		</div>
	);
}

export function FinanceHero({ displayedFileName }: { displayedFileName: string }) {
	return (
		<section className='clay-section overflow-hidden p-4 md:p-6'>
			<div className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
				<div className='rounded-[2.6rem] border border-black/10 bg-[linear-gradient(135deg,rgba(248,204,101,0.9),rgba(255,255,255,0.62),rgba(193,176,255,0.32))] p-6 shadow-[var(--clay-shadow)] md:p-8'>
					<p className='clay-label text-foreground'>Track B / quantum versus classical</p>
					<h1 className='mt-4 max-w-4xl text-4xl font-semibold leading-[0.94] tracking-[-0.055em] text-foreground md:text-6xl'>
						One market dataset. One exact baseline. One routed quantum solve.
					</h1>
					<p className='mt-5 max-w-3xl text-base leading-7 text-black/72'>
						This finance page is wired to `backend-v2`. It screens the same portfolio universe, computes the
						exact classical optimum, synthesizes a QAOA circuit, and surfaces the distributed quantum evidence
						on the same run. No legacy analytics stub remains in this path.
					</p>
					<div className='mt-6 flex flex-wrap gap-2'>
						<Badge className={SOFT_BADGE_CLASS_NAME}>exact classical search</Badge>
						<Badge className={SOFT_BADGE_CLASS_NAME}>QAOA state ranking</Badge>
						<Badge className={SOFT_BADGE_CLASS_NAME}>distributed fragment routing</Badge>
						<Badge className={SOFT_BADGE_CLASS_NAME}>OpenQASM surfaced</Badge>
					</div>
				</div>

				<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-2'>
					<HeroSignalCard
						icon={<CheckCircle2Icon className='size-5' />}
						label='Accepted inputs'
						description='Long or wide market CSVs with dates plus prices or returns. Override columns only when inference is ambiguous.'
						toneClassName='clay-panel-matcha'
					/>
					<HeroSignalCard
						icon={<CpuIcon className='size-5' />}
						label='Quantum surface'
						description='Compiled QASM, top states, plan fragments, runtime route, and observed basis-state evidence are all exposed downstream.'
						toneClassName='clay-panel-ube'
					/>
					<HeroSignalCard
						icon={<BarChart2Icon className='size-5' />}
						label='Benchmark output'
						description='Objective gaps, overlap ratio, feasible probability mass, frontier rank, and comparison-report language land in the same payload.'
						toneClassName='clay-panel-slushie'
					/>
					<HeroSignalCard
						icon={<FileTextIcon className='size-5' />}
						label='Current file'
						description={displayedFileName}
						toneClassName='clay-panel-pomegranate'
					/>
				</div>
			</div>
		</section>
	);
}
