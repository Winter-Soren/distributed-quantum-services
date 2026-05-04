"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRunDetail } from "@/features/runs/hooks/use-run-detail";
import { RunDetailHeader } from "@/features/runs/components/run-detail-header";
import { RunMetricsPanel } from "@/features/runs/components/run-metrics-panel";
import { FragmentFlowCanvas } from "@/features/runs/components/fragment-flow-canvas";

export default function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "overview";
  const { data: run, isLoading, isError } = useRunDetail(runId);

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Run not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <RunDetailHeader run={run} />
      <Tabs
        value={tab}
        onValueChange={(v) => router.push(`?tab=${v}`)}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quantum-state">Quantum State</TabsTrigger>
          <TabsTrigger value="fragment-flow">Fragment Flow</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <RunMetricsPanel run={run} />
        </TabsContent>
        <TabsContent value="quantum-state" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Bloch sphere visualization — Milestone 9 (Quantum Visualizations)
          </p>
        </TabsContent>
        <TabsContent value="fragment-flow" className="mt-4">
          <FragmentFlowCanvas run={run} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
