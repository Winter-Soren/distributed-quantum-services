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
    <div className="flex h-screen overflow-hidden">
      <IconRail />
      <SidebarPanel activeRailItem={activeRailItem} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <SiteHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
