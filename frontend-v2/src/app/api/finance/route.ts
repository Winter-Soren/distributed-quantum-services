import { NextRequest, NextResponse } from 'next/server';

import { BackendClientError, getBackendBaseUrl } from '@/lib/backend-client';

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
		const apiKey = process.env.QUANTUM_BACKEND_API_KEY;

		const upstream = new FormData();
		upstream.append('file', file);

		const headers: Record<string, string> = {};
		if (apiKey) headers['X-API-Key'] = apiKey;

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
			let detail: string | undefined;
			try {
				const body = (await res.json()) as { detail?: string };
				detail = body.detail;
			} catch {
				detail = res.statusText;
			}
			return NextResponse.json(
				{ error: 'Coordinator rejected the upload.', details: detail },
				{ status: res.status }
			);
		}

		const payload = (await res.json()) as { job_id: string; status: string };
		return NextResponse.json(payload);
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
		const apiKey = process.env.QUANTUM_BACKEND_API_KEY;
		const headers: Record<string, string> = { Accept: 'application/json' };
		if (apiKey) headers['X-API-Key'] = apiKey;

		const res = await fetch(`${backendUrl}/api/v1/finance?limit=20`, {
			headers,
			cache: 'no-store'
		});
		if (!res.ok) {
			return NextResponse.json({ error: 'Could not load financial jobs.' }, { status: res.status });
		}
		const data = await res.json();
		return NextResponse.json(data);
	} catch (err) {
		return NextResponse.json(
			{ error: 'Coordinator unreachable.', details: err instanceof Error ? err.message : 'Unknown' },
			{ status: 503 }
		);
	}
}
