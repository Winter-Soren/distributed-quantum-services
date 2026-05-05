import { Server, Shield, Zap } from "lucide-react";
import { NodeTable } from "@/features/network/components/node-table";

export default function NodesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#181d26]">
          <Server className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-normal text-foreground">Nodes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All discovered peers — status, trust tier, and execution load.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-hairline bg-surface-soft px-4 py-3 flex items-center gap-2">
          <Zap className="h-4 w-4 animate-pulse text-[#aa2d00]" />
          <span className="text-sm text-muted-foreground">Active executions shown in real-time</span>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-soft px-4 py-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#006400]" />
          <span className="text-sm text-muted-foreground">Trust tier verified by coordinator</span>
        </div>
        <div className="rounded-lg border border-hairline bg-surface-soft px-4 py-3 flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Stale peers shown at 50% opacity</span>
        </div>
      </div>

      <NodeTable />
    </div>
  );
}
