export type RiskModel = 'equity' | 'credit';

export type RiskJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export const RISK_MODEL_LABELS: Record<RiskModel, string> = {
  equity: 'Equity Portfolio VaR',
  credit: 'Credit Portfolio VaR',
};

export interface RiskVaRResult {
  confidence_level: number;
  quantum_var: number;
  classical_mc_var: number;
  quantum_ci: [number, number];
  deviation_pct: number;
}

export interface RiskAnalysisResult {
  job_id: string;
  risk_model: RiskModel;
  portfolio_size: number;
  tickers: string[];
  weights: number[];
  var_results: RiskVaRResult[];
  quantum_cvar_99: number;
  classical_mc_cvar_99: number;
  expected_loss: number;
  economic_capital: number | null;
  loss_distribution_quantum: number[];
  loss_distribution_classical: number[];
  loss_distribution_bins: number[];
  quadratic_speedup_factor: number;
  classical_mc_samples_equivalent: number;
  num_qubits: number;
  circuit_depth: number;
  num_iqae_calls: number;
  analysis_duration_ms: number;
  generated_at: string;
}

export interface RiskJobResponse {
  job_id: string;
  status: RiskJobStatus;
  risk_model: RiskModel;
  portfolio_size: number;
  result: RiskAnalysisResult | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskSubmitResponse {
  job_id: string;
  status: RiskJobStatus;
  risk_model: RiskModel;
  portfolio_size: number;
}

export interface RiskJobSummary {
  job_id: string;
  status: RiskJobStatus;
  risk_model: RiskModel;
  portfolio_size: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}
