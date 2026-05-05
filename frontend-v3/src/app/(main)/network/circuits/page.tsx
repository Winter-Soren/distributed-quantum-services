import { Route, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CircuitsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#aa2d00]">
          <Route className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-normal text-foreground">Circuits</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Active circuit routes across the network.
          </p>
        </div>
      </div>

      <Card className="border-hairline bg-surface-soft">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#aa2d00]">
            <Route className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Circuit path viewer</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Visualizes entanglement routing paths between peers.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-hairline bg-white px-3 py-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Milestone 9</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
