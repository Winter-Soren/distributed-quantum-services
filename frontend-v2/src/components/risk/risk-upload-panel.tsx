'use client';

import { useRef, useState } from 'react';

import { UploadIcon } from 'lucide-react';

import type { RiskModel } from '@/types/risk';

interface Props {
  onSubmit: (file: File, params: UploadParams) => void;
  loading: boolean;
}

export interface UploadParams {
  risk_model: RiskModel;
  num_uncertainty_qubits: number;
  epsilon: number;
  alpha: number;
  lookback_days: number;
}

const INPUT_BASE: React.CSSProperties = {
  background: 'var(--ds-bg-base)',
  border: '1px solid var(--ds-border)',
  color: 'var(--ds-text-primary)',
  borderRadius: 'var(--ds-radius-btn)',
  padding: '6px 10px',
  fontSize: 12,
  width: '100%',
  outline: 'none',
  transition: 'border-color var(--ds-transition), box-shadow var(--ds-transition)',
};

function DSInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...INPUT_BASE,
        ...(focused ? { borderColor: 'var(--ds-border-focus)', boxShadow: 'var(--ds-focus-ring)' } : {}),
        ...(props.style ?? {}),
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

export function RiskUploadPanel({ onSubmit, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<RiskModel>('equity');
  const [qubits, setQubits] = useState(5);
  const [epsilon, setEpsilon] = useState(0.05);
  const [alpha, setAlpha] = useState(0.05);
  const [lookback, setLookback] = useState(504);
  const [dropHover, setDropHover] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) setFile(f);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    onSubmit(file, { risk_model: mode, num_uncertainty_qubits: qubits, epsilon, alpha, lookback_days: lookback });
  }

  const fields = [
    { label: 'Uncertainty Qubits', value: qubits, min: 3, max: 8, step: 1, set: setQubits },
    { label: 'IQAE ε (precision)',  value: epsilon, min: 0.01, max: 0.49, step: 0.01, set: (v: number) => setEpsilon(v) },
    { label: 'IQAE α (confidence)', value: alpha,   min: 0.01, max: 0.49, step: 0.01, set: (v: number) => setAlpha(v) },
    ...(mode === 'equity'
      ? [{ label: 'Lookback Days', value: lookback, min: 60, max: 2520, step: 60, set: (v: number) => setLookback(v) }]
      : []),
  ];

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--ds-text-secondary)',
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 3,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['equity', 'credit'] as const).map(m => {
          const active = mode === m;
          return (
            <ModeBtn key={m} active={active} onClick={() => setMode(m)}>
              {m === 'equity' ? 'Equity VaR' : 'Credit VaR'}
            </ModeBtn>
          );
        })}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDropHover(true); }}
        onDragLeave={() => setDropHover(false)}
        onDrop={e => {
          e.preventDefault();
          setDropHover(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        style={{
          border: `1px dashed ${dropHover ? 'var(--ds-accent-blue)' : 'var(--ds-border)'}`,
          borderRadius: 'var(--ds-radius-card)',
          background: 'var(--ds-bg-base)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          transition: 'border-color var(--ds-transition)',
        }}
      >
        <UploadIcon style={{ width: 14, height: 14, color: 'var(--ds-text-tertiary)' }} />
        <span style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          {file ? file.name : 'Drop CSV or click to browse'}
        </span>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* CSV spec hint */}
      <div style={{ fontSize: 11, color: 'var(--ds-text-tertiary)', lineHeight: 1.6 }}>
        {mode === 'equity' ? (
          <>
            <span style={{ color: 'var(--ds-text-secondary)', fontWeight: 500 }}>Equity columns: </span>
            <code style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-primary)' }}>ticker</code>
            {' '}(required),{' '}
            <code style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-primary)' }}>weight</code>
            {' '}(optional)
            <br />
            <span style={{ fontStyle: 'italic' }}>e.g. AAPL,0.4 / GOOGL,0.35 / MSFT,0.25</span>
          </>
        ) : (
          <>
            <span style={{ color: 'var(--ds-text-secondary)', fontWeight: 500 }}>Credit columns: </span>
            {['principal', 'default_probability', 'recovery_rate'].map(col => (
              <span key={col}>
                <code style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-primary)' }}>{col}</code>
                {', '}
              </span>
            ))}
            + optional{' '}
            {['loan_id', 'sensitivity_rho'].map(col => (
              <code key={col} style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-primary)' }}>{col} </code>
            ))}
          </>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--ds-border)' }} />

      {/* IQAE config */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {fields.map(({ label, value, min, max, step, set }) => (
          <div key={label}>
            <label style={labelStyle}>{label}</label>
            <DSInput
              type="number"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={e => set(Number(e.target.value))}
            />
          </div>
        ))}
      </div>

      <SubmitBtn disabled={!file || loading}>
        {loading ? 'Submitting…' : 'Run Quantum Risk Analysis'}
      </SubmitBtn>
    </form>
  );
}

function ModeBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 12px',
        borderRadius: 'var(--ds-radius-btn)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background var(--ds-transition)',
        border: active ? '1px solid var(--ds-accent-blue)' : '1px solid var(--ds-border)',
        background: active ? 'var(--ds-accent-blue)' : hov ? 'var(--ds-bg-hover)' : 'transparent',
        color: active ? '#ffffff' : 'var(--ds-text-secondary)',
      }}
    >
      {children}
    </button>
  );
}

function SubmitBtn({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && !disabled ? 'var(--ds-accent-blue-hover)' : 'var(--ds-accent-blue)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 'var(--ds-radius-btn)',
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--ds-transition)',
        width: '100%',
      }}
    >
      {children}
    </button>
  );
}
