'use client';

import * as React from 'react';
import { UploadCloudIcon, Loader2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

const FORM_INPUT_CLASS_NAME =
	'clay-input h-11 rounded-[1.15rem] border-[var(--clay-oat)] bg-white/90 px-4 text-sm shadow-none focus-visible:border-[var(--clay-blueberry)] focus-visible:ring-[rgb(56_89_249_/_0.18)]';
const FORM_SELECT_CLASS_NAME =
	'w-full [&_select]:clay-input [&_select]:h-11 [&_select]:rounded-[1.15rem] [&_select]:border-[var(--clay-oat)] [&_select]:bg-white/90 [&_select]:px-4 [&_select]:text-sm [&_select]:shadow-none [&_select]:focus-visible:border-[var(--clay-blueberry)] [&_select]:focus-visible:ring-[rgb(56_89_249_/_0.18)] [&_[data-slot=native-select-icon]]:text-[var(--clay-charcoal)]';
const PRIMARY_BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-black/10 bg-[var(--clay-blueberry)] text-white shadow-[var(--clay-shadow)] hover:bg-[var(--clay-ube-dark)]';
const SECONDARY_BUTTON_CLASS_NAME =
	'clay-hover-lift rounded-full border border-[var(--clay-oat)] bg-white text-foreground shadow-[var(--clay-shadow)] hover:bg-[rgb(248_204_101_/_0.32)]';
const SOFT_BADGE_CLASS_NAME =
	'rounded-full border border-black/10 bg-white/78 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground shadow-[var(--clay-shadow)]';

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

function FormField({
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
		<div className='rounded-[1.55rem] border border-[var(--clay-oat-light)] bg-white/80 p-4 shadow-[var(--clay-shadow)]'>
			<Label
				htmlFor={htmlFor}
				className='clay-label text-[var(--clay-charcoal)]'
			>
				{label}
			</Label>
			<div className='mt-3'>{children}</div>
			{hint ? <p className='mt-3 text-xs leading-5 text-muted-foreground'>{hint}</p> : null}
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
		<Card
			id='upload'
			style={{ scrollMarginTop: '5rem' }}
			className='clay-section overflow-hidden border-[var(--clay-oat)] bg-[rgb(255_255_255_/_0.76)] shadow-[var(--clay-shadow)]'
		>
			<CardHeader className='border-b border-[var(--clay-oat)]'>
				<div className='flex flex-wrap items-start justify-between gap-4'>
					<div className='max-w-2xl space-y-3'>
						<p className='clay-label'>Run a benchmark</p>
						<CardTitle className='text-2xl font-semibold tracking-[-0.04em] text-foreground md:text-4xl'>
							Feed one market dataset into the exact classical baseline and the routed quantum flow.
						</CardTitle>
						<CardDescription className='max-w-2xl text-sm leading-6 text-muted-foreground md:text-base'>
							Upload a real CSV, resolve the schema, compute the exact optimum, and submit the same screened
							problem into the Track B quantum stack. The UI below stays on the same data contract the backend
							now returns.
						</CardDescription>
					</div>
					<div className='rounded-[1.5rem] border border-black/10 bg-[rgb(255_255_255_/_0.8)] px-4 py-3 shadow-[var(--clay-shadow)]'>
						<p className='clay-label'>Accepted shapes</p>
						<div className='mt-3 flex flex-wrap gap-2'>
							<Badge className={SOFT_BADGE_CLASS_NAME}>long market tape</Badge>
							<Badge className={SOFT_BADGE_CLASS_NAME}>wide price matrix</Badge>
							<Badge className={SOFT_BADGE_CLASS_NAME}>returns or prices</Badge>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className='space-y-6 pt-6'>
				<input
					ref={fileInputRef}
					type='file'
					accept='.csv'
					className='hidden'
					onChange={event => {
						const file = event.target.files?.[0];
						if (file) {
							onFileSelected(file);
						}
					}}
				/>

				<div
					onDragOver={event => {
						event.preventDefault();
						setDragActive(true);
					}}
					onDragLeave={() => setDragActive(false)}
					onDrop={handleDrop}
					className={cn(
						'clay-dashed rounded-[2.3rem] border-2 p-6 shadow-[var(--clay-shadow)] transition md:p-8',
						dragActive
							? 'border-[var(--clay-blueberry)] bg-[linear-gradient(135deg,rgba(59,211,253,0.34),rgba(255,255,255,0.94))]'
							: 'border-[var(--clay-oat)] bg-[linear-gradient(135deg,rgba(59,211,253,0.18),rgba(255,255,255,0.94))]'
					)}
				>
					<div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
						<div className='max-w-2xl space-y-4'>
							<div className='flex items-center gap-3'>
								<div className='clay-icon-chip bg-white/78 text-[var(--clay-blueberry)]'>
									<UploadCloudIcon className='size-5' />
								</div>
								<div>
									<p className='clay-label text-foreground'>Dataset intake</p>
									<p className='mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground'>
										Drop a CSV or choose a file
									</p>
								</div>
							</div>
							<p className='text-sm leading-6 text-black/72 md:text-base'>
								Supported layouts: long format (`date`, `ticker`, `adjusted_close` or `return`) and wide
								format (`date`, `AAPL`, `MSFT`, `NVDA`, ...). The backend will infer a resolved shape unless
								you override the columns below.
							</p>
							<div className='flex flex-wrap gap-2'>
								<Badge className={SOFT_BADGE_CLASS_NAME}>date,ticker,adjusted_close</Badge>
								<Badge className={SOFT_BADGE_CLASS_NAME}>date,AAPL,MSFT,NVDA</Badge>
								<Badge className={SOFT_BADGE_CLASS_NAME}>value_mode=auto|prices|returns</Badge>
							</div>
						</div>
						<div className='rounded-[1.8rem] border border-black/10 bg-white/82 p-5 shadow-[var(--clay-shadow)] lg:min-w-[18rem]'>
							<p className='clay-label text-[var(--clay-charcoal)]'>Submission</p>
							<p className='mt-3 text-sm leading-6 text-muted-foreground'>
								{fileName ? `Ready: ${fileName}` : 'No CSV selected in this session yet.'}
							</p>
							<div className='mt-5 flex flex-wrap gap-3'>
								<Button
									type='button'
									onClick={() => fileInputRef.current?.click()}
									disabled={uploading}
									className={cn('h-11 px-5', PRIMARY_BUTTON_CLASS_NAME)}
								>
									{uploading ? (
										<Loader2Icon className='size-4 animate-spin' />
									) : (
										<UploadCloudIcon className='size-4' />
									)}
									{uploading ? 'Submitting...' : 'Choose CSV'}
								</Button>
								<Button
									type='button'
									variant='outline'
									onClick={() => fileInputRef.current?.click()}
									disabled={uploading}
									className={cn('h-11 px-5', SECONDARY_BUTTON_CLASS_NAME)}
								>
									Replace file
								</Button>
							</div>
						</div>
					</div>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<FormField
						label='Portfolio budget'
						htmlFor='budget'
						hint='Optional cardinality constraint. The backend validates it against the screened asset count.'
					>
						<Input
							id='budget'
							type='number'
							inputMode='numeric'
							min='1'
							placeholder='Optional'
							value={form.budget}
							onChange={event => onChange({ budget: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
					<FormField
						label='Risk aversion'
						htmlFor='risk-aversion'
						hint='Higher values increase the penalty for volatility in the objective.'
					>
						<Input
							id='risk-aversion'
							type='number'
							inputMode='decimal'
							step='0.1'
							min='0'
							max='10'
							value={form.riskAversion}
							onChange={event => onChange({ riskAversion: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
					<FormField
						label='Max assets considered'
						htmlFor='max-assets'
						hint='Upper bound for the screened universe sent into the binary optimization layer.'
					>
						<Input
							id='max-assets'
							type='number'
							inputMode='numeric'
							min='2'
							max='8'
							value={form.maxAssetsConsidered}
							onChange={event => onChange({ maxAssetsConsidered: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
					<FormField
						label='Parameter search steps'
						htmlFor='search-steps'
						hint='Coarse search width for QAOA parameter exploration before local refinement.'
					>
						<Input
							id='search-steps'
							type='number'
							inputMode='numeric'
							min='3'
							max='25'
							value={form.parameterSearchSteps}
							onChange={event => onChange({ parameterSearchSteps: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
					<FormField
						label='Value mode'
						htmlFor='value-mode'
						hint='Auto-detect raw prices versus already-derived returns from the uploaded columns.'
					>
						<NativeSelect
							id='value-mode'
							className={FORM_SELECT_CLASS_NAME}
							value={form.valueMode}
							onChange={event => onChange({ valueMode: event.target.value as PortfolioSubmitFormState['valueMode'] })}
						>
							<NativeSelectOption value='auto'>Auto detect</NativeSelectOption>
							<NativeSelectOption value='prices'>Prices</NativeSelectOption>
							<NativeSelectOption value='returns'>Returns</NativeSelectOption>
						</NativeSelect>
					</FormField>
					<FormField
						label='Date column override'
						htmlFor='date-column'
						hint='Use when your dataset does not expose a standard date column name.'
					>
						<Input
							id='date-column'
							placeholder='Optional'
							value={form.dateColumn}
							onChange={event => onChange({ dateColumn: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
					<FormField
						label='Ticker column override'
						htmlFor='ticker-column'
						hint='Useful for long-format datasets where the symbol column uses a custom name.'
					>
						<Input
							id='ticker-column'
							placeholder='Optional'
							value={form.tickerColumn}
							onChange={event => onChange({ tickerColumn: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
					<FormField
						label='Value column override'
						htmlFor='value-column'
						hint='Set this explicitly if the prices or returns column cannot be inferred cleanly.'
					>
						<Input
							id='value-column'
							placeholder='Optional'
							value={form.valueColumn}
							onChange={event => onChange({ valueColumn: event.target.value })}
							className={FORM_INPUT_CLASS_NAME}
						/>
					</FormField>
				</div>
			</CardContent>
		</Card>
	);
}
