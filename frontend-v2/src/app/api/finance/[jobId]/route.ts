import { NextRequest, NextResponse } from 'next/server';

import { getBackendBaseUrl, readBackendErrorDetails } from '@/lib/backend-client';
import { normalizeFinancialJobResponse } from '@/lib/backend-normalizers';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
	const { jobId } = await params;

	try {
		const backendUrl = getBackendBaseUrl();
		const apiKey = process.env.QUANTUM_BACKEND_API_KEY;
		const headers: Record<string, string> = { Accept: 'application/json' };
		if (apiKey) headers['X-API-Key'] = apiKey;

		const res = await fetch(`${backendUrl}/api/v1/finance/${encodeURIComponent(jobId)}`, {
			headers,
			cache: 'no-store'
		});

		if (res.status === 404) {
			return NextResponse.json({ error: 'Financial job not found.' }, { status: 404 });
		}
		if (!res.ok) {
			const details = await readBackendErrorDetails(res);
			return NextResponse.json({ error: 'Could not load financial job.', details }, { status: res.status });
		}

		const data = await res.json();
		const normalized = normalizeFinancialJobResponse(data);

		if (!normalized) {
			return NextResponse.json({ error: 'Financial job payload was invalid.' }, { status: 502 });
		}

		return NextResponse.json(normalized);
	} catch (err) {
		return NextResponse.json(
			{ error: 'Coordinator unreachable.', details: err instanceof Error ? err.message : 'Unknown' },
			{ status: 503 }
		);
	}
}
