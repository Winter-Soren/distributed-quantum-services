'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { RiskAnalysisResult } from '@/types/risk';
import { RISK_MODEL_LABELS } from '@/types/risk';

interface Props { result: RiskAnalysisResult; }

// ── Stat box ──────────────────────────────────────────────────────────────
function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--ds-bg-elevated)',
      border: '1px solid var(--ds-border)',
      borderRadius: 'var(--ds-radius-card)',
      padding: '10px 12px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--ds-text-primary)', margin: '2px 0 0' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--ds-text-tertiary)', margin: '2px 0 0' }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--ds-border)' }} />;
}

const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--ds-bg-elevated)',
  border: '1px solid var(--ds-border)',
  borderRadius: 6,
  fontSize: 11,
  color: 'var(--ds-text-primary)',
};

// ── Main dashboard ────────────────────────────────────────────────────────
export function RiskResultDashboard({ result }: Props) {
  const var99 = result.var_results.find(r => r.confidence_level === 0.99);

  // Build chart data
  const bins = result.loss_distribution_bins;
  const qArr = result.loss_distribution_quantum;
  const mcArr = result.loss_distribution_classical;
  const maxLen = Math.max(qArr.length, mcArr.length);
  const chartData = Array.from({ length: maxLen }, (_, i) => ({
    x: bins[i] !== undefined ? Number(bins[i].toFixed(4)) : i,
    quantum: qArr[i] ?? 0,
    classical: mcArr[i] ?? 0,
  }));

  const speedupLabel = `${result.quadratic_speedup_factor}×`;
  const mcEquivLabel = `≡ ${result.classical_mc_samples_equivalent.toLocaleString()} MC shots`;

  // VaR table
  const varRows = result.var_results.map(r => ({
    level:     `${(r.confidence_level * 100).toFixed(1)}%`,
    quantum:   r.quantum_var.toFixed(4),
    classical: r.classical_mc_var.toFixed(4),
    ci:        `[${r.quantum_ci[0].toFixed(4)}, ${r.quantum_ci[1].toFixed(4)}]`,
    dev:       `${r.deviation_pct > 0 ? '+' : ''}${r.deviation_pct.toFixed(2)}%`,
    devVal:    r.deviation_pct,
  }));

  const td: React.CSSProperties = { padding: '7px 12px 7px 0', fontSize: 12, color: 'var(--ds-text-primary)', borderBottom: '1px solid var(--ds-border)' };
  const tdMono: React.CSSProperties = { ...td, fontFamily: 'var(--ds-font-mono)', fontSize: 11 };
  const tdSecondary: React.CSSProperties = { ...tdMono, color: 'var(--ds-text-secondary)' };
  const th: React.CSSProperties = { padding: '0 12px 6px 0', fontSize: 10, fontWeight: 500, color: 'var(--ds-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--ds-border)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Tier 1 — stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <StatBox label="Portfolio" value={RISK_MODEL_LABELS[result.risk_model]} sub={`${result.portfolio_size} assets`} />
        <StatBox label="VaR 99% (Q)" value={var99 ? `${(var99.quantum_var * 100).toFixed(2)}%` : '—'} sub="Quantum IQAE" />
        <StatBox label="CVaR 99%" value={`${(result.quantum_cvar_99 * 100).toFixed(2)}%`} sub="Expected shortfall" />
        <StatBox label="Expected Loss" value={`${(result.expected_loss * 100).toFixed(2)}%`}
          sub={result.economic_capital != null ? `ECR: ${(result.economic_capital * 100).toFixed(2)}%` : undefined} />
      </div>

      <Divider />

      {/* Tier 2 — loss distribution chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SectionTitle>Loss Distribution</SectionTitle>
        <p style={{ fontSize: 11, color: 'var(--ds-text-tertiary)', margin: 0 }}>
          Quantum amplitude (blue) vs Monte Carlo histogram (grey)
        </p>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border)" />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: 'var(--ds-text-tertiary)' }} tickFormatter={v => Number(v).toFixed(2)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ds-text-tertiary)' }} width={32} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={v => `Loss: ${Number(v).toFixed(4)}`} />
              <Area type="monotone" dataKey="classical" name="MC" stroke="var(--ds-text-tertiary)" fill="var(--ds-bg-hover)" fillOpacity={0.6} strokeWidth={1} />
              <Area type="monotone" dataKey="quantum"   name="Quantum" stroke="var(--ds-accent-blue)" fill="var(--ds-accent-blue-muted)" fillOpacity={0.8} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Divider />

      {/* Tier 3 — VaR table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionTitle>VaR Results</SectionTitle>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Level', 'Quantum VaR', 'MC VaR', '95% CI', 'Δ vs MC'].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {varRows.map(row => (
                <tr key={row.level}>
                  <td style={{ ...td, fontWeight: 500 }}>{row.level}</td>
                  <td style={tdMono}>{row.quantum}</td>
                  <td style={tdSecondary}>{row.classical}</td>
                  <td style={{ ...tdSecondary, fontSize: 10 }}>{row.ci}</td>
                  <td style={{ ...tdMono, color: Math.abs(row.devVal) > 5 ? 'var(--ds-accent-yellow)' : 'var(--ds-text-secondary)' }}>{row.dev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Divider />

      {/* Tier 4 — CVaR / ECR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <StatBox label="Quantum CVaR 99%" value={`${(result.quantum_cvar_99 * 100).toFixed(2)}%`} sub="Expected shortfall above VaR99" />
        <StatBox label="Classical MC CVaR 99%" value={`${(result.classical_mc_cvar_99 * 100).toFixed(2)}%`} sub="Monte Carlo baseline" />
        {result.economic_capital != null && (
          <StatBox label="Economic Capital Req." value={`${(result.economic_capital * 100).toFixed(2)}%`} sub="VaR99 − E[L] (Basel III)" />
        )}
      </div>

      <Divider />

      {/* Tier 5 — Quantum advantage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionTitle>Quantum Advantage</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <StatBox label="Speedup Factor" value={speedupLabel} sub="O(1/ε) vs O(1/ε²)" />
          <StatBox label="MC Equivalent" value={mcEquivLabel} sub={`at ε = ${result.quadratic_speedup_factor}`} />
          <StatBox label="IQAE Oracle Calls" value={String(result.num_iqae_calls)} sub="Bisection iterations" />
        </div>
        <div style={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical"
              data={[
                { name: 'IQAE calls', value: result.num_iqae_calls },
                { name: 'MC equivalent', value: result.classical_mc_samples_equivalent },
              ]}
              margin={{ top: 0, right: 16, bottom: 0, left: 80 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--ds-text-tertiary)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--ds-text-tertiary)' }} width={76} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="var(--ds-accent-blue)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Divider />

      {/* Tier 6 — Circuit metadata */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SectionTitle>Circuit Metadata</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          <StatBox label="Total Qubits" value={String(result.num_qubits)} />
          <StatBox label="Circuit Depth" value={String(result.circuit_depth)} />
          <StatBox label="Analysis Time" value={`${(result.analysis_duration_ms / 1000).toFixed(1)}s`} />
          <StatBox label="Generated" value={new Date(result.generated_at).toLocaleTimeString()} sub={new Date(result.generated_at).toLocaleDateString()} />
        </div>

        {result.tickers.length > 0 && (
          <div style={{ background: 'var(--ds-bg-elevated)', border: '1px solid var(--ds-border)', borderRadius: 'var(--ds-radius-card)', padding: '10px 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--ds-text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 6px' }}>Portfolio Composition</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {result.tickers.map((ticker, i) => (
                <span key={ticker} style={{
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: 11,
                  border: '1px solid var(--ds-border)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: 'var(--ds-text-primary)',
                  background: 'var(--ds-bg-base)',
                }}>
                  {ticker} {(result.weights[i] * 100).toFixed(1)}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
