export const API = {
  AUTH: {
    ALL: "/api/auth/*",
    CHECK_EMAIL: "/api/auth/check-email",
  },
  DASHBOARD: "/api/dashboard",
  RUNS: {
    LIST: "/api/runs",
    CREATE: "/api/runs",
    DETAIL: (id: string) => `/api/runs/${id}` as const,
  },
  OPTIONS: {
    LIST: "/api/options",
    CREATE: "/api/options",
    BATCH: "/api/options/batch",
    JOB: (jobId: string) => `/api/options/${jobId}` as const,
  },
  RISK: {
    CREATE: "/api/risk",
    JOB: (jobId: string) => `/api/risk/${jobId}` as const,
  },
  FINANCE: {
    CREATE: "/api/finance",
    JOB: (jobId: string) => `/api/finance/${jobId}` as const,
    COMPARISON: (jobId: string) => `/api/finance/${jobId}/comparison` as const,
  },
} as const;
