'use client';

import * as React from 'react';
import { DownloadIcon, Loader2Icon, UploadCloudIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

const SAMPLE_CSV = `option_type,current_value,strike_or_cost,time_to_expiry,volatility,risk_free_rate,market_price
european_call_short,112.5,110,0.14,0.35,0.04,7.80
european_call_short,50,52,0.25,0.30,0.04,2.45
european_call_long,500,600,15,0.40,0.04,
delay,350,500,20,0.20,0.04,
expand,100,150,10,0.35,0.04,
abandon,254,150,10,0.25,0.04,
patent,800000,1000000,10,0.35,0.04,
natural_resource,35,1000000,10,0.20,0.04,
`.trim();

const SCHEMA = [
	{ col: 'option_type', req: true, desc: 'One of: european_call_short, european_call_long, expand, delay, abandon, patent, natural_resource, financial_flexibility' },
	{ col: 'current_value', req: true, desc: 'S₀ — current asset / project value (> 0)' },
	{ col: 'strike_or_cost', req: true, desc: 'K — strike price or investment cost (> 0)' },
	{ col: 'time_to_expiry', req: true, desc: 'T in years (> 0)' },
	{ col: 'volatility', req: true, desc: 'σ — annualised volatility as decimal, e.g. 0.35 = 35%' },
	{ col: 'risk_free_rate', req: true, desc: 'r — annualised risk-free rate as decimal, e.g. 0.04 = 4%' },
	{ col: 'market_price', req: false, desc: 'Observed market price — enables quantum vs classical vs market error columns' },
	{ col: 'num_uncertainty_qubits', req: false, desc: 'Override IQAE qubits per row (3–8). Default: 4' },
	{ col: 'epsilon', req: false, desc: 'Override IQAE precision per row. Default: 0.05' },
];

function downloadSample() {
	const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'options_batch_sample.csv';
	a.click();
	URL.revokeObjectURL(url);
}

export function BatchUploadPanel({
	fileName,
	running,
	onFileSelected,
	onRun
}: {
	fileName: string | null;
	running: boolean;
	onFileSelected: (file: File) => void;
	onRun: () => void;
}) {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = React.useState(false);

	const handleDrop = React.useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			setDragActive(false);
			const f = e.dataTransfer.files[0];
			if (f?.name.toLowerCase().endsWith('.csv')) onFileSelected(f);
		},
		[onFileSelected]
	);

	return (
		<div className='space-y-5'>
			{/* Upload zone */}
			<input
				ref={fileInputRef}
				type='file'
				accept='.csv'
				className='hidden'
				onChange={e => {
					const f = e.target.files?.[0];
					if (f) onFileSelected(f);
				}}
			/>
			<div
				onDragOver={e => { e.preventDefault(); setDragActive(true); }}
				onDragLeave={() => setDragActive(false)}
				onDrop={handleDrop}
				className={`rounded-md border-2 border-dashed px-5 py-8 text-center transition-colors ${
					dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
				}`}
			>
				<UploadCloudIcon className='mx-auto size-8 text-muted-foreground' />
				<p className='mt-2 text-sm font-medium text-foreground'>
					{fileName ? `Selected: ${fileName}` : 'Drop a CSV here or choose a file'}
				</p>
				<p className='mt-1 text-xs text-muted-foreground'>
					Up to 25 rows · Required: option_type, current_value, strike_or_cost, time_to_expiry, volatility, risk_free_rate
				</p>
				<div className='mt-4 flex justify-center gap-2'>
					<Button
						type='button'
						size='sm'
						variant='outline'
						onClick={() => fileInputRef.current?.click()}
						disabled={running}
					>
						<UploadCloudIcon className='size-3.5' />
						{fileName ? 'Replace CSV' : 'Choose CSV'}
					</Button>
					<Button
						type='button'
						size='sm'
						variant='ghost'
						onClick={downloadSample}
						disabled={running}
					>
						<DownloadIcon className='size-3.5' />
						Sample CSV
					</Button>
				</div>
			</div>

			{/* Run button */}
			{fileName ? (
				<Button
					type='button'
					className='w-full'
					disabled={running}
					onClick={onRun}
				>
					{running ? (
						<>
							<Loader2Icon className='size-4 animate-spin' />
							Running IQAE pipeline…
						</>
					) : (
						<>
							<UploadCloudIcon className='size-4' />
							Run Batch Benchmark
						</>
					)}
				</Button>
			) : null}

			{/* Schema reference */}
			<div className='space-y-2'>
				<p className='text-xs font-semibold text-foreground'>CSV column reference</p>
				<div className='overflow-x-auto rounded-md border border-border'>
					<table className='w-full text-xs'>
						<thead>
							<tr className='border-b border-border bg-muted/40'>
								<th className='px-3 py-2 text-left font-medium text-foreground'>Column</th>
								<th className='px-3 py-2 text-left font-medium text-foreground'>Required</th>
								<th className='px-3 py-2 text-left font-medium text-foreground'>Description</th>
							</tr>
						</thead>
						<tbody>
							{SCHEMA.map(s => (
								<tr key={s.col} className='border-b border-border last:border-0'>
									<td className='px-3 py-2 font-mono text-foreground'>{s.col}</td>
									<td className='px-3 py-2 text-center'>
										{s.req ? (
											<span className='font-medium text-foreground'>Yes</span>
										) : (
											<span className='text-muted-foreground'>No</span>
										)}
									</td>
									<td className='px-3 py-2 text-muted-foreground'>{s.desc}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
