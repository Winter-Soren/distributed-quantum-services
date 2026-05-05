"use client";
import { useState } from "react";
import { FidelityChart } from "@/features/network/components/fidelity-chart";
import { useNetworkNodes } from "@/features/network/hooks/use-network-nodes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FidelityPage() {
  const { data: nodes } = useNetworkNodes();
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  const activeNodeId = selectedNodeId || nodes?.[0]?.peerId || "";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Fidelity</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Per-node fidelity metrics and trends.
        </p>
      </div>

      {nodes && nodes.length > 0 && (
        <div className="max-w-sm">
          <Select value={activeNodeId} onValueChange={setSelectedNodeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a node" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.peerId} value={node.peerId}>
                  {node.peerId.slice(0, 28)}…
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeNodeId ? (
        <FidelityChart nodeId={activeNodeId} />
      ) : (
        <p className="text-sm text-muted-foreground">No nodes available.</p>
      )}
    </div>
  );
}
