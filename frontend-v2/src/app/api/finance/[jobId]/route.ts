import { NextRequest, NextResponse } from 'next/server';

import { getBackendBaseUrl } from '@/lib/backend-client';

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
			return NextResponse.json({ error: 'Could not load financial job.' }, { status: res.status });
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
