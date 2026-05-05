import { MapPin, Shield } from "lucide-react";
import { NodeTable } from "@/features/network/components/node-table";

export default function ZonesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#254fad]">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-normal text-foreground">Zones</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Logical zone groupings — peers organized by trust tier.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-hairline bg-[#254fad]/5 px-4 py-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-[#254fad]" />
        <span className="text-sm text-muted-foreground">
          Peers are grouped by <span className="font-medium text-foreground">trust tier</span> — platform_managed nodes form the core zone.
        </span>
      </div>

      <NodeTable />
    </div>
  );
}
