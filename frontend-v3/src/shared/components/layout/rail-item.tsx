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
      className="flex flex-col items-center gap-1"
      aria-current={isActive ? "page" : undefined}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon size={18} />
      </span>
      <span
        className={cn(
          "text-[9px] leading-tight",
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
