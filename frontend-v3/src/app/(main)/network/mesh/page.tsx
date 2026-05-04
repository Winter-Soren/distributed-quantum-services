"use client";
import { Network3dGraph } from "@/features/network/components/network-3d-graph";
import { useNetworkTopology } from "@/features/network/hooks/use-network-topology";

export default function MeshPage() {
  const { data: topology, isLoading } = useNetworkTopology();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Topology</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Live network peer topology and connectivity.
        </p>
      </div>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <Network3dGraph topology={topology ?? null} />
      )}
    </div>
  );
}
