"use client";

import { SessionSidebar } from "./session-sidebar";
import { ConversationPanel } from "./conversation-panel";
import { ExecutionContext } from "./execution-context";
import { useAgentStore } from "../stores/agent-store";

export function AgentWorkspace() {
  const activeSessionId = useAgentStore((s) => s.activeSessionId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {/* Left: Session History */}
      <SessionSidebar />

      {/* Center: Conversation */}
      <ConversationPanel sessionId={activeSessionId} />

      {/* Right: Execution Context */}
      <ExecutionContext sessionId={activeSessionId} />
    </div>
  );
}
