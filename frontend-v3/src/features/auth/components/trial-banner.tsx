"use client";

import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getTrialDaysLeft } from "@/features/auth/types";
import { UI } from "@/constants";

export function TrialBanner() {
  const { user } = useAuth();

  if (!user) return null;

  const profile = user as typeof user & {
    hasSubscription?: boolean;
    trialEndsAt?: string;
  };

  if (profile.hasSubscription) return null;

  const daysLeft = getTrialDaysLeft(profile.trialEndsAt);
  const isExpiring = daysLeft <= 3 && daysLeft > 0;
  const hasExpired = daysLeft <= 0;

  if (hasExpired) {
    return (
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-destructive" />
            <p className="text-sm text-foreground">{UI.TRIAL.expired}</p>
          </div>
          <Button asChild size="sm">
            <Link href="/subscription">{UI.TRIAL.SUBSCRIBE_CTA}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isExpiring) {
    return (
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Clock className="text-signature-mustard" />
            <p className="text-sm text-foreground">
              {UI.TRIAL.expiring(daysLeft)}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/subscription">{UI.TRIAL.VIEW_PLANS_CTA}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{UI.TRIAL.BADGE_LABEL}</Badge>
          <p className="text-sm text-muted-foreground">
            {UI.TRIAL.remaining(daysLeft)}
          </p>
        </div>
      </div>
    </div>
  );
}
