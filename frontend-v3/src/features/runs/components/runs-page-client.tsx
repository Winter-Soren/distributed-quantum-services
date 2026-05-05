"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { RunsTable } from "./runs-table";

export function RunsPageClient() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground">
            Quantum Runs
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All quantum circuit execution runs.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={ROUTES.RUNS_NEW}>
            <Plus size={16} />
            New Run
          </Link>
        </Button>
      </div>
      <RunsTable />
    </div>
  );
}
