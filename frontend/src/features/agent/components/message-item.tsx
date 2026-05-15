"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ThinkingBlock } from "./thinking-block";
import type { Message } from "../types";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isAgent = message.role === "agent";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge variant="outline" className="text-xs">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", !isAgent && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback>
          {isAgent ? "🤖" : "👤"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2 max-w-2xl">
        <Card className={cn(
          !isAgent && "bg-indigo-500/10 border-indigo-500/20"
        )}>
          <CardContent className="p-4">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </CardContent>
        </Card>

        {/* Agent Thinking (collapsible) */}
        {message.metadata?.thinking && (
          <ThinkingBlock thinking={message.metadata.thinking} />
        )}

        {/* Actions Taken */}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.metadata.actions.map((action, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                Ran: {action}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
