"use client";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { FinanceJobDetail } from "../types";

interface FinanceResultSummaryProps {
  job: FinanceJobDetail;
  isLoading?: boolean;
  className?: string;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "processing" || status === "queued") return "secondary";
  return "outline";
}

function ResultField({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
        {value ?? "—"}
      </p>
    </div>
  );
}

export function FinanceResultSummary({
  job,
  isLoading,
  className,
}: FinanceResultSummaryProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Job overview */}
      <Card className="border-hairline bg-surface-soft">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-foreground">
              Job Overview
            </h2>
            <div className="flex gap-2">
              <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
              {job.problemType && (
                <Badge variant="outline">{job.problemType}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ResultField label="Filename" value={job.filename} />
            <ResultField label="Rows" value={job.rowCount} />
            <ResultField label="Columns" value={job.colCount} />
            <ResultField
              label="Created"
              value={new Date(job.createdAt).toLocaleString()}
            />
          </div>
          {job.error && (
            <p className="mt-3 text-sm text-destructive">{job.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Result details — finance result is flexible/opaque from backend */}
      {job.result && (
        <Card className="border-hairline bg-surface-soft">
          <CardHeader className="pb-2">
            <h2 className="text-base font-medium text-foreground">
              Result Details
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(job.result).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="tabular-nums text-foreground">
                    {typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
