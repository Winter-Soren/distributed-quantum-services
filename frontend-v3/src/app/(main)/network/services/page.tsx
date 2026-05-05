import { Layers, Gauge, Cpu } from "lucide-react";
import { ServiceTable } from "@/features/network/components/service-table";

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#aa2d00]">
          <Layers className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-normal text-foreground">Services</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Registered quantum services — type, fidelity, and qubit ranges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-hairline bg-[#aa2d00]/5 px-4 py-3 flex items-center gap-2">
          <Gauge className="h-4 w-4 animate-spin text-[#aa2d00]" style={{ animationDuration: "3s" }} />
          <span className="text-sm text-muted-foreground">Fidelity shown as % of theoretical max</span>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-soft px-4 py-3 flex items-center gap-2">
          <Cpu className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Qubit range: min–max supported per operation</span>
        </div>
      </div>

      <ServiceTable />
    </div>
  );
}
