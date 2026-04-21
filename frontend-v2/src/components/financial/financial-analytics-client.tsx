'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	ActivityIcon,
	BarChart2Icon,
	CheckCircle2Icon,
	CpuIcon,
	FileTextIcon,
	GitBranchIcon,
	Loader2Icon,
	UploadCloudIcon,
	XCircleIcon
} from 'lucide-react';

import { PortfolioResultDashboard } from '@/components/financial/portfolio-result-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import type { FinancialJobResponse, FinancialJobStatus } from '@/types/financial';
import type { BackendFinancialJobListItem } from '@/types/runs';

const POLL_INTERVAL_MS = 1500;

type FinanceSubmitResponse = {
	job_id: string;
	status: FinancialJobStatus;
	problem_type?: string;
};

type PortfolioSubmitFormState = {
	budget: string;
	riskAversion: string;
	maxAssetsConsidered: string;
	valueMode: 'auto' | 'prices' | 'returns';
	parameterSearchSteps: string;
	dateColumn: string;
	tickerColumn: string;
	valueColumn: string;
};

const INITIAL_FORM_STATE: PortfolioSubmitFormState = {
	budget: '',
	riskAversion: '0.5',
	maxAssetsConsidered: '6',
	valueMode: 'auto',
	parameterSearchSteps: '9',
	dateColumn: '',
	tickerColumn: '',
	valueColumn: ''
};

const STATUS_STEPS: FinancialJobStatus[] = ['QUEUED', 'INGESTING', 'ANALYSING', 'COMPLETED'];

function isTerminalStatus(status: FinancialJobStatus | null | undefined) {
	return status === 'COMPLETED' || status === 'FAILED';
}

function formatDateTime(isoValue: string | null | undefined) {
	if (!isoValue) {
		return '-';
	}

	const date = new Date(isoValue);
	if (Number.isNaN(date.getTime())) {
		return '-';
	}

	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(date);
}

function formatStatusVariant(status: FinancialJobStatus) {
	switch (status) {
		case 'COMPLETED':
			return 'outline' as const;
		case 'FAILED':
			return 'destructive' as const;
		default:
			return 'secondary' as const;
	}
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
	const response = await fetch(url, {
		...init,
		cache: 'no-store',
		headers: {
			Accept: 'application/json',
			...(init?.headers ?? {})
		}
	});
	const payload = (await response.json().catch(() => null)) as
		| { error?: string; details?: string }
		| T
		| null;

	if (!response.ok) {
		const message =
			payload && typeof payload === 'object' && 'error' in payload
				? [payload.error, payload.details].filter(Boolean).join(' ').trim()
				: `Request failed with status ${response.status}.`;
		throw new Error(message || `Request failed with status ${response.status}.`);
	}

	return payload as T;
}

function WorkflowStatusBadge({ status }: { status: FinancialJobStatus }) {
	return <Badge variant={formatStatusVariant(status)}>{status.toLowerCase()}</Badge>;
}

