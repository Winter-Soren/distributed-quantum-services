"use client";

import { usePathname } from "next/navigation";
import { NAV_CONFIG } from "@/constants";
import { IconRail } from "./icon-rail";
import { SidebarPanel } from "./sidebar-panel";
import { SiteHeader } from "./site-header";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  const activeRailItem =
    NAV_CONFIG.find((item) =>
      item.matchPrefixes.some((prefix) => pathname.startsWith(prefix))
    ) ?? null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      <IconRail />

      <div className="my-2 mr-2 ml-1.5 flex flex-1 overflow-hidden rounded-2xl bg-background shadow-[0_1px_3px_0_rgba(0,0,0,0.06),0_2px_12px_-2px_rgba(0,0,0,0.06)] ring-1 ring-black/3">
        <SidebarPanel activeRailItem={activeRailItem} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <SiteHeader />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
