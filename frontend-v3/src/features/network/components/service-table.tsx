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
import { useNetworkServices } from "../hooks/use-network-fidelity";
import type { ServiceNode } from "../types";

export function ServiceTable() {
  const { data, isLoading } = useNetworkServices();
  const services = (data as ServiceNode[] | undefined) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!services.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No services registered.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Node ID</TableHead>
          <TableHead>Service Type</TableHead>
          <TableHead className="text-right">Fidelity</TableHead>
          <TableHead>Qubits</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((svc) => (
          <TableRow key={`${svc.nodeId}-${svc.serviceType}`}>
            <TableCell className="font-mono text-xs">
              {svc.nodeId.slice(0, 20)}…
            </TableCell>
            <TableCell className="text-sm">{svc.serviceType}</TableCell>
            <TableCell className="text-right tabular-nums">
              {(svc.fidelity * 100).toFixed(1)}%
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {svc.qubitMin}–{svc.qubitMax}
            </TableCell>
            <TableCell>
              <Badge variant={svc.availability ? "default" : "secondary"}>
                {svc.availability ? "available" : "unavailable"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
