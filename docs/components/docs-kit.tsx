import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Spotlight({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-spotlight
      className={cn(
        'not-prose relative overflow-hidden rounded-[1.75rem] border border-fd-border/70 bg-fd-card/80 px-5 py-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)] sm:px-7 sm:py-7',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fd-primary/70 to-transparent" />
      <div className="pointer-events-none absolute -right-12 top-0 h-28 w-28 rounded-full bg-fd-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-32 bg-gradient-to-r from-fd-primary/8 to-transparent blur-2xl" />
      {(eyebrow || title) && (
        <div className="mb-4 space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fd-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          {title ? <h2 className="text-2xl font-semibold tracking-tight">{title}</h2> : null}
        </div>
      )}
      <div className="text-sm leading-7 text-fd-muted-foreground sm:text-[15px]">{children}</div>
    </section>
  );
}

export function SignalGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-signal-grid
      className={cn('not-prose grid gap-4 md:grid-cols-2 xl:grid-cols-3', className)}
    >
      {children}
    </div>
  );
}

export function SignalCard({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-signal-card
      className={cn(
        'rounded-[1.4rem] border border-fd-border/65 bg-fd-card/70 px-5 py-5 shadow-[0_18px_48px_-44px_rgba(15,23,42,0.5)]',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-fd-foreground">{title}</h3>
      <div className="mt-3 text-sm leading-7 text-fd-muted-foreground">{children}</div>
    </div>
  );
}

export function Timeline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-timeline className={cn('not-prose relative space-y-4', className)}>
      <div className="absolute bottom-0 left-[0.95rem] top-0 w-px bg-gradient-to-b from-fd-primary/35 via-fd-border to-transparent" />
      {children}
    </div>
  );
}

export function TimelineItem({
  title,
  eyebrow,
  children,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative pl-10">
      <div className="absolute left-0 top-4 flex size-8 items-center justify-center rounded-full border border-fd-primary/30 bg-fd-background text-xs font-semibold text-fd-primary shadow-sm">
        •
      </div>
      <div className="rounded-[1.35rem] border border-fd-border/65 bg-fd-card/72 px-5 py-5">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <div className="mt-3 text-sm leading-7 text-fd-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function DefinitionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('not-prose grid gap-4 md:grid-cols-2', className)}>{children}</div>
  );
}

export function Definition({
  term,
  children,
}: {
  term: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-fd-border/65 bg-fd-card/68 px-5 py-5">
      <dt className="text-sm font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
        {term}
      </dt>
      <dd className="mt-3 text-sm leading-7 text-fd-muted-foreground">{children}</dd>
    </div>
  );
}

export function LayerGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('not-prose grid gap-4 lg:grid-cols-3', className)}>{children}</div>
  );
}

export function LayerCard({
  title,
  eyebrow,
  children,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-fd-border/65 bg-gradient-to-b from-fd-card to-fd-card/70 px-5 py-5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fd-primary/65 to-transparent" />
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <div className="mt-3 text-sm leading-7 text-fd-muted-foreground">{children}</div>
    </div>
  );
}

export function Checklist(props: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      {...props}
      className={cn(
        'not-prose grid gap-3 text-sm leading-6 text-fd-muted-foreground',
        props.className,
      )}
    />
  );
}

export function CheckItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li className={cn('flex gap-3 rounded-2xl border border-fd-border/60 bg-fd-card/65 px-4 py-3', className)}>
      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-fd-primary/15 text-[11px] font-bold text-fd-primary">
        +
      </span>
      <span>{children}</span>
    </li>
  );
}
