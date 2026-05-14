import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceModeState {
  mode: "manual" | "agent";
  hasActiveExecution: boolean;
  setMode: (mode: "manual" | "agent") => void;
  setHasActiveExecution: (active: boolean) => void;
}

export const useWorkspaceMode = create<WorkspaceModeState>()(
  persist(
    (set) => ({
      mode: "manual",
      hasActiveExecution: false,
      setMode: (mode) => set({ mode }),
      setHasActiveExecution: (active) => set({ hasActiveExecution: active }),
    }),
    {
      name: "workspace_mode",
    }
  )
);
