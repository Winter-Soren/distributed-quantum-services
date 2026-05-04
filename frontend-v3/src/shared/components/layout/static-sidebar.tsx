"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroupConfig } from "@/constants";
import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavUser } from "./nav-user";

interface StaticSidebarProps {
  groups: NavGroupConfig[];
}

export function StaticSidebar({ groups }: StaticSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.heading}>
          <SidebarGroupLabel>{group.heading}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <SidebarMenuItem key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex h-8 items-center rounded-md px-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
      <div className="mt-auto border-t border-hairline p-3">
        <NavUser />
      </div>
    </>
  );
}
