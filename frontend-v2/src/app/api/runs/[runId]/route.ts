import { NextRequest, NextResponse } from 'next/server';

import { BackendClientError, fetchBackendJson } from '@/lib/backend-client';
import { normalizeFinancialJobResponse } from '@/lib/backend-normalizers';
import { buildFinancialRunDetailSnapshot, buildRunDetailSnapshot } from '@/lib/run-transformers';
import type { BackendHealthResponse, BackendJobStatusResponse, BackendPlanResponse } from '@/types/backend';
import type { RunsApiError } from '@/types/runs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
	const { runId } = await params;
	const generatedAt = new Date().toISOString();
	const warnings: string[] = [];
	const resultDetail = request.nextUrl.searchParams.get('result_detail') === 'full' ? 'full' : 'summary';

	try {
		/** Financial jobs use `fin-{uuid}` and live under `/api/v1/finance`, not `/api/v1/jobs`. */
		if (runId.startsWith('fin-')) {
			const [healthResult, financeResult] = await Promise.allSettled([
				fetchBackendJson<BackendHealthResponse>('/api/v1/health'),
				fetchBackendJson<unknown>(`/api/v1/finance/${encodeURIComponent(runId)}`)
			]);

			if (financeResult.status === 'rejected') {
				throw financeResult.reason;
			}

			if (healthResult.status === 'rejected') {
				warnings.push('Coordinator health metadata is unavailable for this run detail view.');
			}

			const job = normalizeFinancialJobResponse(financeResult.value);

			if (!job) {
				return NextResponse.json(
					{
						error: `Unable to load run ${runId}.`,
						details: 'Financial job payload was invalid.'
					} satisfies RunsApiError,
					{ status: 502 }
				);
			}

			return NextResponse.json(
				buildFinancialRunDetailSnapshot({
					generatedAt,
					health: healthResult.status === 'fulfilled' ? healthResult.value : null,
					job,
					warnings
				})
			);
		}

		const [healthResult, jobResult] = await Promise.allSettled([
			fetchBackendJson<BackendHealthResponse>('/api/v1/health'),
			fetchBackendJson<BackendJobStatusResponse>(
				`/api/v1/jobs/${encodeURIComponent(runId)}?result_detail=${resultDetail}`
			)
		]);

		if (jobResult.status === 'rejected') {
			throw jobResult.reason;
		}

		if (healthResult.status === 'rejected') {
			warnings.push('Coordinator health metadata is unavailable for this run detail view.');
		}

		let plan: BackendPlanResponse | null = null;

		if (jobResult.value.plan_id) {
			try {
				plan = await fetchBackendJson<BackendPlanResponse>(
					`/api/v1/plans/${encodeURIComponent(jobResult.value.plan_id)}`
				);
			} catch {
				warnings.push(`Plan ${jobResult.value.plan_id} could not be loaded right now.`);
			}
		}

		return NextResponse.json(
			buildRunDetailSnapshot({
				generatedAt,
				health: healthResult.status === 'fulfilled' ? healthResult.value : null,
				job: jobResult.value,
				plan,
				warnings
			})
		);
	} catch (error) {
		const status = error instanceof BackendClientError ? (error.status >= 500 ? 502 : error.status) : 500;
		const payload: RunsApiError = {
			error: `Unable to load run ${runId}.`,
			details:
				error instanceof BackendClientError
					? (error.details ?? error.message)
					: error instanceof Error
						? error.message
						: 'Unknown run detail failure.'
		};

		return NextResponse.json(payload, { status });
	}
}
