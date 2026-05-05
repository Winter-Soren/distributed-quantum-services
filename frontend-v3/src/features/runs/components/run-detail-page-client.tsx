"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useRunDetail } from "../hooks/use-run-detail";
import { RunDetailHeader } from "./run-detail-header";
import { RunMetricsPanel } from "./run-metrics-panel";
import { FragmentFlowCanvas } from "./fragment-flow-canvas";
import type { QubitState } from "@/features/quantum/types";

const BlochSphere = dynamic(
  () =>
    import("@/features/quantum/components/bloch-sphere").then(
      (m) => m.BlochSphere,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-48 rounded-full" />,
  },
);

function blochVectorFromRaw(
  raw: Record<string, number> | undefined,
  index: number,
): QubitState | undefined {
  if (!raw) return undefined;
  const x = raw["x"] ?? 0;
  const y = raw["y"] ?? 0;
  const z = raw["z"] ?? 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, z)));
  const phi = Math.atan2(y, x);
  const probZero = (1 + z) / 2;
  return {
    qubitIndex: index,
    blochVector: { theta, phi, x, y, z },
    probabilities: {
      zero: Math.max(0, Math.min(1, probZero)),
      one: Math.max(0, Math.min(1, 1 - probZero)),
    },
  };
}

export function RunDetailPageClient() {
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

  const blochVectors = run.result?.quantumResult?.blochVectors ?? {};

  return (
    <div className="flex flex-col gap-6 p-6">
      <RunDetailHeader run={run} />
      <Tabs value={tab} onValueChange={(v) => router.push(`?tab=${v}`)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quantum-state">Quantum State</TabsTrigger>
          <TabsTrigger value="fragment-flow">Fragment Flow</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <RunMetricsPanel run={run} />
        </TabsContent>
        <TabsContent value="quantum-state" className="mt-4">
          {Object.keys(blochVectors).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Bloch vector data available for this run.
            </p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {Object.entries(blochVectors).map(([key, raw], idx) => {
                const qubitState = blochVectorFromRaw(
                  raw as Record<string, number>,
                  idx,
                );
                return (
                  <BlochSphere
                    key={key}
                    qubitState={qubitState}
                    className="w-56"
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="fragment-flow" className="mt-4">
          <FragmentFlowCanvas run={run} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
