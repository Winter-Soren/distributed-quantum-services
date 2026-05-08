import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/shared/components/layout/page-header";
import { PharmaSubmitForm } from "@/features/pharma/components/pharma-submit-form";

export default function PharmaSubmitPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        icon={FlaskConical}
        label="Pharma"
        title="Submit Pipeline"
        description="Distributed quantum-accelerated protein-ligand docking"
        glow="emerald"
      />
      <div className="max-w-xl">
        <div className="rounded-2xl border border-[var(--hairline)] bg-[var(--surface-soft)] p-6">
          <PharmaSubmitForm />
        </div>
      </div>
    </div>
  );
}
