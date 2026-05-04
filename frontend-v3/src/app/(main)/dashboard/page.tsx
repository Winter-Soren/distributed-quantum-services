import { Suspense } from "react";
import { DashboardKpiCards } from "@/features/dashboard/components/dashboard-kpi-cards";
import { DashboardHealthStatus } from "@/features/dashboard/components/dashboard-health-status";
import { DashboardActivityFeed } from "@/features/dashboard/components/dashboard-activity-feed";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          System pulse — current network and job status.
        </p>
      </div>

      <DashboardKpiCards />
      <DashboardHealthStatus />

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Quick Actions
        </h2>
        <DashboardQuickActions />
      </section>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <DashboardActivityFeed />
      </Suspense>
    </div>
  );
}
