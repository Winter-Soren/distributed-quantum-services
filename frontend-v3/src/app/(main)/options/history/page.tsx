"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptionsList } from "@/features/options/hooks/use-options-list";
import { OptionsHistoryTable } from "@/features/options/components/options-history-table";

export default function OptionsHistoryPage() {
  const { data, isPending } = useOptionsList();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-normal text-foreground mb-6">
        Options History
      </h1>
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <OptionsHistoryTable jobs={data ?? []} />
      )}
    </div>
  );
}
