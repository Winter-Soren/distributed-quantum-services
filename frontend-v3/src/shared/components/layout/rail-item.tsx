"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RailItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
}

export function RailItem({ icon: Icon, label, href, isActive }: RailItemProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-0.5"
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150",
          isActive
            ? "bg-background text-foreground shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_1px_8px_-1px_rgba(0,0,0,0.06)] ring-1 ring-black/4"
            : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
        )}
      >
        <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
      </span>
      <span
        className={cn(
          "text-[9px] leading-tight transition-colors",
          isActive
            ? "font-semibold text-foreground"
            : "font-medium text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  );
}
