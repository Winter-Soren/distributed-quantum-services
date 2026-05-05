// Public barrel for the dashboard feature
export { DashboardActivityFeed } from "./components/dashboard-activity-feed";
export { DashboardHealthStatus } from "./components/dashboard-health-status";
export { DashboardKpiCards } from "./components/dashboard-kpi-cards";
export { DashboardQuickActions } from "./components/dashboard-quick-actions";

// Hooks
export { useDashboardStats } from "./hooks/use-dashboard-data";
export { useActivityFeed } from "./hooks/use-activity-feed";

// Types
export type {
  DashboardSummaryCard,
  DashboardServiceRow,
  DashboardNetworkStats,
  DashboardSnapshot,
} from "./types";
