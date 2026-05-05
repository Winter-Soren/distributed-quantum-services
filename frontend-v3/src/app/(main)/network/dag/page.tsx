import { Card, CardContent } from "@/components/ui/card";

export default function DagPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-normal text-foreground">DAG View</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Network dependency graph across peers and services.
        </p>
      </div>
      <Card className="border-hairline">
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            DAG visualization — Milestone 9 (ReactFlow, dynamic import)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
