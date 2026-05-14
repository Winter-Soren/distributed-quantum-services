"use client";

import dynamic from "next/dynamic";
import { DashboardShell } from "@/shared/components/layout/dashboard-shell";
import { ModeToggle } from "@/shared/components/layout/mode-toggle";
import { useWorkspaceMode } from "@/shared/stores/workspace-mode-store";

const HeliaProvider = dynamic(
  () => import("@/features/ipfs").then((m) => m.HeliaProvider),
  { ssr: false },
);

const PinningProvider = dynamic(
  () => import("@/features/vault-pinning").then((m) => m.PinningProvider),
  { ssr: false },
);

const AgentWorkspace = dynamic(
  () => import("@/features/agent").then((m) => m.AgentWorkspace),
  { ssr: false },
);

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mode } = useWorkspaceMode();

  return (
    <HeliaProvider>
      <PinningProvider>
        {/* Top nav with mode toggle */}
        <div className="fixed top-0 left-0 right-0 h-14 border-b border-white/10 bg-background z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Quantum Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>

        {/* Main content area */}
        <div className="pt-14">
          {mode === "manual" ? (
            <DashboardShell>{children}</DashboardShell>
          ) : (
            <AgentWorkspace />
          )}
        </div>
      </PinningProvider>
    </HeliaProvider>
  );
}
