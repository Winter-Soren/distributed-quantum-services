'use client';

import { useState } from 'react';

import type { RiskJobSummary } from '@/types/risk';

interface Props {
  job: RiskJobSummary;
  onSelect: (jobId: string) => void;
  active: boolean;
}

const STATUS_BADGE: Record<string, React.CSSProperties> = {
  completed: { background: 'var(--ds-accent-green-muted)', color: 'var(--ds-accent-green)' },
  failed:    { background: 'var(--ds-accent-red-muted)',   color: 'var(--ds-accent-red)' },
  running:   { background: 'var(--ds-accent-blue-muted)',  color: 'var(--ds-accent-blue)' },
  queued:    { background: 'var(--ds-accent-yellow-muted)',color: 'var(--ds-accent-yellow)' },
};

export function RiskJobCard({ job, onSelect, active }: Props) {
  const [hov, setHov] = useState(false);
  const badge = STATUS_BADGE[job.status] ?? STATUS_BADGE.queued;

  return (
    <button
      onClick={() => onSelect(job.job_id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 'var(--ds-radius-card)',
        border: active
          ? '1px solid var(--ds-accent-blue)'
          : '1px solid var(--ds-border)',
        background: active ? 'var(--ds-bg-hover)' : hov ? 'var(--ds-bg-hover)' : 'var(--ds-bg-elevated)',
        cursor: 'pointer',
        transition: 'background var(--ds-transition)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 11, color: 'var(--ds-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.job_id}
        </span>
        <span style={{ flexShrink: 0, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 500, ...badge }}>
          {job.status}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
        {job.risk_model} · {job.portfolio_size} assets
      </div>
    </button>
  );
}
