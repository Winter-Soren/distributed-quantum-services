"use client";

import type { RailItem } from "@/constants";
import { SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { StaticSidebar } from "./static-sidebar";
import { DynamicSidebar } from "./dynamic-sidebar";

interface SidebarPanelProps {
  activeRailItem: RailItem | null;
}

export function SidebarPanel({ activeRailItem }: SidebarPanelProps) {
  if (!activeRailItem || !activeRailItem.hasSidebar || !activeRailItem.sidebar) {
    return null;
  }

  const { sidebar } = activeRailItem;

  return (
    <SidebarProvider defaultOpen>
      <aside className="flex w-[220px] flex-col border-r border-hairline">
        <SidebarContent>
          {sidebar.type === "static" ? (
            <StaticSidebar groups={sidebar.groups} />
          ) : (
            <DynamicSidebar tools={sidebar.tools} />
          )}
        </SidebarContent>
      </aside>
    </SidebarProvider>
  );
}
