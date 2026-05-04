"use client";
import { Card, CardContent } from "@/components/ui/card";
import type { NetworkTopology } from "../types";

interface Network3dGraphProps {
  topology: NetworkTopology | null;
}

/**
 * Placeholder for the 3D force-directed network graph.
 * Full implementation in M9 using react-force-graph-3d (dynamic import, ssr: false).
 */
export function Network3dGraph({ topology }: Network3dGraphProps) {
  const peerCount = topology?.totalPeers ?? 0;
  const activeCount = topology?.activePeers ?? 0;

  return (
    <Card className="border-hairline">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-3xl font-normal tabular-nums text-foreground">{activeCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Active peers</p>
          </div>
          <div className="w-px bg-hairline" />
          <div>
            <p className="text-3xl font-normal tabular-nums text-foreground">{peerCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Total peers</p>
          </div>
          <div className="w-px bg-hairline" />
          <div>
            <p className="text-3xl font-normal tabular-nums text-foreground">
              {topology ? topology.totalPeers - topology.activePeers : 0}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Stale</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          3D force graph — Milestone 9 (react-force-graph-3d, dynamic import)
        </p>
      </CardContent>
    </Card>
  );
}