function JobProgressBar({ status }: { status: FinancialJobStatus }) {
	const stepIndex = STATUS_STEPS.indexOf(status);
	const isFailed = status === 'FAILED';
	const progress = isFailed ? 100 : Math.round(((Math.max(stepIndex, 0) + 1) / STATUS_STEPS.length) * 100);

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between text-sm'>
				<span className='font-medium'>
					{isFailed
						? 'Execution failed'
						: status === 'QUEUED'
							? 'Queued for processing'
							: status === 'INGESTING'
								? 'Normalizing portfolio dataset'
								: status === 'ANALYSING'
									? 'Building and routing quantum solve'
									: 'Execution complete'}
				</span>
				<span className='text-muted-foreground'>{isFailed ? '-' : `${progress}%`}</span>
			</div>
			<Progress
				value={progress}
				className={isFailed ? '[&>div]:bg-destructive' : ''}
			/>
			<div className='grid grid-cols-4 gap-2 text-xs'>
				{STATUS_STEPS.map((step, index) => {
					const active = index <= stepIndex;
					return (
						<div
							key={step}
							className='flex flex-col items-center gap-2'
						>
							<div
								className={`flex size-7 items-center justify-center rounded-full border text-[11px] ${
									active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
								}`}
							>
								{active && step !== 'COMPLETED' ? <Loader2Icon className='size-3 animate-spin' /> : index + 1}
							</div>
							<span className='text-center text-muted-foreground'>
								{step === 'QUEUED'
									? 'Queued'
									: step === 'INGESTING'
										? 'Ingest'
										: step === 'ANALYSING'
											? 'Optimize'
											: 'Complete'}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function UploadPanel({
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
		<Card className='relative overflow-hidden shadow-lg ring-1 ring-primary/10'>
			<div
				aria-hidden
				className='pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-primary/12 via-chart-2/12 to-chart-3/12'
			/>
			<CardHeader className='relative border-b border-border/70'>
				<CardTitle>Track B Portfolio Optimization</CardTitle>
				<CardDescription>
					Upload a market dataset, compute the exact classical optimum, generate the QAOA circuit, and push it
					through the distributed quantum runtime.
				</CardDescription>
			</CardHeader>
			<CardContent className='relative space-y-6 pt-6'>
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
					className={`rounded-[2rem] border-2 border-dashed p-8 transition ${
						dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
					}`}
				>
					<div className='flex flex-col items-center gap-4 text-center'>
						<div className='flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary'>
							<UploadCloudIcon className='size-8' />
						</div>
						<div className='space-y-2'>
							<p className='text-lg font-semibold'>Drop a CSV or choose a file</p>
							<p className='max-w-xl text-sm text-muted-foreground'>
								Supported layouts: long format (`date`, `ticker`, `adjusted_close` or `return`) and wide
								format (`date`, `AAPL`, `MSFT`, ...).
							</p>
						</div>
						<div className='flex flex-wrap justify-center gap-2'>
							<Badge variant='secondary'>date,ticker,adjusted_close</Badge>
							<Badge variant='secondary'>date,AAPL,MSFT,NVDA</Badge>
							<Badge variant='secondary'>value_mode=auto|prices|returns</Badge>
						</div>
						<div className='flex flex-wrap items-center justify-center gap-3'>
							<Button
								type='button'
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
							>
								{uploading ? <Loader2Icon className='size-4 animate-spin' /> : <UploadCloudIcon className='size-4' />}
								{uploading ? 'Submitting...' : 'Choose CSV'}
							</Button>
							{fileName ? <span className='text-sm text-muted-foreground'>{fileName}</span> : null}
						</div>
					</div>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<div className='space-y-2'>
						<Label htmlFor='budget'>Portfolio budget</Label>
						<Input
							id='budget'
							type='number'
							inputMode='numeric'
							min='1'
							placeholder='Optional'
							value={form.budget}
							onChange={event => onChange({ budget: event.target.value })}
						/>
						<p className='text-xs text-muted-foreground'>Optional cardinality constraint. Backend validates it against the screened asset count.</p>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='risk-aversion'>Risk aversion</Label>
						<Input
							id='risk-aversion'
							type='number'
							inputMode='decimal'
							step='0.1'
							min='0'
							max='10'
							value={form.riskAversion}
							onChange={event => onChange({ riskAversion: event.target.value })}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='max-assets'>Max assets considered</Label>
						<Input
							id='max-assets'
							type='number'
							inputMode='numeric'
							min='2'
							max='8'
							value={form.maxAssetsConsidered}
							onChange={event => onChange({ maxAssetsConsidered: event.target.value })}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='search-steps'>Parameter search steps</Label>
						<Input
							id='search-steps'
							type='number'
							inputMode='numeric'
							min='3'
							max='25'
							value={form.parameterSearchSteps}
							onChange={event => onChange({ parameterSearchSteps: event.target.value })}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='value-mode'>Value mode</Label>
						<NativeSelect
							id='value-mode'
							className='w-full'
							value={form.valueMode}
							onChange={event => onChange({ valueMode: event.target.value as PortfolioSubmitFormState['valueMode'] })}
						>
							<NativeSelectOption value='auto'>Auto detect</NativeSelectOption>
							<NativeSelectOption value='prices'>Prices</NativeSelectOption>
							<NativeSelectOption value='returns'>Returns</NativeSelectOption>
						</NativeSelect>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='date-column'>Date column override</Label>
						<Input
							id='date-column'
							placeholder='Optional'
							value={form.dateColumn}
							onChange={event => onChange({ dateColumn: event.target.value })}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='ticker-column'>Ticker column override</Label>
						<Input
							id='ticker-column'
							placeholder='Optional'
							value={form.tickerColumn}
							onChange={event => onChange({ tickerColumn: event.target.value })}
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='value-column'>Value column override</Label>
						<Input
							id='value-column'
							placeholder='Optional'
							value={form.valueColumn}
							onChange={event => onChange({ valueColumn: event.target.value })}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function SelectedJobCard({
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
		<Card className='shadow-lg ring-1 ring-foreground/5'>
			<CardHeader className='border-b border-border/70'>
				<CardTitle>Selected benchmark run</CardTitle>
				<CardDescription>
					{jobId ? 'Track the live portfolio optimization workflow and jump into the distributed run detail.' : 'Select a submitted finance job or upload a new dataset.'}
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-4 pt-6'>
				{loadError ? (
					<Alert variant='destructive'>
						<XCircleIcon className='size-4' />
						<AlertTitle>Job load failed</AlertTitle>
						<AlertDescription>{loadError}</AlertDescription>
					</Alert>
				) : null}

				{loading && !job ? (
					<div className='flex items-center gap-3 rounded-3xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
						<Loader2Icon className='size-4 animate-spin' />
						Loading selected finance run...
					</div>
				) : null}

				{job ? (
					<>
						<div className='rounded-[2rem] border border-border/70 bg-gradient-to-br from-background via-background to-primary/5 p-5'>
							<div className='flex flex-wrap items-start justify-between gap-4'>
								<div className='space-y-2'>
									<div className='flex flex-wrap items-center gap-2'>
										<WorkflowStatusBadge status={job.status} />
										<Badge variant='secondary'>{job.problem_type ?? job.result?.problem_type ?? 'portfolio_optimization'}</Badge>
									</div>
									<p className='text-xl font-semibold tracking-tight'>{job.filename}</p>
									<p className='font-mono text-xs text-muted-foreground'>{job.job_id}</p>
								</div>
								<div className='flex flex-wrap gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={onRefresh}
										disabled={isRefreshing}
									>
										{isRefreshing ? <Loader2Icon className='size-4 animate-spin' /> : <ActivityIcon className='size-4' />}
										Refresh
									</Button>
									<Button
										size='sm'
										asChild
									>
										<Link href={`/runs/${encodeURIComponent(job.job_id)}`}>
											<GitBranchIcon className='size-4' />
											Open run detail
										</Link>
									</Button>
									<Button
										variant='ghost'
										size='sm'
										onClick={onClear}
									>
										Clear
									</Button>
								</div>
							</div>
							<div className='mt-5 grid gap-3 sm:grid-cols-2'>
								<div className='rounded-3xl border border-border/70 bg-background/80 p-4'>
									<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Created</p>
									<p className='mt-2 text-sm'>{formatDateTime(job.created_at)}</p>
								</div>
								<div className='rounded-3xl border border-border/70 bg-background/80 p-4'>
									<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Updated</p>
									<p className='mt-2 text-sm'>{formatDateTime(job.updated_at)}</p>
								</div>
							</div>
						</div>

						{!isTerminalStatus(job.status) ? <JobProgressBar status={job.status} /> : null}
						{job.status === 'FAILED' && job.error ? (
							<Alert variant='destructive'>
								<XCircleIcon className='size-4' />
								<AlertTitle>Finance job failed</AlertTitle>
								<AlertDescription>{job.error}</AlertDescription>
							</Alert>
						) : null}
					</>
				) : !loading && !loadError ? (
					<div className='rounded-[2rem] border border-dashed border-border bg-muted/15 p-6 text-sm text-muted-foreground'>
						No finance run selected.
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function RecentJobsCard({
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
		<Card className='shadow-md ring-1 ring-foreground/5'>
			<CardHeader className='border-b border-border/70'>
				<CardTitle>Recent finance jobs</CardTitle>
				<CardDescription>Use an existing benchmark result or watch a live submission.</CardDescription>
			</CardHeader>
			<CardContent className='space-y-3 pt-6'>
				<div className='flex justify-end'>
					<Button
						variant='outline'
						size='sm'
						onClick={onRefresh}
						disabled={refreshing}
					>
						{refreshing ? <Loader2Icon className='size-4 animate-spin' /> : <ActivityIcon className='size-4' />}
						Refresh jobs
					</Button>
				</div>
				{jobs.length === 0 ? (
					<div className='rounded-3xl border border-dashed border-border bg-muted/15 p-4 text-sm text-muted-foreground'>
						No finance jobs have been submitted yet.
					</div>
				) : (
					<div className='space-y-2'>
						{jobs.map(job => (
							<button
								key={job.job_id}
								type='button'
								onClick={() => onSelect(job.job_id)}
								className={`w-full rounded-3xl border p-4 text-left transition ${
									activeJobId === job.job_id
										? 'border-primary bg-primary/5 shadow-sm'
										: 'border-border/70 bg-background hover:bg-muted/20'
								}`}
							>
								<div className='flex flex-wrap items-center justify-between gap-3'>
									<div className='space-y-1'>
										<p className='font-medium'>{job.filename}</p>
										<p className='font-mono text-xs text-muted-foreground'>{job.job_id}</p>
									</div>
									<WorkflowStatusBadge status={job.status} />
								</div>
								<div className='mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground'>
									<span>{formatDateTime(job.updated_at)}</span>
									<span>{job.problem_type ?? 'portfolio_optimization'}</span>
									<span>
										{job.row_count != null && job.col_count != null
											? `${job.row_count.toLocaleString()} rows x ${job.col_count}`
											: 'Pending result'}
									</span>
								</div>
							</button>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

/* function ResultDashboard({ result, jobId }: { result: FinancialAnalysisResult; jobId: string }) {
	const comparisonChartData = React.useMemo(
		() => [
			{
				label: 'Classical',
				objective: Number(result.benchmark.classical.objective.toFixed(6)),
				expectedReturn: Number((result.benchmark.classical.expected_return * 100).toFixed(2)),
				volatility: Number((result.benchmark.classical.volatility * 100).toFixed(2))
			},
			{
				label: 'Quantum',
				objective: Number(result.benchmark.quantum.objective.toFixed(6)),
				expectedReturn: Number((result.benchmark.quantum.expected_return * 100).toFixed(2)),
				volatility: Number((result.benchmark.quantum.volatility * 100).toFixed(2))
			}
		],
		[result]
	);

	const assetChartData = React.useMemo(
		() =>
			result.asset_universe
				.slice()
				.sort((left, right) => right.selection_probability - left.selection_probability)
				.slice(0, 10)
				.map(asset => ({
					ticker: asset.ticker,
					returnPct: Number((asset.annualized_return * 100).toFixed(2)),
					selectionPct: Number((asset.selection_probability * 100).toFixed(2))
				})),
		[result]
	);

	const topStates = result.quantum_execution?.top_states ?? [];
	const gateCounts = Object.entries(result.quantum_execution?.circuit_summary?.gate_counts ?? {}).sort(
		(left, right) => right[1] - left[1]
	);

	return (
		<div className='space-y-6'>
			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
				<MetricCard
					icon={<DatabaseIcon className='size-5' />}
					label='Dataset'
					value={`${result.dataset.asset_count} assets`}
					detail={`${result.dataset.period_count} aligned periods from ${result.row_count.toLocaleString()} rows`}
				/>
				<MetricCard
					icon={<BarChart2Icon className='size-5' />}
					label='Budget'
					value={String(result.request.budget)}
					detail={`Risk aversion ${formatNumber(result.request.risk_aversion, 2)} · ${result.request.resolved_value_mode}`}
				/>
				<MetricCard
					icon={<NetworkIcon className='size-5' />}
					label='Distributed runtime'
					value={`${result.fragments_executed} fragments`}
					detail={`${result.distributed_nodes_used} nodes used · ${formatDuration(result.analysis_duration_ms)}`}
				/>
				<MetricCard
					icon={<ZapIcon className='size-5' />}
					label='Feasible mass'
					value={formatPercent(result.benchmark.comparison.feasible_probability_mass)}
					detail={`Optimum state probability ${formatPercent(result.benchmark.comparison.optimum_probability)}`}
				/>
			</div>

			<div className='grid gap-6 xl:grid-cols-[1.3fr_0.9fr]'>
				<Card className='shadow-md ring-1 ring-foreground/5'>
					<CardHeader className='border-b border-border/70'>
						<CardTitle id='benchmark'>Classical vs quantum benchmark</CardTitle>
						<CardDescription>
							Exact classical solve against the best feasible QAOA state on the same screened universe.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5 pt-6'>
						<div className='grid gap-4 md:grid-cols-2'>
							<div className='rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4'>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Classical optimum</p>
										<p className='mt-2 text-xl font-semibold'>{result.benchmark.classical.bitstring}</p>
									</div>
									<TrendingUpIcon className='size-5 text-emerald-600' />
								</div>
								<div className='mt-4 space-y-1 text-sm text-muted-foreground'>
									<p>Objective: {formatSignedNumber(result.benchmark.classical.objective)}</p>
									<p>Return: {formatPercent(result.benchmark.classical.expected_return)}</p>
									<p>Volatility: {formatPercent(result.benchmark.classical.volatility)}</p>
								</div>
							</div>
							<div className='rounded-3xl border border-primary/20 bg-primary/5 p-4'>
								<div className='flex items-start justify-between gap-3'>
									<div>
										<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Quantum candidate</p>
										<p className='mt-2 text-xl font-semibold'>{result.benchmark.quantum.bitstring}</p>
									</div>
									<CpuIcon className='size-5 text-primary' />
								</div>
								<div className='mt-4 space-y-1 text-sm text-muted-foreground'>
									<p>Objective: {formatSignedNumber(result.benchmark.quantum.objective)}</p>
									<p>Return: {formatPercent(result.benchmark.quantum.expected_return)}</p>
									<p>Volatility: {formatPercent(result.benchmark.quantum.volatility)}</p>
									<p>Probability: {formatPercent(result.benchmark.quantum.probability)}</p>
								</div>
							</div>
						</div>
						<div className='h-72'>
							<ResponsiveContainer
								width='100%'
								height='100%'
							>
								<BarChart data={comparisonChartData}>
									<CartesianGrid
										strokeDasharray='4 4'
										vertical={false}
									/>
									<XAxis dataKey='label' />
									<YAxis />
									<Tooltip />
									<Bar
										dataKey='objective'
										fill='var(--color-primary, hsl(var(--primary)))'
										radius={[12, 12, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
						<div className='grid gap-3 md:grid-cols-3'>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Objective gap</p>
								<p className='mt-2 text-lg font-semibold'>
									{formatSignedNumber(result.benchmark.comparison.objective_gap)}
								</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Asset overlap</p>
								<p className='mt-2 text-lg font-semibold'>
									{result.benchmark.comparison.overlap_count} /{' '}
									{result.request.budget}
								</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Quantum advantage flag</p>
								<p className='mt-2 text-lg font-semibold'>
									{result.benchmark.comparison.quantum_advantage_detected ? 'Detected' : 'Not detected'}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className='shadow-md ring-1 ring-foreground/5'>
					<CardHeader className='border-b border-border/70'>
						<CardTitle>Dataset and request</CardTitle>
						<CardDescription>Resolved schema, screening window, and solve configuration.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5 pt-6'>
						<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
							<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Dataset summary</p>
							<dl className='mt-4 grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2 text-sm'>
								<dt className='text-muted-foreground'>Layout</dt>
								<dd>{result.dataset.input_layout}</dd>
								<dt className='text-muted-foreground'>Frequency</dt>
								<dd>{result.dataset.inferred_frequency}</dd>
								<dt className='text-muted-foreground'>Date range</dt>
								<dd>
									{result.dataset.start_date} to {result.dataset.end_date}
								</dd>
								<dt className='text-muted-foreground'>Columns</dt>
								<dd>
									{result.dataset.date_column}
									{result.dataset.ticker_column ? ` / ${result.dataset.ticker_column}` : ''}
									{result.dataset.value_column ? ` / ${result.dataset.value_column}` : ''}
								</dd>
								<dt className='text-muted-foreground'>Dropped rows</dt>
								<dd>{result.dataset.dropped_records}</dd>
							</dl>
						</div>
						<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
							<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Solve request</p>
							<dl className='mt-4 grid grid-cols-[8rem_minmax(0,1fr)] gap-y-2 text-sm'>
								<dt className='text-muted-foreground'>Objective</dt>
								<dd className='break-words'>{result.benchmark.objective_label}</dd>
								<dt className='text-muted-foreground'>Penalty</dt>
								<dd>{formatNumber(result.request.penalty, 4)}</dd>
								<dt className='text-muted-foreground'>QAOA reps</dt>
								<dd>{result.request.qaoa_reps}</dd>
								<dt className='text-muted-foreground'>Search steps</dt>
								<dd>{result.request.parameter_search_steps}</dd>
								<dt className='text-muted-foreground'>Timings</dt>
								<dd>
									Classical {formatDuration(result.benchmark.timings.classical_duration_ms)} · Quantum{' '}
									{formatDuration(result.benchmark.timings.quantum_duration_ms)}
								</dd>
							</dl>
						</div>
						<Button asChild>
							<Link href={`/runs/${encodeURIComponent(jobId)}`}>
								<GitBranchIcon className='size-4' />
								Inspect distributed run detail
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-[1.15fr_0.85fr]'>
				<Card className='shadow-md ring-1 ring-foreground/5'>
					<CardHeader className='border-b border-border/70'>
						<CardTitle id='frontier'>Screened asset universe</CardTitle>
						<CardDescription>
							Annualized statistics for the screened tickers and the quantum state selection mass.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5 pt-6'>
						<div className='h-72'>
							<ResponsiveContainer
								width='100%'
								height='100%'
							>
								<BarChart data={assetChartData}>
									<CartesianGrid
										strokeDasharray='4 4'
										vertical={false}
									/>
									<XAxis dataKey='ticker' />
									<YAxis />
									<Tooltip />
									<Bar
										dataKey='returnPct'
										fill='hsl(var(--chart-2))'
										name='Annualized return %'
										radius={[8, 8, 0, 0]}
									/>
									<Bar
										dataKey='selectionPct'
										fill='hsl(var(--chart-4))'
										name='Selection probability %'
										radius={[8, 8, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
						<div className='max-h-[26rem] overflow-auto rounded-3xl border border-border/70'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Ticker</TableHead>
										<TableHead className='text-right'>Return</TableHead>
										<TableHead className='text-right'>Volatility</TableHead>
										<TableHead className='text-right'>Selection</TableHead>
										<TableHead>Flags</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.asset_universe.map(asset => (
										<TableRow key={asset.ticker}>
											<TableCell className='font-medium'>{asset.ticker}</TableCell>
											<TableCell className='text-right'>{formatPercent(asset.annualized_return)}</TableCell>
											<TableCell className='text-right'>
												{formatPercent(asset.annualized_volatility)}
											</TableCell>
											<TableCell className='text-right'>
												{formatPercent(asset.selection_probability)}
											</TableCell>
											<TableCell>
												<div className='flex flex-wrap gap-2'>
													{asset.selected_classical ? <Badge variant='secondary'>classical</Badge> : null}
													{asset.selected_quantum ? <Badge variant='outline'>quantum</Badge> : null}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Card className='shadow-md ring-1 ring-foreground/5'>
					<CardHeader className='border-b border-border/70'>
						<CardTitle id='execution'>Quantum execution metadata</CardTitle>
						<CardDescription>QAOA parameters, compiled circuit size, and the routed OpenQASM payload.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5 pt-6'>
						<div className='grid gap-3 sm:grid-cols-2'>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Qubits</p>
								<p className='mt-2 text-lg font-semibold'>{result.quantum_execution?.circuit_summary?.qubit_count ?? '-'}</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Depth</p>
								<p className='mt-2 text-lg font-semibold'>{result.quantum_execution?.circuit_summary?.depth ?? '-'}</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Beta</p>
								<p className='mt-2 text-lg font-semibold'>
									{formatNumber(result.quantum_execution?.qaoa_parameters?.beta, 4)}
								</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Gamma</p>
								<p className='mt-2 text-lg font-semibold'>
									{formatNumber(result.quantum_execution?.qaoa_parameters?.gamma, 4)}
								</p>
							</div>
						</div>
						<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
							<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Gate counts</p>
							<div className='mt-3 flex flex-wrap gap-2'>
								{gateCounts.length ? (
									gateCounts.map(([gate, count]) => (
										<Badge
											key={gate}
											variant='secondary'
										>
											{gate}: {count}
										</Badge>
									))
								) : (
									<span className='text-sm text-muted-foreground'>No circuit summary returned.</span>
								)}
							</div>
						</div>
						<div className='space-y-2'>
							<p className='text-xs uppercase tracking-[0.2em] text-muted-foreground'>Compiled OpenQASM</p>
							<Textarea
								readOnly
								value={result.quantum_execution?.circuit_text ?? ''}
								className='min-h-[18rem] resize-y font-mono text-xs'
							/>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-6 xl:grid-cols-[1fr_1fr]'>
				<Card className='shadow-md ring-1 ring-foreground/5'>
					<CardHeader className='border-b border-border/70'>
						<CardTitle id='states'>Top quantum states</CardTitle>
						<CardDescription>Highest-probability bitstrings discovered in the QAOA state distribution.</CardDescription>
					</CardHeader>
					<CardContent className='pt-6'>
						<div className='max-h-[24rem] overflow-auto rounded-3xl border border-border/70'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Rank</TableHead>
										<TableHead>Bitstring</TableHead>
										<TableHead className='text-right'>Probability</TableHead>
										<TableHead className='text-right'>Objective</TableHead>
										<TableHead>Assets</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{topStates.length ? (
										topStates.map(state => (
											<TableRow key={`${state.bitstring}-${state.rank ?? 0}`}>
												<TableCell>{state.rank ?? '-'}</TableCell>
												<TableCell className='font-mono'>{state.bitstring}</TableCell>
												<TableCell className='text-right'>{formatPercent(state.probability)}</TableCell>
												<TableCell className='text-right'>{formatSignedNumber(state.objective)}</TableCell>
												<TableCell>{state.selected_assets.join(', ') || '-'}</TableCell>
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={5}
												className='text-center text-muted-foreground'
											>
												No top-state payload returned.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Card className='shadow-md ring-1 ring-foreground/5'>
					<CardHeader className='border-b border-border/70'>
						<CardTitle>Warnings and selected assets</CardTitle>
						<CardDescription>Execution caveats worth carrying into investor-facing benchmark claims.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-5 pt-6'>
						<div className='grid gap-4 md:grid-cols-2'>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<div className='flex items-center gap-2'>
									<TrendingUpIcon className='size-4 text-emerald-600' />
									<p className='font-medium'>Classical selection</p>
								</div>
								<p className='mt-3 text-sm text-muted-foreground'>
									{result.benchmark.classical.selected_assets.join(', ') || '-'}
								</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-muted/20 p-4'>
								<div className='flex items-center gap-2'>
									<CpuIcon className='size-4 text-primary' />
									<p className='font-medium'>Quantum selection</p>
								</div>
								<p className='mt-3 text-sm text-muted-foreground'>
									{result.benchmark.quantum.selected_assets.join(', ') || '-'}
								</p>
							</div>
						</div>
						<Separator />
						<div className='space-y-3'>
							<div className='flex items-center gap-2'>
								<AlertTriangleIcon className='size-4 text-amber-600' />
								<p className='font-medium'>Warnings</p>
							</div>
							{result.warnings.length ? (
								<div className='space-y-2'>
									{result.warnings.map(warning => (
										<div
											key={warning}
											className='rounded-3xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground'
										>
											{warning}
										</div>
									))}
								</div>
							) : (
								<div className='rounded-3xl border border-dashed border-border bg-muted/15 p-4 text-sm text-muted-foreground'>
									No warnings returned by the backend.
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
} */

export function FinancialAnalyticsClient() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const activeJobId = searchParams.get('jobId');

	const [form, setForm] = React.useState(INITIAL_FORM_STATE);
	const [job, setJob] = React.useState<FinancialJobResponse | null>(null);
	const [recentJobs, setRecentJobs] = React.useState<BackendFinancialJobListItem[]>([]);
	const [uploadError, setUploadError] = React.useState<string | null>(null);
	const [loadError, setLoadError] = React.useState<string | null>(null);
	const [isUploading, setIsUploading] = React.useState(false);
	const [isJobLoading, setIsJobLoading] = React.useState(false);
	const [isJobRefreshing, setIsJobRefreshing] = React.useState(false);
	const [isRecentJobsRefreshing, setIsRecentJobsRefreshing] = React.useState(false);
	const [lastSubmittedFileName, setLastSubmittedFileName] = React.useState<string | null>(null);

	const loadRecentJobs = React.useEffectEvent(async () => {
		setIsRecentJobsRefreshing(true);
		try {
			const jobs = await requestJson<BackendFinancialJobListItem[]>('/api/finance');
			setRecentJobs(jobs);
		} catch (error) {
			setUploadError(error instanceof Error ? error.message : 'Failed to load finance jobs.');
		} finally {
			setIsRecentJobsRefreshing(false);
		}
	});

	const loadJob = React.useEffectEvent(
		async (jobId: string, { silent = false }: { silent?: boolean } = {}) => {
			if (silent) {
				setIsJobRefreshing(true);
			} else {
				setIsJobLoading(true);
			}

			try {
				const nextJob = await requestJson<FinancialJobResponse>(
					`/api/finance/${encodeURIComponent(jobId)}?result_detail=summary`
				);
				setJob(nextJob);
				setLoadError(null);

				if (isTerminalStatus(nextJob.status)) {
					void loadRecentJobs();
				}
			} catch (error) {
				setLoadError(error instanceof Error ? error.message : 'Failed to load finance job.');
			} finally {
				if (silent) {
					setIsJobRefreshing(false);
				} else {
					setIsJobLoading(false);
				}
			}
		}
	);

	React.useEffect(() => {
		void loadRecentJobs();
	}, []);

	React.useEffect(() => {
		if (!activeJobId) {
			setJob(null);
			setLoadError(null);
			return;
		}

		void loadJob(activeJobId);
	}, [activeJobId]);

	React.useEffect(() => {
		if (!activeJobId || !job || isTerminalStatus(job.status) || loadError) {
			return;
		}

		const intervalId = window.setInterval(() => {
			void loadJob(activeJobId, { silent: true });
		}, POLL_INTERVAL_MS);

		return () => window.clearInterval(intervalId);
	}, [activeJobId, job, loadError]);

	const handleFormChange = React.useCallback((patch: Partial<PortfolioSubmitFormState>) => {
		setForm(current => ({ ...current, ...patch }));
	}, []);

	const navigateToJob = React.useCallback(
		(jobId: string | null) => {
			React.startTransition(() => {
				router.replace(jobId ? `/finance?jobId=${encodeURIComponent(jobId)}` : '/finance', { scroll: false });
			});
		},
		[router]
	);

	const handleFileSelected = React.useCallback(
		async (file: File) => {
			setIsUploading(true);
			setUploadError(null);
			setLoadError(null);
			setLastSubmittedFileName(file.name);

			try {
				const body = new FormData();
				body.append('file', file);
				body.append('problem_type', 'portfolio_optimization');

				if (form.budget.trim()) {
					body.append('budget', form.budget.trim());
				}
				body.append('risk_aversion', form.riskAversion.trim() || INITIAL_FORM_STATE.riskAversion);
				body.append(
					'max_assets_considered',
					form.maxAssetsConsidered.trim() || INITIAL_FORM_STATE.maxAssetsConsidered
				);
				body.append('value_mode', form.valueMode);
				body.append(
					'parameter_search_steps',
					form.parameterSearchSteps.trim() || INITIAL_FORM_STATE.parameterSearchSteps
				);

				if (form.dateColumn.trim()) {
					body.append('date_column', form.dateColumn.trim());
				}
				if (form.tickerColumn.trim()) {
					body.append('ticker_column', form.tickerColumn.trim());
				}
				if (form.valueColumn.trim()) {
					body.append('value_column', form.valueColumn.trim());
				}

				const submitted = await requestJson<FinanceSubmitResponse>('/api/finance', {
					method: 'POST',
					body
				});

				navigateToJob(submitted.job_id);
				void loadRecentJobs();
			} catch (error) {
				setUploadError(error instanceof Error ? error.message : 'Failed to submit finance job.');
			} finally {
				setIsUploading(false);
			}
		},
		[form, navigateToJob]
	);

	const result = job?.result ?? null;

	return (
		<div className='space-y-6 p-4 pb-10 md:p-6'>
			<Card className='overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(15,23,42,0.88))] text-white shadow-2xl'>
				<CardContent className='grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr]'>
					<div className='space-y-4'>
						<Badge
							variant='secondary'
							className='w-fit border-white/10 bg-white/10 text-white'
						>
							Track B - Real portfolio optimization
						</Badge>
						<div className='space-y-3'>
							<h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>
								Classical exact baseline vs routed quantum portfolio solve
							</h1>
							<p className='max-w-3xl text-sm leading-6 text-white/75 md:text-base'>
								This page is now wired to the new `backend-v2` finance workflow. It no longer uses the
								legacy analytics stub. The backend screens a portfolio universe, computes the exact
								classical optimum, synthesizes a QAOA circuit, and routes that circuit through the
								distributed quantum execution surfaces.
							</p>
						</div>
						<div className='flex flex-wrap gap-2 text-xs text-white/70'>
							<Badge className='border-white/10 bg-white/10 text-white'>exact classical search</Badge>
							<Badge className='border-white/10 bg-white/10 text-white'>QAOA bitstring states</Badge>
							<Badge className='border-white/10 bg-white/10 text-white'>distributed fragment routing</Badge>
							<Badge className='border-white/10 bg-white/10 text-white'>OpenQASM surfaced</Badge>
						</div>
					</div>
					<div className='grid gap-3 sm:grid-cols-2'>
						<div className='rounded-[2rem] border border-white/10 bg-white/8 p-4 backdrop-blur'>
							<div className='flex items-center gap-2 text-white/70'>
								<CheckCircle2Icon className='size-4' />
								<p className='text-xs uppercase tracking-[0.2em]'>Accepted inputs</p>
							</div>
							<p className='mt-3 text-sm text-white/85'>Long or wide market CSVs with dates and prices or returns.</p>
						</div>
						<div className='rounded-[2rem] border border-white/10 bg-white/8 p-4 backdrop-blur'>
							<div className='flex items-center gap-2 text-white/70'>
								<CpuIcon className='size-4' />
								<p className='text-xs uppercase tracking-[0.2em]'>Quantum surface</p>
							</div>
							<p className='mt-3 text-sm text-white/85'>Compiled QASM, top states, plan fragments, and runtime quantum result.</p>
						</div>
						<div className='rounded-[2rem] border border-white/10 bg-white/8 p-4 backdrop-blur'>
							<div className='flex items-center gap-2 text-white/70'>
								<BarChart2Icon className='size-4' />
								<p className='text-xs uppercase tracking-[0.2em]'>Benchmark output</p>
							</div>
							<p className='mt-3 text-sm text-white/85'>Objective gaps, overlap ratio, feasible probability mass, and timings.</p>
						</div>
						<div className='rounded-[2rem] border border-white/10 bg-white/8 p-4 backdrop-blur'>
							<div className='flex items-center gap-2 text-white/70'>
								<FileTextIcon className='size-4' />
								<p className='text-xs uppercase tracking-[0.2em]'>Current file</p>
							</div>
							<p className='mt-3 text-sm text-white/85'>{lastSubmittedFileName ?? 'No file submitted in this session.'}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{uploadError ? (
				<Alert variant='destructive'>
					<XCircleIcon className='size-4' />
					<AlertTitle>Submission error</AlertTitle>
					<AlertDescription>{uploadError}</AlertDescription>
				</Alert>
			) : null}

			<div className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
				<UploadPanel
					form={form}
					fileName={lastSubmittedFileName}
					uploading={isUploading}
					onChange={handleFormChange}
					onFileSelected={handleFileSelected}
				/>
				<div className='space-y-6'>
					<SelectedJobCard
						job={job}
						jobId={activeJobId}
						loadError={loadError}
						loading={isJobLoading}
						isRefreshing={isJobRefreshing}
						onRefresh={() => {
							if (activeJobId) {
								void loadJob(activeJobId, { silent: true });
							}
						}}
						onClear={() => navigateToJob(null)}
					/>
					<RecentJobsCard
						jobs={recentJobs}
						activeJobId={activeJobId}
						refreshing={isRecentJobsRefreshing}
						onRefresh={() => void loadRecentJobs()}
						onSelect={navigateToJob}
					/>
				</div>
			</div>

			{job && !result && job.status !== 'FAILED' ? (
				<Alert>
					<ActivityIcon className='size-4' />
					<AlertTitle>Awaiting result payload</AlertTitle>
					<AlertDescription>
						The job record exists, but the final benchmark payload has not been persisted yet. Polling stays
						active until the backend returns the completed portfolio result.
					</AlertDescription>
				</Alert>
			) : null}

			{result && job ? <PortfolioResultDashboard result={result} jobId={job.job_id} /> : null}
		</div>
	);
}
