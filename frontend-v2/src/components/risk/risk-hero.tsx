import { ShieldIcon } from 'lucide-react';

export function RiskHero() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldIcon style={{ width: 16, height: 16, color: 'var(--ds-text-secondary)' }} />
        <h1 style={{ color: 'var(--ds-text-primary)', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
          TRACK D — QUANTUM RISK ENGINE
        </h1>
      </div>
      <p style={{ color: 'var(--ds-text-secondary)', fontSize: 13, lineHeight: 1.5, maxWidth: 640, margin: 0 }}>
        Portfolio Value-at-Risk &amp; CVaR via Iterative Quantum Amplitude Estimation (IQAE).
        Achieves quadratic speedup O(1/ε) vs classical Monte Carlo O(1/ε²). Upload a portfolio
        CSV and compare quantum vs classical risk estimates side-by-side.
      </p>
    </div>
  );
}
