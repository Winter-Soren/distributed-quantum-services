import { Card, CardContent } from "@/components/ui/card";

export default function CircuitsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">Circuits</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Active circuit routes across the network.
        </p>
      </div>
      <Card className="border-hairline">
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Circuit path viewer — Milestone 9
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
