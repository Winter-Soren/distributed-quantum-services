import Link from "next/link";
import { FlaskConical, TrendingUp, BarChart3, Globe } from "lucide-react";
import { ROUTES } from "@/constants";
import type { LucideIcon } from "lucide-react";

type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const ACTIONS: readonly QuickAction[] = [
  {
    label: "New Run",
    href: ROUTES.RUNS_NEW,
    icon: FlaskConical,
    description: "Execute a quantum circuit",
  },
  {
    label: "Price Options",
    href: ROUTES.OPTIONS,
    icon: TrendingUp,
    description: "Quantum Monte Carlo pricing",
  },
  {
    label: "Risk Analysis",
    href: ROUTES.RISK,
    icon: BarChart3,
    description: "VaR / CVaR on portfolio",
  },
  {
    label: "Network",
    href: ROUTES.NETWORK_MESH,
    icon: Globe,
    description: "View network topology",
  },
] as const;

export function DashboardQuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ACTIONS.map((action) => (
        <Link key={action.href} href={action.href}>
          <div className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-hairline bg-background p-4 transition-colors hover:border-border-strong hover:bg-surface-soft">
            <action.icon size={20} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
