"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetworkNodes } from "../hooks/use-network-nodes";
import { getHealthBadgeVariant } from "../lib/network-transformers";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NodeTable() {
  const { data: nodes, isLoading } = useNetworkNodes();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!nodes?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No nodes discovered yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Peer ID</TableHead>
          <TableHead>Health</TableHead>
          <TableHead>Trust Tier</TableHead>
          <TableHead className="text-right">Services</TableHead>
          <TableHead className="text-right">Active Exec.</TableHead>
          <TableHead>Last Seen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((node) => (
          <TableRow key={node.peerId} className={node.isStale ? "opacity-50" : ""}>
            <TableCell className="font-mono text-xs">
              {node.peerId.slice(0, 24)}…
            </TableCell>
            <TableCell>
              <Badge variant={getHealthBadgeVariant(node.healthStatus)}>
                {node.healthStatus}
              </Badge>
            </TableCell>
            <TableCell className="text-sm capitalize">{node.trustTier}</TableCell>
            <TableCell className="text-right tabular-nums">{node.serviceCount}</TableCell>
            <TableCell className="text-right tabular-nums">{node.activeExecutions}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatRelativeTime(node.lastSeenAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
