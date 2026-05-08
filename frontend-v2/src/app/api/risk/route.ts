import { NextRequest, NextResponse } from 'next/server';

import { applyBackendAuth, getBackendBaseUrl, readBackendErrorDetails } from '@/lib/backend-client';

export const dynamic = 'force-dynamic';

/** POST /api/risk — submit a risk job via CSV upload */
export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendBaseUrl();
    const formData = await request.formData();
    const headers: Record<string, string> = { Accept: 'application/json' };
    applyBackendAuth(headers);

    // Forward query params (num_uncertainty_qubits, epsilon, alpha, lookback_days)
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const url = `${backendUrl}/api/v1/risk/submit-csv${qs ? `?${qs}` : ''}`;

    let res: Response;
    try {
      res = await fetch(url, { method: 'POST', headers, body: formData, cache: 'no-store' });
    } catch (err) {
      return NextResponse.json(
        { error: 'Coordinator unreachable.', details: err instanceof Error ? err.message : 'Network error' },
        { status: 503 }
      );
    }

    if (!res.ok) {
      const detail = await readBackendErrorDetails(res);
      return NextResponse.json({ error: 'Backend rejected the risk job.', details: detail }, { status: res.status });
    }

    const payload = await res.json();
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to submit risk job.', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

/** GET /api/risk — list recent risk jobs */
export async function GET() {
  try {
    const backendUrl = getBackendBaseUrl();
    const headers: Record<string, string> = { Accept: 'application/json' };
    applyBackendAuth(headers);

    const res = await fetch(`${backendUrl}/api/v1/risk?limit=20`, { headers, cache: 'no-store' });
    if (!res.ok) {
      const details = await readBackendErrorDetails(res);
      return NextResponse.json({ error: 'Could not load risk jobs.', details }, { status: res.status });
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
