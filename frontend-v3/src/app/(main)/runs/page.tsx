import { RunsTable } from "@/features/runs/components/runs-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ROUTES } from "@/constants";

export default function RunsPage() {
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
