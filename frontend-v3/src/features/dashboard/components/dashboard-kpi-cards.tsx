"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "../hooks/use-dashboard-data";

type KpiCardConfig = {
  key: "totalNodes" | "activeServices" | "avgFidelity" | "totalQubits";
  label: string;
  unit: string;
  multiply?: number;
};

const KPI_CARDS: readonly KpiCardConfig[] = [
  { key: "totalNodes", label: "Total Nodes", unit: "" },
  { key: "activeServices", label: "Active Services", unit: "" },
  { key: "avgFidelity", label: "Avg Fidelity", unit: "%", multiply: 100 },
  { key: "totalQubits", label: "Total Qubits", unit: "" },
] as const;

export function DashboardKpiCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {KPI_CARDS.map((card) => {
        const raw = data?.[card.key];
        const displayValue =
          raw != null
            ? card.multiply != null
              ? `${(Number(raw) * card.multiply).toFixed(1)}${card.unit}`
              : `${raw}${card.unit}`
            : "—";

        return (
          <Card key={card.key} className="border-hairline">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-9 w-20" />
              ) : (
                <p className="text-3xl font-normal tabular-nums text-foreground">
                  {displayValue}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
