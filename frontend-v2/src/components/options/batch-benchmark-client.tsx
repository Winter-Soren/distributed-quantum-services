'use client';

import * as React from 'react';
import { XCircleIcon, FlaskConicalIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BatchUploadPanel } from '@/components/options/batch-upload-panel';
import { BatchResultsDashboard } from '@/components/options/batch-results-dashboard';
import type { BatchOptionsResult } from '@/types/options-batch';

async function runBatch(file: File): Promise<BatchOptionsResult> {
	const formData = new FormData();
	formData.append('file', file);
	const res = await fetch('/api/options/batch', {
		method: 'POST',
		body: formData,
		cache: 'no-store'
	});
	const payload = (await res.json().catch(() => null)) as
		| BatchOptionsResult
		| { error?: string; details?: string }
		| null;
	if (!res.ok) {
		const msg =
			payload && typeof payload === 'object' && 'error' in payload
				? [payload.error, payload.details].filter(Boolean).join(' ')
				: `Request failed: ${res.status}`;
		throw new Error(msg);
	}
	return payload as BatchOptionsResult;
}

export function BatchBenchmarkClient() {
	const [file, setFile] = React.useState<File | null>(null);
	const [running, setRunning] = React.useState(false);
	const [result, setResult] = React.useState<BatchOptionsResult | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	const handleRun = React.useCallback(async () => {
		if (!file) return;
		setRunning(true);
		setError(null);
		setResult(null);
		try {
			const res = await runBatch(file);
			setResult(res);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Batch run failed.');
		} finally {
			setRunning(false);
		}
	}, [file]);

	return (
		<div className='space-y-6 p-4 pb-12 md:p-6'>
			{/* Hero */}
			<div className='space-y-1'>
				<div className='flex items-center gap-2'>
					<FlaskConicalIcon className='size-5 text-foreground' />
					<h1 className='text-xl font-semibold text-foreground'>Batch Options Benchmark</h1>
				</div>
				<p className='max-w-2xl text-sm text-muted-foreground'>
					Upload a CSV of option contracts. Each row is priced by both Quantum Amplitude Estimation (IQAE)
					and Black-Scholes simultaneously. Results are displayed in a side-by-side comparison table with
					optional market price error columns.
				</p>
				<div className='flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground'>
					<span><span className='font-medium text-foreground'>Track C</span> — Quantum vs Classical</span>
					<span>Up to 25 contracts per run</span>
					<span>IQAE ε = 0.05 (batch default)</span>
					<span>4 uncertainty qubits (batch default)</span>
				</div>
			</div>

			{error ? (
				<Alert variant='destructive'>
					<XCircleIcon className='size-4' />
					<AlertTitle>Batch run failed</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{/* Upload panel — always visible for re-runs */}
			<BatchUploadPanel
				fileName={file?.name ?? null}
				running={running}
				onFileSelected={f => {
					setFile(f);
					setResult(null);
					setError(null);
				}}
				onRun={handleRun}
			/>

			{/* Results */}
			{result ? <BatchResultsDashboard result={result} /> : null}
		</div>
	);
}
