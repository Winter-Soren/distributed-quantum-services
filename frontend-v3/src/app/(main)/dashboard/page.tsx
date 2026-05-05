import { Suspense } from "react";
import { DashboardKpiCards } from "@/features/dashboard/components/dashboard-kpi-cards";
import { DashboardQuickActions } from "@/features/dashboard/components/dashboard-quick-actions";
import { DashboardActivityFeed } from "@/features/dashboard/components/dashboard-activity-feed";
import { DashboardStatusBar } from "@/features/dashboard/components/dashboard-status-bar";

export default function DashboardPage() {
  return (
    <div className="relative flex flex-col gap-6 p-6">

      {/* ── Ambient background glows ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-32 -top-24 h-[500px] w-[500px] rounded-full opacity-25 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-24 top-0 h-[400px] w-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.5) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 left-8 h-[300px] w-[400px] rounded-full opacity-15 blur-[100px]"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.5) 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col gap-6">

        {/* Page header — title left, status pills right */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
            <p className="mt-0.5 text-sm text-white/40">System pulse — current network and job status.</p>
          </div>
          <DashboardStatusBar />
        </div>

        {/* KPI strip */}
        <DashboardKpiCards />

        {/* Quick actions */}
        <section className="flex flex-col gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Quick Actions</p>
          <DashboardQuickActions />
        </section>

        {/* Activity */}
        <Suspense fallback={
          <div className="h-40 animate-pulse rounded-2xl ring-1 ring-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }} />
        }>
          <DashboardActivityFeed />
        </Suspense>

      </div>
    </div>
  );
}
