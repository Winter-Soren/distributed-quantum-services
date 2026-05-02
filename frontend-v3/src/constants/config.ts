export const CONFIG = {
  STALE_TIME_MS: 30_000,
  POLL_INTERVAL_MS: 3_000,
  POLL_STOP_STATUSES: [
    "completed",
    "failed",
    "cancelled",
    "error",
  ] as readonly string[],
  PAGE_SIZE: 20,
  MAX_GRAPH_NODES: 500,
  MAX_GRAPH_EDGES: 2000,
} as const;
