import { cn } from "@/lib/utils";

interface SectionTitleProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
  accentColor?: string;
}

export function SectionTitle({ icon: Icon, title, badge, accentColor = "amber" }: SectionTitleProps) {
  const iconBg: Record<string, string> = {
    amber: "bg-amber-500/10",
    rose: "bg-rose-500/10",
    emerald: "bg-emerald-500/10",
    violet: "bg-violet-500/10",
    sky: "bg-sky-500/10",
  };
  const iconText: Record<string, string> = {
    amber: "text-amber-400",
    rose: "text-rose-400",
    emerald: "text-emerald-400",
    violet: "text-violet-400",
    sky: "text-sky-400",
  };
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg[accentColor] ?? iconBg.amber)}>
          <Icon className={cn("h-3.5 w-3.5", iconText[accentColor] ?? iconText.amber)} />
        </div>
        <span className="text-sm font-medium text-white/80">{title}</span>
      </div>
      {badge}
    </div>
  );
}
