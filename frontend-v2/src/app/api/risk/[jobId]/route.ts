import { NextRequest, NextResponse } from 'next/server';

import { applyBackendAuth, getBackendBaseUrl, readBackendErrorDetails } from '@/lib/backend-client';

export const dynamic = 'force-dynamic';

/** GET /api/risk/[jobId] — poll a risk job */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const backendUrl = getBackendBaseUrl();
    const headers: Record<string, string> = { Accept: 'application/json' };
    applyBackendAuth(headers);

    let res: Response;
    try {
      res = await fetch(`${backendUrl}/api/v1/risk/${jobId}`, { headers, cache: 'no-store' });
    } catch (err) {
      return NextResponse.json(
        { error: 'Coordinator unreachable.', details: err instanceof Error ? err.message : 'Network error' },
        { status: 503 }
      );
    }

    if (!res.ok) {
      const detail = await readBackendErrorDetails(res);
      return NextResponse.json({ error: 'Risk job not found.', details: detail }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch risk job.', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
