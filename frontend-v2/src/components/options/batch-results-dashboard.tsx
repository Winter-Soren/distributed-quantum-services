'use client';

import * as React from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react';

import type { BatchOptionsResult, BatchOptionsRowResult } from '@/types/options-batch';
import { OPTION_TYPE_LABELS } from '@/types/options';
import type { OptionType } from '@/types/options';

function fmt(v: number, decimals = 2) {
	return v.toFixed(decimals);
}

function pctCell(v: number | null) {
	if (v === null) return <span className='text-muted-foreground'>—</span>;
	const pos = v >= 0;
	return (
		<span className={pos ? 'text-foreground' : 'text-foreground'}>
			{pos ? '+' : ''}{fmt(v, 1)}%
		</span>
	);
}

function moneynessChip(m: string) {
	const styles: Record<string, string> = {
		ITM: 'bg-muted text-foreground',
		ATM: 'bg-muted text-foreground',
		OTM: 'bg-muted text-muted-foreground'
	};
	return (
		<span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[m] ?? 'bg-muted text-foreground'}`}>
			{m}
		</span>
	);
}

function SummaryBar({ result }: { result: BatchOptionsResult }) {
	const { summary } = result;
	const hasMarket = summary.mean_quantum_vs_market_pct !== null;

	return (
		<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
			<StatBox label='Rows processed' value={`${summary.succeeded} / ${summary.total_rows}`} />
			<StatBox
				label='Avg Quantum vs B-S'
				value={`${summary.mean_quantum_bs_diff_pct >= 0 ? '+' : ''}${fmt(summary.mean_quantum_bs_diff_pct, 1)}%`}
				hint='Mean (Q−BS)/BS'
			/>
			{hasMarket ? (
				<>
					<StatBox
						label='Avg Quantum vs Market'
						value={`${(summary.mean_quantum_vs_market_pct ?? 0) >= 0 ? '+' : ''}${fmt(summary.mean_quantum_vs_market_pct ?? 0, 1)}%`}
						hint='Mean (Q−mkt)/mkt'
					/>
					<StatBox
						label='Avg B-S vs Market'
						value={`${(summary.mean_bs_vs_market_pct ?? 0) >= 0 ? '+' : ''}${fmt(summary.mean_bs_vs_market_pct ?? 0, 1)}%`}
						hint='Mean (BS−mkt)/mkt'
					/>
				</>
			) : (
				<>
					<StatBox label='Divergence warnings' value={String(summary.rows_with_divergence_warning)} />
					<StatBox label='Total run time' value={`${(summary.total_duration_ms / 1000).toFixed(1)}s`} />
				</>
			)}
		</div>
	);
}

function StatBox({ label, value, hint }: { label: string; value: string; hint?: string }) {
	return (
		<div className='rounded-md border border-border bg-card px-3 py-2.5'>
			<p className='text-[10px] text-muted-foreground'>{label}</p>
			<p className='mt-0.5 text-base font-semibold text-foreground'>{value}</p>
			{hint ? <p className='text-[10px] text-muted-foreground'>{hint}</p> : null}
		</div>
	);
}

function RowTable({
	rows,
	hasMarket
}: {
	rows: BatchOptionsRowResult[];
	hasMarket: boolean;
}) {
	return (
		<div className='overflow-x-auto rounded-md border border-border'>
			<table className='w-full text-xs'>
				<thead>
					<tr className='border-b border-border bg-muted/40'>
						<th className='px-3 py-2 text-left font-medium text-foreground'>#</th>
						<th className='px-3 py-2 text-left font-medium text-foreground'>Option type</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>S</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>K</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>T (yr)</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>σ</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>Quantum</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>B-S</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>Binomial</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>Q vs BS</th>
						{hasMarket ? (
							<>
								<th className='px-3 py-2 text-right font-medium text-foreground'>Market</th>
								<th className='px-3 py-2 text-right font-medium text-foreground'>Q vs Mkt</th>
								<th className='px-3 py-2 text-right font-medium text-foreground'>BS vs Mkt</th>
							</>
						) : null}
						<th className='px-3 py-2 text-right font-medium text-foreground'>Q δ</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>BS δ</th>
						<th className='px-3 py-2 text-left font-medium text-foreground'>Money</th>
						<th className='px-3 py-2 text-left font-medium text-foreground'>Warn</th>
						<th className='px-3 py-2 text-right font-medium text-foreground'>ms</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(row => (
						<tr key={row.row_index} className='border-b border-border last:border-0 hover:bg-muted/20'>
							<td className='px-3 py-2 text-muted-foreground'>{row.row_index + 1}</td>
							<td className='px-3 py-2 text-foreground'>
								{OPTION_TYPE_LABELS[row.option_type as OptionType] ?? row.option_type}
							</td>
							<td className='px-3 py-2 text-right text-foreground'>{fmt(row.current_value)}</td>
							<td className='px-3 py-2 text-right text-foreground'>{fmt(row.strike_or_cost)}</td>
							<td className='px-3 py-2 text-right text-foreground'>{row.time_to_expiry}</td>
							<td className='px-3 py-2 text-right text-foreground'>{(row.volatility * 100).toFixed(0)}%</td>
							<td className='px-3 py-2 text-right font-medium text-foreground'>${fmt(row.quantum_price, 4)}</td>
							<td className='px-3 py-2 text-right text-foreground'>${fmt(row.classical_bs_price, 4)}</td>
							<td className='px-3 py-2 text-right text-muted-foreground'>${fmt(row.classical_binomial_price, 4)}</td>
							<td className='px-3 py-2 text-right'>{pctCell(row.price_difference_pct)}</td>
							{hasMarket ? (
								<>
									<td className='px-3 py-2 text-right text-muted-foreground'>
										{row.market_price !== null ? `$${fmt(row.market_price, 4)}` : '—'}
									</td>
									<td className='px-3 py-2 text-right'>{pctCell(row.quantum_vs_market_pct)}</td>
									<td className='px-3 py-2 text-right'>{pctCell(row.bs_vs_market_pct)}</td>
								</>
							) : null}
							<td className='px-3 py-2 text-right text-foreground'>{fmt(row.quantum_delta, 4)}</td>
							<td className='px-3 py-2 text-right text-muted-foreground'>{fmt(row.classical_delta, 4)}</td>
							<td className='px-3 py-2'>{moneynessChip(row.moneyness)}</td>
							<td className='px-3 py-2'>
								{row.divergence_warning ? (
									<AlertTriangleIcon className='size-3.5 text-muted-foreground' />
								) : (
									<CheckCircle2Icon className='size-3.5 text-muted-foreground' />
								)}
							</td>
							<td className='px-3 py-2 text-right text-muted-foreground'>{row.analysis_duration_ms}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function BatchResultsDashboard({ result }: { result: BatchOptionsResult }) {
	const hasMarket = result.rows.some(r => r.market_price !== null);

	return (
		<div className='space-y-5'>
			{/* Summary stats */}
			<div className='space-y-2'>
				<p className='text-xs font-semibold text-foreground'>Benchmark summary</p>
				<SummaryBar result={result} />
			</div>

			{/* Error rows */}
			{result.errors.length > 0 ? (
				<div className='space-y-2'>
					<p className='text-xs font-semibold text-foreground'>
						Rows with errors ({result.errors.length})
					</p>
					<div className='space-y-1.5'>
						{result.errors.map(e => (
							<div
								key={e.row_index}
								className='flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs'
							>
								<XCircleIcon className='mt-0.5 size-3.5 shrink-0 text-muted-foreground' />
								<span className='text-muted-foreground'>
									Row {e.row_index + 1}: {e.error}
								</span>
							</div>
						))}
					</div>
				</div>
			) : null}

			{/* Per-row results table */}
			{result.rows.length > 0 ? (
				<div className='space-y-2'>
					<div className='flex items-center justify-between'>
						<p className='text-xs font-semibold text-foreground'>
							Per-contract results ({result.rows.length} rows)
						</p>
						<p className='text-xs text-muted-foreground'>
							Total: {(result.summary.total_duration_ms / 1000).toFixed(1)}s
						</p>
					</div>
					<RowTable rows={result.rows} hasMarket={hasMarket} />
				</div>
			) : null}

			{/* Divergence note */}
			{result.summary.rows_with_divergence_warning > 0 ? (
				<div className='flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground'>
					<AlertTriangleIcon className='mt-0.5 size-3.5 shrink-0' />
					<span>
						{result.summary.rows_with_divergence_warning} row(s) show &gt;5% quantum–classical divergence.
						This is expected for NISQ-era IQAE with coarse qubit grids — increase{' '}
						<code className='font-mono'>num_uncertainty_qubits</code> per row for tighter results.
					</span>
				</div>
			) : null}
		</div>
	);
}
