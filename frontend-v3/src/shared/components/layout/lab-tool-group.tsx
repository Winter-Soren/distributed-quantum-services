"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import type { NavToolConfig } from "@/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LabToolGroupProps {
  tool: NavToolConfig;
  defaultOpen?: boolean;
}

export function LabToolGroup({ tool, defaultOpen = false }: LabToolGroupProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/collapsible">
      <div className="flex items-center justify-between px-2 py-1.5">
        <CollapsibleTrigger className="flex flex-1 items-center gap-1.5 text-sm font-medium">
          <ChevronRight
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              "group-data-[state=open]/collapsible:rotate-90"
            )}
          />
          {tool.group}
        </CollapsibleTrigger>
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href={tool.newHref} aria-label={tool.newLabel}>
            <Plus className="size-3.5" />
          </Link>
        </Button>
      </div>
      <CollapsibleContent>
        <div className="px-2 pb-2">
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No recent items
          </p>
          <Link
            href={tool.historyHref}
            className="block px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            View all &rarr;
          </Link>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
