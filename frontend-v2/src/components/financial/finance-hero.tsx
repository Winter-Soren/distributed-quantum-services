'use client';

export function FinanceHero({ displayedFileName }: { displayedFileName: string }) {
	return (
		<div className='border-b border-border pb-5'>
			<p className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
				Track B — quantum vs classical
			</p>
			<h1 className='mt-2 text-2xl font-semibold tracking-tight text-foreground'>
				Portfolio optimization benchmark
			</h1>
			<p className='mt-2 max-w-3xl text-sm leading-6 text-muted-foreground'>
				Upload a market CSV. The backend runs an exact classical enumeration and a QAOA solve on the same
				screened universe, then returns both results in one payload. Wired to backend-v2.
			</p>
			<div className='mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground'>
				<span>
					<span className='font-medium text-foreground'>File:</span> {displayedFileName}
				</span>
				<span>Exact classical search · QAOA state ranking · Distributed fragment routing · OpenQASM surfaced</span>
			</div>
		</div>
	);
}
