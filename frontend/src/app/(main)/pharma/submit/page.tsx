import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PharmaSubmitForm } from "@/features/pharma/components/pharma-submit-form";

export default function PharmaSubmitPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        icon={FlaskConical}
        label="Pharma"
        title="Submit Pipeline"
        description="Distributed quantum-accelerated protein-ligand docking"
        glow="emerald"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-soft)] p-6">
          <PharmaSubmitForm />
        </div>
      </div>
    </div>
  );
}
