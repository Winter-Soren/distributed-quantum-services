"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityFeed, type ActivityItem } from "../hooks/use-activity-feed";

const STATUS_VARIANT: Record<
  ActivityItem["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  completed: "default",
  running: "secondary",
  failed: "destructive",
  pending: "outline",
};

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  run: "Quantum Run",
  options: "Options",
  risk: "Risk",
  finance: "Finance",
};

export function DashboardActivityFeed() {
  const { data, isLoading } = useActivityFeed(5);
  const items: ActivityItem[] = data?.items ?? [];

  return (
    <Card className="border-hairline">
      <CardHeader className="pb-3 pt-5">
        <h2 className="text-sm font-medium text-foreground">Recent Activity</h2>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No recent activity
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[item.type]}
                  </p>
                </div>
                <Badge
                  variant={STATUS_VARIANT[item.status]}
                  className="capitalize"
                >
                  {item.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
