"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BREADCRUMB_LABELS, RAIL_LABEL_FOR_PREFIX } from "@/constants";

function getRailLabel(segments: string[]): string | undefined {
  if (segments.length === 0) return undefined;

  for (let len = segments.length; len > 0; len--) {
    const prefix = "/" + segments.slice(0, len).join("/");
    const label = RAIL_LABEL_FOR_PREFIX[prefix];
    if (label) return label;
  }
  return undefined;
}

function formatSegment(segment: string): { label: string; isMono: boolean } {
  const known = BREADCRUMB_LABELS[segment];
  if (known) return { label: known, isMono: false };
  const truncated = segment.length > 8 ? segment.slice(0, 8) + "\u2026" : segment;
  return { label: truncated, isMono: true };
}

export function AutoBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const railLabel = getRailLabel(segments);

  type CrumbEntry = { label: string; href: string; isMono: boolean };
  const crumbs: CrumbEntry[] = [];

  if (railLabel) {
    crumbs.push({ label: railLabel, href: "/" + segments[0], isMono: false });
  }

  for (let i = 0; i < segments.length; i++) {
    const { label, isMono } = formatSegment(segments[i]);
    const href = "/" + segments.slice(0, i + 1).join("/");

    if (crumbs.length > 0 && crumbs[0].href === href) continue;

    crumbs.push({ label, href, isMono });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <BreadcrumbItem key={crumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast ? (
                <BreadcrumbPage className={crumb.isMono ? "font-mono text-xs" : undefined}>
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className={crumb.isMono ? "font-mono text-xs" : undefined}>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
