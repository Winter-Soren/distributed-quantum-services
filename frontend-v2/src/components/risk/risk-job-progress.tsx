import type { RiskJobStatus } from '@/types/risk';

const STEPS: { key: RiskJobStatus; label: string }[] = [
  { key: 'queued',    label: 'Queued' },
  { key: 'running',  label: 'IQAE Running' },
  { key: 'completed',label: 'Complete' },
];

interface Props { status: RiskJobStatus; }

export function RiskJobProgress({ status }: Props) {
  const currentIdx = status === 'failed' ? -1 : STEPS.findIndex(s => s.key === status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {STEPS.map((step, idx) => {
        const done   = currentIdx > idx || status === 'completed';
        const active = currentIdx === idx;
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: done
                  ? 'var(--ds-accent-green)'
                  : active
                    ? 'var(--ds-accent-blue)'
                    : status === 'failed'
                      ? 'var(--ds-accent-red)'
                      : 'var(--ds-border)',
                boxShadow: active ? '0 0 0 3px var(--ds-accent-blue-muted)' : undefined,
                transition: 'background var(--ds-transition)',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>{step.label}</span>
            {idx < STEPS.length - 1 && (
              <div style={{ width: 16, height: 1, background: 'var(--ds-border)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
