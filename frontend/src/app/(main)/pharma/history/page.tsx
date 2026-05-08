import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PharmaHistoryTable } from "@/features/pharma/components/pharma-history-table";
import { ROUTES } from "@/constants";

export default function PharmaHistoryPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          icon={FlaskConical}
          label="Pharma"
          title="Job History"
          description="All submitted quantum docking pipelines"
          glow="emerald"
        />
        <Link
          href={ROUTES.PHARMA_SUBMIT}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--hairline)]
                     bg-[var(--canvas)] text-[var(--body)] text-sm hover:bg-[var(--surface-soft)]
                     transition-colors shrink-0"
        >
          + New Pipeline
        </Link>
      </div>
      <PharmaHistoryTable />
    </div>
  );
}
