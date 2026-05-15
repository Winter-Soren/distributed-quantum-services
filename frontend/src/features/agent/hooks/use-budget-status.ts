import { useQuery } from "@tanstack/react-query";
import { AGENT_API, AGENT_QUERY_KEYS } from "@/constants/agent";
import type { BudgetStatus } from "../types";

export function useBudgetStatus() {
  return useQuery({
    queryKey: AGENT_QUERY_KEYS.budget(),
    queryFn: async (): Promise<BudgetStatus> => {
      const res = await fetch(`${AGENT_API.BASE}/budget`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch budget status");
      }
      return res.json();
    },
    refetchInterval: 5000, // Refetch every 5s
  });
}
