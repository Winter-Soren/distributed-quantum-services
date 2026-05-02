const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export const BACKEND = {
  BASE_URL,
  HEALTH: `${BASE_URL}/health`,
  RUNS: {
    LIST: `${BASE_URL}/runs`,
    CREATE: `${BASE_URL}/runs`,
    DETAIL: (id: string) => `${BASE_URL}/runs/${id}` as const,
  },
  OPTIONS: {
    PRICE: `${BASE_URL}/options/price`,
    BATCH: `${BASE_URL}/options/batch`,
  },
  RISK: {
    ANALYZE: `${BASE_URL}/risk/analyze`,
  },
  FINANCE: {
    OPTIMIZE: `${BASE_URL}/finance/optimize`,
    COMPARE: (jobId: string) => `${BASE_URL}/finance/${jobId}/compare` as const,
  },
  NETWORK: {
    STATUS: `${BASE_URL}/network/status`,
    NODES: `${BASE_URL}/network/nodes`,
  },
} as const;
