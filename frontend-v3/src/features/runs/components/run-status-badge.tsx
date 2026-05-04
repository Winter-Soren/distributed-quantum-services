import { Badge } from "@/components/ui/badge";
import { RUN_STATUS_LABELS, RUN_STATUS_VARIANT } from "../lib/run-status";

export function RunStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={RUN_STATUS_VARIANT[status] ?? "outline"}>
      {RUN_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
