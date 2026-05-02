'use client';

import * as React from 'react';
import { UploadCloudIcon, Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export type PortfolioSubmitFormState = {
	budget: string;
	riskAversion: string;
	maxAssetsConsidered: string;
	valueMode: 'auto' | 'prices' | 'returns';
	parameterSearchSteps: string;
	dateColumn: string;
	tickerColumn: string;
	valueColumn: string;
};

function Field({
	label,
	htmlFor,
	hint,
	children
}: {
	label: string;
	htmlFor: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className='space-y-1.5'>
			<Label htmlFor={htmlFor} className='text-xs font-medium text-foreground'>
				{label}
			</Label>
			{children}
			{hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
		</div>
	);
}

export function FinanceUploadPanel({
	form,
	fileName,
	uploading,
	onChange,
	onFileSelected
}: {
	form: PortfolioSubmitFormState;
	fileName: string | null;
	uploading: boolean;
	onChange: (patch: Partial<PortfolioSubmitFormState>) => void;
	onFileSelected: (file: File) => void;
}) {
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [dragActive, setDragActive] = React.useState(false);

	const handleDrop = React.useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			setDragActive(false);
			const file = event.dataTransfer.files[0];
			if (file && file.name.toLowerCase().endsWith('.csv')) {
				onFileSelected(file);
			}
		},
		[onFileSelected]
	);

	return (
		<div id='upload' className='space-y-5' style={{ scrollMarginTop: '5rem' }}>
			<div className='space-y-1'>
				<p className='text-sm font-semibold text-foreground'>Upload dataset</p>
				<p className='text-xs text-muted-foreground'>
					Long format (date, ticker, value) or wide format (date, AAPL, MSFT, …). The backend infers the
					layout unless you override the column names below.
				</p>
			</div>

			<input
				ref={fileInputRef}
				type='file'
				accept='.csv'
				className='hidden'
				onChange={event => {
					const file = event.target.files?.[0];
					if (file) onFileSelected(file);
				}}
			/>

			<div
				onDragOver={event => { event.preventDefault(); setDragActive(true); }}
				onDragLeave={() => setDragActive(false)}
				onDrop={handleDrop}
				className={`rounded-md border-2 border-dashed px-5 py-6 text-center transition-colors ${
					dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
				}`}
			>
				<UploadCloudIcon className='mx-auto size-7 text-muted-foreground' />
				<p className='mt-2 text-sm font-medium text-foreground'>
					{fileName ? `Selected: ${fileName}` : 'Drop a CSV here or choose a file'}
				</p>
				<p className='mt-1 text-xs text-muted-foreground'>date,ticker,adjusted_close · date,AAPL,MSFT,NVDA</p>
				<div className='mt-4 flex justify-center gap-2'>
					<Button
						type='button'
						size='sm'
						onClick={() => fileInputRef.current?.click()}
						disabled={uploading}
					>
						{uploading ? <Loader2Icon className='size-3.5 animate-spin' /> : <UploadCloudIcon className='size-3.5' />}
						{uploading ? 'Submitting…' : 'Choose CSV'}
					</Button>
					{fileName ? (
						<Button
							type='button'
							size='sm'
							variant='outline'
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading}
						>
							Replace
						</Button>
					) : null}
				</div>
			</div>

			<div className='grid gap-4 sm:grid-cols-2'>
				<Field label='Portfolio budget' htmlFor='budget' hint='Optional cardinality constraint.'>
					<Input
						id='budget'
						type='number'
						inputMode='numeric'
						min='1'
						placeholder='Optional'
						value={form.budget}
						onChange={e => onChange({ budget: e.target.value })}
					/>
				</Field>

				<Field label='Risk aversion' htmlFor='risk-aversion' hint='Higher = more volatility penalty.'>
					<Input
						id='risk-aversion'
						type='number'
						inputMode='decimal'
						step='0.1'
						min='0'
						max='10'
						value={form.riskAversion}
						onChange={e => onChange({ riskAversion: e.target.value })}
					/>
				</Field>

				<Field label='Max assets considered' htmlFor='max-assets' hint='Upper bound for screened universe (2–8).'>
					<Input
						id='max-assets'
						type='number'
						inputMode='numeric'
						min='2'
						max='8'
						value={form.maxAssetsConsidered}
						onChange={e => onChange({ maxAssetsConsidered: e.target.value })}
					/>
				</Field>

				<Field label='Parameter search steps' htmlFor='search-steps' hint='QAOA coarse search width (3–25).'>
					<Input
						id='search-steps'
						type='number'
						inputMode='numeric'
						min='3'
						max='25'
						value={form.parameterSearchSteps}
						onChange={e => onChange({ parameterSearchSteps: e.target.value })}
					/>
				</Field>

				<Field label='Value mode' htmlFor='value-mode' hint='Auto-detects prices vs returns.'>
					<NativeSelect
						id='value-mode'
						value={form.valueMode}
						onChange={e => onChange({ valueMode: e.target.value as PortfolioSubmitFormState['valueMode'] })}
					>
						<NativeSelectOption value='auto'>Auto detect</NativeSelectOption>
						<NativeSelectOption value='prices'>Prices</NativeSelectOption>
						<NativeSelectOption value='returns'>Returns</NativeSelectOption>
					</NativeSelect>
				</Field>

				<Field label='Date column override' htmlFor='date-column' hint='Only needed if inference fails.'>
					<Input
						id='date-column'
						placeholder='Optional'
						value={form.dateColumn}
						onChange={e => onChange({ dateColumn: e.target.value })}
					/>
				</Field>

				<Field label='Ticker column override' htmlFor='ticker-column' hint='For long-format custom symbol columns.'>
					<Input
						id='ticker-column'
						placeholder='Optional'
						value={form.tickerColumn}
						onChange={e => onChange({ tickerColumn: e.target.value })}
					/>
				</Field>

				<Field label='Value column override' htmlFor='value-column' hint='If prices/returns column cannot be inferred.'>
					<Input
						id='value-column'
						placeholder='Optional'
						value={form.valueColumn}
						onChange={e => onChange({ valueColumn: e.target.value })}
					/>
				</Field>
			</div>
		</div>
	);
}
