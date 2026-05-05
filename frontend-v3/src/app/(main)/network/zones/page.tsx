import { NodeTable } from "@/features/network/components/node-table";

export default function ZonesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Zones</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Logical zone groupings — peers organized by trust tier.
        </p>
      </div>
      <NodeTable />
    </div>
  );
}
