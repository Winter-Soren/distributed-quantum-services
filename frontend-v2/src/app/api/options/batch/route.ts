import { NextRequest, NextResponse } from 'next/server';

import { applyBackendAuth, getBackendBaseUrl, readBackendErrorDetails } from '@/lib/backend-client';

export const dynamic = 'force-dynamic';

/** POST /api/options/batch — forward multipart CSV to backend batch endpoint */
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const backendUrl = getBackendBaseUrl();
		const headers: Record<string, string> = { Accept: 'application/json' };
		applyBackendAuth(headers);

		let res: Response;
		try {
			res = await fetch(`${backendUrl}/api/v1/options/batch`, {
				method: 'POST',
				headers,
				body: formData,
				cache: 'no-store'
			});
		} catch (err) {
			return NextResponse.json(
				{ error: 'Coordinator unreachable.', details: err instanceof Error ? err.message : 'Network error' },
				{ status: 503 }
			);
		}

		if (!res.ok) {
			const detail = await readBackendErrorDetails(res);
			return NextResponse.json(
				{ error: 'Batch benchmark failed.', details: detail },
				{ status: res.status }
			);
		}

		const payload = await res.json();
		return NextResponse.json(payload);
	} catch (error) {
		return NextResponse.json(
			{
				error: 'Failed to run batch benchmark.',
				details: error instanceof Error ? error.message : 'Unknown'
			},
			{ status: 500 }
		);
	}
}
