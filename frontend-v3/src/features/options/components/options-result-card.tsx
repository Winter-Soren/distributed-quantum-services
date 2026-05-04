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
import type { OptionsJobDetail } from "../types";

interface OptionsResultCardProps {
  job: OptionsJobDetail;
  className?: string;
}

function fmt(n: number, decimals = 4) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

export function OptionsResultCard({ job, className }: OptionsResultCardProps) {
  const r = job.result;

  if (!r) {
    return (
      <Card className={cn("border-hairline bg-surface-soft", className)}>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {job.status === "failed"
              ? `Failed: ${job.error ?? "Unknown error"}`
              : "No results available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const greekRows = (["delta", "gamma", "vega", "theta"] as const).map(
    (g) => ({
      greek: g.charAt(0).toUpperCase() + g.slice(1),
      quantum: fmt(r.quantumGreeks[g]),
      classical: fmt(r.classicalGreeks[g]),
    }),
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Price summary */}
      <Card className="border-hairline bg-surface-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">
              Pricing Result
            </h2>
            <div className="flex gap-2">
              <Badge variant="secondary">{job.optionType}</Badge>
              <Badge variant="outline">{r.moneyness}</Badge>
              {r.divergenceWarning && (
                <Badge variant="destructive">Divergence Warning</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Quantum Price</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {fmt(r.quantumPrice, 4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Classical BS</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {fmt(r.classicalBsPrice, 4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price Difference</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                {pct(r.priceDifferencePct / 100)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confidence Interval</p>
              <p className="mt-1 text-sm tabular-nums text-foreground">
                [{fmt(r.confidenceInterval[0], 4)}, {fmt(r.confidenceInterval[1], 4)}]
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Greeks */}
      <Card className="border-hairline bg-surface-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">Greeks</h2>
            <Badge variant="secondary">
              {r.quadraticSpeedupFactor.toFixed(1)}× Quantum Speedup
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Greek</TableHead>
                <TableHead className="text-right">Quantum</TableHead>
                <TableHead className="text-right">Classical BS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {greekRows.map((row) => (
                <TableRow key={row.greek}>
                  <TableCell className="font-medium">{row.greek}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.quantum}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.classical}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Circuit info */}
      <Card className="border-hairline bg-surface-soft">
        <CardHeader className="pb-2">
          <h2 className="text-base font-medium text-foreground">
            Quantum Circuit
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
            <div>
              <p className="text-muted-foreground">Qubits</p>
              <p className="tabular-nums">{r.numQubits}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Circuit Depth</p>
              <p className="tabular-nums">{r.circuitDepth}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Analysis Duration</p>
              <p className="tabular-nums">{r.analysisDurationMs}ms</p>
            </div>
            <div>
              <p className="text-muted-foreground">Moneyness Ratio</p>
              <p className="tabular-nums">{fmt(r.moneynessRatio, 4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
