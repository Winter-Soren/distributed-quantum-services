'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import type { RiskJobResponse, RiskJobSummary, RiskSubmitResponse } from '@/types/risk';

import { RiskHero } from './risk-hero';
import { RiskJobCard } from './risk-job-card';
import { RiskJobProgress } from './risk-job-progress';
import { RiskResultDashboard } from './risk-result-dashboard';
import type { UploadParams } from './risk-upload-panel';
import { RiskUploadPanel } from './risk-upload-panel';

const POLL_MS = 2500;
const TERMINAL = new Set(['completed', 'failed']);

export function RiskAnalyticsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeJobId = searchParams.get('jobId') ?? null;

  const [jobs, setJobs] = useState<RiskJobSummary[]>([]);
  const [activeJob, setActiveJob] = useState<RiskJobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const fetchJob = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/risk/${jobId}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: RiskJobResponse = await res.json();
      setActiveJob(data);
      if (TERMINAL.has(data.status)) stopPoll();
    } catch { /* swallow */ }
  }, [stopPoll]);

  const startPoll = useCallback((jobId: string) => {
    stopPoll();
    fetchJob(jobId);
    pollRef.current = setInterval(() => fetchJob(jobId), POLL_MS);
  }, [fetchJob, stopPoll]);

  useEffect(() => {
    fetch('/api/risk', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then((data: RiskJobSummary[]) => setJobs(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeJobId) startPoll(activeJobId);
    return () => stopPoll();
  }, [activeJobId, startPoll, stopPoll]);

  async function handleSubmit(file: File, params: UploadParams) {
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const qs = new URLSearchParams({
        num_uncertainty_qubits: String(params.num_uncertainty_qubits),
        epsilon: String(params.epsilon),
        alpha: String(params.alpha),
        lookback_days: String(params.lookback_days),
      }).toString();
      const res = await fetch(`/api/risk?${qs}`, { method: 'POST', body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || 'Submission failed');
      }
      const submitted: RiskSubmitResponse = await res.json();
      setJobs(prev => [{
        job_id: submitted.job_id,
        status: submitted.status,
        risk_model: submitted.risk_model,
        portfolio_size: submitted.portfolio_size,
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, ...prev]);
      router.replace(`/risk?jobId=${submitted.job_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const divider: React.CSSProperties = { height: 1, background: 'var(--ds-border)', margin: '16px 0' };
  const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: 'var(--ds-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 };

  return (
    <div style={{ padding: '16px 24px 48px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--ds-bg-base)', minHeight: '100%' }}>
      <RiskHero />
      <div style={divider} />

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, minHeight: 0 }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)', borderRadius: 'var(--ds-radius-card)', padding: 16 }}>
            <RiskUploadPanel onSubmit={handleSubmit} loading={loading} />
          </div>

          {error && (
            <div style={{ background: 'var(--ds-accent-red-muted)', border: '1px solid var(--ds-accent-red)', borderRadius: 'var(--ds-radius-btn)', padding: '10px 12px', fontSize: 12, color: 'var(--ds-accent-red)' }}>
              {error}
            </div>
          )}

          {jobs.length > 0 && (
            <div>
              <p style={sectionLabel}>Recent Jobs</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {jobs.slice(0, 8).map(job => (
                  <RiskJobCard
                    key={job.job_id}
                    job={job}
                    onSelect={id => router.replace(`/risk?jobId=${id}`)}
                    active={job.job_id === activeJobId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div>
          {activeJob ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <RiskJobProgress status={activeJob.status} />
                <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 11, color: 'var(--ds-text-tertiary)' }}>
                  {activeJob.job_id}
                </span>
              </div>

              {activeJob.status === 'failed' && (
                <div style={{ background: 'var(--ds-accent-red-muted)', border: '1px solid var(--ds-accent-red)', borderRadius: 'var(--ds-radius-btn)', padding: '10px 12px', fontSize: 12, color: 'var(--ds-accent-red)' }}>
                  Job failed: {activeJob.error}
                </div>
              )}

              {activeJob.status === 'completed' && activeJob.result && (
                <RiskResultDashboard result={activeJob.result} />
              )}

              {(activeJob.status === 'queued' || activeJob.status === 'running') && (
                <div style={{ background: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)', borderRadius: 'var(--ds-radius-card)', padding: '48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--ds-text-tertiary)' }}>Running IQAE circuits…</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ border: '1px dashed var(--ds-border)', borderRadius: 'var(--ds-radius-card)', padding: '48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--ds-text-tertiary)' }}>
                Upload a portfolio CSV to start the analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
