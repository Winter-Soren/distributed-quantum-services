"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS, API } from "@/constants";
import type { MyNode, MyNodesResponse, RegisterNodeRequest } from "../types";

export function useMyNodes() {
  return useQuery({
    queryKey: QUERY_KEYS.network.myNodes(),
    queryFn: async () => {
      const res = await fetch(API.NETWORK.NODES_MINE);
      if (!res.ok) throw new Error("Failed to fetch my nodes");
      const data = (await res.json()) as MyNodesResponse;
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useRegisterNode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterNodeRequest) => {
      const res = await fetch(API.NETWORK.NODES_MINE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(err.detail ?? "Failed to register node");
      }
      return res.json() as Promise<MyNode>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.network.myNodes() });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.network.nodes() });
    },
  });
}
