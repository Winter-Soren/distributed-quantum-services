"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "../hooks/use-dashboard-data";
import { getHealthStatus } from "../lib/dashboard-transformers";
import { cn } from "@/lib/utils";

type HealthStatus = "healthy" | "degraded" | "critical";

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: "bg-success/10 text-success border-success/30",
  degraded: "bg-yellow-50 text-yellow-700 border-yellow-200",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
} as const;

export function DashboardHealthStatus() {
  const { data, isLoading } = useDashboardStats();
  const fidelity = data?.avgFidelity ?? 0;
  const status = getHealthStatus(fidelity);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-hairline">
        <CardContent className="pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Network Health
          </p>
          {isLoading ? (
            <div className="mt-2 h-6 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <Badge className={cn("mt-2 border capitalize", STATUS_COLORS[status])}>
              {status}
            </Badge>
          )}
        </CardContent>
      </Card>
      <Card className="border-hairline">
        <CardContent className="pt-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Environment
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {process.env.NODE_ENV === "production" ? "Production" : "Development"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
