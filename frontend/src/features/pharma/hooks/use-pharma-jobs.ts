"use client";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS, BACKEND } from "@/constants";
import type { PharmaJob } from "../types";

async function fetchPharmaJobs(): Promise<PharmaJob[]> {
  const res = await fetch(BACKEND.PHARMA.LIST);
  if (!res.ok) throw new Error("Failed to load pharma jobs");
  return res.json() as Promise<PharmaJob[]>;
}

export function usePharmaJobs() {
  return useQuery({
    queryKey: QUERY_KEYS.pharma.list(),
    queryFn: fetchPharmaJobs,
    refetchInterval: 10_000,
  });
}
