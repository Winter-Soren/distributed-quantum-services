"use client";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RiskJobDetail } from "../types";

interface RiskResultDashboardProps {
  job: RiskJobDetail;
  className?: string;
}

function fmt(n: number, d = 4) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "processing" || status === "queued") return "secondary";
  return "outline";
}

export function RiskResultDashboard({
  job,
  className,
}: RiskResultDashboardProps) {
  const r = job.result;

  if (!r) {
    return (
      <Card className={cn("border-hairline bg-surface-soft", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {job.status === "failed"
              ? `Failed: ${job.error ?? "Unknown error"}`
              : "Analysis in progress…"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Primary metrics */}
      <Card className="border-hairline bg-surface-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">
              Risk Metrics
            </h2>
            <div className="flex gap-2">
              <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
              <Badge variant="outline">{job.riskModel}</Badge>
              <Badge variant="secondary">
                {r.quadraticSpeedupFactor.toFixed(1)}× Speedup
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Quantum CVaR 99%</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {fmt(r.quantumCvar99)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Classical CVaR 99%</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {fmt(r.classicalMcCvar99)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected Loss</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {fmt(r.expectedLoss)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Economic Capital</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {r.economicCapital !== null ? fmt(r.economicCapital) : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VaR table */}
      {r.varResults.length > 0 && (
        <Card className="border-hairline bg-surface-soft">
          <CardHeader className="pb-2">
            <h2 className="text-base font-medium text-foreground">
              VaR by Confidence Level
            </h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Quantum VaR</TableHead>
                  <TableHead className="text-right">Classical MC VaR</TableHead>
                  <TableHead className="text-right">Deviation</TableHead>
                  <TableHead className="text-right">Quantum CI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.varResults.map((v) => (
                  <TableRow key={v.confidenceLevel}>
                    <TableCell>
                      {(v.confidenceLevel * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(v.quantumVar)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmt(v.classicalMcVar)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {v.deviationPct.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">
                      [{fmt(v.quantumCi[0], 2)}, {fmt(v.quantumCi[1], 2)}]
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Portfolio + circuit info */}
      <Card className="border-hairline bg-surface-soft">
        <CardHeader className="pb-2">
          <h2 className="text-base font-medium text-foreground">
            Circuit Info
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Portfolio Size</p>
              <p className="tabular-nums">{job.portfolioSize}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Qubits</p>
              <p className="tabular-nums">{r.numQubits}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Circuit Depth</p>
              <p className="tabular-nums">{r.circuitDepth}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="tabular-nums">{r.analysisDurationMs}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
