import Link from 'next/link';
import {
  ArrowRight,
  Binary,
  BookOpen,
  Database,
  FlaskConical,
  GitBranch,
  Network,
  Orbit,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

const tracks: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Get started quickly',
    description: 'Bring up the coordinator, embedded service nodes, and the dashboard with the least friction.',
    href: '/docs/getting-started/quickstart',
    icon: Orbit,
  },
  {
    title: 'Understand the system',
    description: 'See how planning, reservations, runtime fallback, persistence, and Qiskit analysis fit together.',
    href: '/docs/core-concepts/architecture',
    icon: Network,
  },
  {
    title: 'Work like a researcher',
    description: 'Use the docs as a grounded guide to current capabilities, known limits, and the experimental surface.',
    href: '/docs/research/research-notes',
    icon: FlaskConical,
  },
  {
    title: 'Contribute safely',
    description: 'Find the right module, run the right checks, and extend the project without guessing.',
    href: '/docs/contributing/contributor-guide',
    icon: GitBranch,
  },
];

const highlights = [
  'FastAPI job API with WebSocket status updates',
  'Real py-libp2p transport for discovery and remote invocation',
  'Deterministic cost-based planning with fallback candidates',
  'SQLite-backed job, registry, and runtime state',
  'Qiskit-generated counts, statevectors, Bloch vectors, and fidelity summaries',
  'A React dashboard for jobs, plans, service health, and analysis',
];

const pillars: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Topology-aware planning',
    description:
      'The coordinator compiles circuits against a live service registry instead of pretending the network does not exist.',
    icon: Network,
  },
  {
    title: 'Durable execution trail',
    description:
      'Jobs, reservations, runtime events, and registry snapshots persist to SQLite so runs stay inspectable.',
    icon: Database,
  },
  {
    title: 'Explainable analysis',
    description:
      'Qiskit-backed result payloads expose counts, state summaries, Bloch vectors, entropy, and fidelity information.',
    icon: Binary,
  },
];

const docRoutes = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started/quickstart',
    description: 'Quickstart, runbook, dashboard guidance, and troubleshooting.',
  },
  {
    title: 'Core Concepts',
    href: '/docs/core-concepts/architecture',
    description: 'Architecture, registry behavior, runtime flow, persistence, and analysis.',
  },
  {
    title: 'Reference',
    href: '/docs/reference/api-reference',
    description: 'API contracts, language surface, config knobs, and protocol messages.',
  },
  {
    title: 'Research and Contributing',
    href: '/docs/research/research-notes',
    description: 'Roadmap context, limitations, testing practice, and docs authoring workflow.',
  },
];

export default function HomePage() {
  return (
    <main data-home-shell className="relative flex flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),linear-gradient(to_right,transparent_0,transparent_calc(100%-1px),rgba(255,255,255,0.04)_100%),linear-gradient(to_bottom,transparent_0,transparent_calc(100%-1px),rgba(255,255,255,0.04)_100%)] bg-[size:auto,72px_72px,72px_72px] opacity-20" />
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-6 py-12 sm:px-10 lg:px-12 lg:py-18">
        <section className="relative overflow-hidden rounded-[2rem] border border-fd-border/80 bg-fd-card/80 px-6 py-10 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:px-10 lg:px-12 lg:py-14">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fd-primary/70 to-transparent" />
          <div className="grid gap-10 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-fd-border/70 bg-fd-background/70 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-fd-muted-foreground">
                <span className="size-2 rounded-full bg-fd-primary" />
                Research Documentation
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Distributed quantum orchestration, documented for builders and researchers.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-fd-muted-foreground sm:text-lg">
                  This site covers the real system in this repository: a FastAPI coordinator that
                  discovers quantum services over py-libp2p, plans distributed execution, persists
                  runtime state to SQLite, and reconstructs rich quantum results with Qiskit.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-3 text-sm font-medium text-fd-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  Open the docs
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/docs/reference/api-reference"
                  className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-background/70 px-5 py-3 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
                >
                  API reference
                  <BookOpen className="size-4" />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-fd-border/70 bg-fd-background/75 p-5">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
                  What you can do here
                </p>
                <p className="text-lg font-medium tracking-tight">From first run to architecture review</p>
              </div>
              <div className="grid gap-2">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-fd-border/60 bg-fd-card/70 px-4 py-3 text-sm text-fd-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tracks.map((track) => {
            const Icon = track.icon;

            return (
              <Link
                key={track.href}
                href={track.href}
                className="group rounded-[1.5rem] border border-fd-border/70 bg-fd-card/70 p-5 transition-all hover:-translate-y-1 hover:border-fd-primary/60 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-2xl border border-fd-border/70 bg-fd-background/80 p-3 text-fd-primary">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-xl font-medium tracking-tight">{track.title}</h2>
                <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
                  {track.description}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-fd-primary">
                  Explore
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.8rem] border border-fd-border/70 bg-fd-card/78 p-6 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.45)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fd-muted-foreground">
              Why this documentation is different
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for people who want substance, not just setup steps.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-fd-muted-foreground sm:text-base">
              The handbook is written to help three kinds of readers at once: operators who need
              concrete commands, researchers who need honest scoping, and contributors who need a
              map of the real implementation boundaries.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;

                return (
                  <div
                    key={pillar.title}
                    className="rounded-[1.4rem] border border-fd-border/65 bg-fd-background/72 p-5"
                  >
                    <div className="inline-flex rounded-2xl border border-fd-border/70 bg-fd-card/80 p-3 text-fd-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.8rem] border border-fd-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(15,23,42,0.94))] p-6 text-white shadow-[0_24px_80px_-50px_rgba(15,23,42,0.7)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
              Project Signals
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Research-grade coordination with a practical local workflow.
            </h2>
            <div className="mt-8 space-y-3">
              {[
                'Network-visible services instead of hardcoded local operations',
                'Job lifecycle, reservation state, and runtime event persistence',
                'Planner output you can inspect fragment by fragment',
                'Frontend workspace for topology, DAGs, and quantum analysis',
              ].map((item) => (
                <div
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-white/80"
                >
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.9rem] border border-fd-border/70 bg-fd-card/76 p-6 shadow-[0_22px_70px_-52px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fd-muted-foreground">
                Documentation Map
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Read it by intent, not by accident.
              </h2>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-sm font-medium text-fd-primary"
            >
              Enter the handbook
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {docRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-[1.45rem] border border-fd-border/65 bg-fd-background/72 px-5 py-5 transition-all hover:-translate-y-0.5 hover:border-fd-primary/60"
              >
                <h3 className="text-xl font-semibold tracking-tight">{route.title}</h3>
                <p className="mt-3 text-sm leading-6 text-fd-muted-foreground">
                  {route.description}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-fd-primary">
                  Open section
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
