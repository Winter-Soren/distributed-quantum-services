import { NextRequest, NextResponse } from 'next/server';

import {
	BackendClientError,
	applyBackendAuth,
	getBackendBaseUrl,
	readBackendErrorDetails
} from '@/lib/backend-client';
import { normalizeFinancialJobList, normalizeFinancialJobStatus } from '@/lib/backend-normalizers';

export const dynamic = 'force-dynamic';

/** POST /api/finance — receives multipart CSV, streams it to coordinator */
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file || typeof file === 'string') {
			return NextResponse.json({ error: 'No CSV file provided.' }, { status: 400 });
		}

		const backendUrl = getBackendBaseUrl();

		const upstream = new FormData();
		for (const [key, value] of formData.entries()) {
			if (key === 'file') {
				upstream.append('file', file);
				continue;
			}

			if (typeof value === 'string' && value.trim()) {
				upstream.append(key, value);
			}
		}

		const headers: Record<string, string> = {};
		applyBackendAuth(headers);

		let res: Response;
		try {
			res = await fetch(`${backendUrl}/api/v1/finance/submit`, {
				method: 'POST',
				headers,
				body: upstream,
				cache: 'no-store'
			});
		} catch (err) {
			return NextResponse.json(
				{
					error: 'Coordinator unreachable.',
					details: err instanceof Error ? err.message : 'Network error'
				},
				{ status: 503 }
			);
		}

		if (!res.ok) {
			const detail = await readBackendErrorDetails(res);
			return NextResponse.json(
				{ error: 'Coordinator rejected the upload.', details: detail },
				{ status: res.status }
			);
		}

		const payload = (await res.json()) as { job_id?: unknown; status?: unknown; problem_type?: unknown };
		return NextResponse.json({
			job_id: typeof payload.job_id === 'string' ? payload.job_id : 'fin-unknown',
			status: normalizeFinancialJobStatus(payload.status),
			problem_type:
				typeof payload.problem_type === 'string' ? payload.problem_type : 'portfolio_optimization'
		});
	} catch (error) {
		const status = error instanceof BackendClientError ? error.status : 500;
		return NextResponse.json(
			{ error: 'Failed to submit financial job.', details: error instanceof Error ? error.message : 'Unknown' },
			{ status }
		);
	}
}

/** GET /api/finance — list recent financial jobs */
export async function GET() {
	try {
		const backendUrl = getBackendBaseUrl();
		const headers: Record<string, string> = { Accept: 'application/json' };
		applyBackendAuth(headers);

		const res = await fetch(`${backendUrl}/api/v1/finance?limit=20`, {
			headers,
			cache: 'no-store'
		});
		if (!res.ok) {
			const details = await readBackendErrorDetails(res);
			return NextResponse.json({ error: 'Could not load financial jobs.', details }, { status: res.status });
		}
		const data = await res.json();
		return NextResponse.json(normalizeFinancialJobList(data));
	} catch (err) {
		return NextResponse.json(
			{ error: 'Coordinator unreachable.', details: err instanceof Error ? err.message : 'Unknown' },
			{ status: 503 }
		);
	}
}
