"use client";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, BACKEND } from "@/constants";
import type { PharmaJob } from "../types";

async function fetchPharmaJob(jobId: string): Promise<PharmaJob> {
  const res = await fetch(BACKEND.PHARMA.JOB(jobId));
  if (!res.ok) throw new Error(`Pharma job ${jobId} not found`);
  return res.json() as Promise<PharmaJob>;
}

export function usePharmaJob(jobId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pharma.job(jobId),
    queryFn: () => fetchPharmaJob(jobId),
    // Poll every 3s while the job is still running/queued
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "queued" || status === "running") return 3000;
      return false;
    },
    enabled: !!jobId,
  });
}
