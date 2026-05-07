"use client";

import {
  Activity, Globe, Wifi, WifiOff, Server,
  CheckCircle2, AlertCircle, Clock, Cpu, Layers, Zap, Network,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useNetworkTopology } from "../hooks/use-network-topology";
import { useNetworkStats } from "../hooks/use-network-stats";
import { useNetworkServices } from "../hooks/use-network-fidelity";
import { Network3dGraph } from "./network-3d-graph";
import type { ServiceNode } from "../types";

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function MeshPageClient() {
  const { data: topology, isLoading: topoLoading } = useNetworkTopology();
  const { data: stats, isLoading: statsLoading } = useNetworkStats();
  const { data: servicesRaw, isLoading: svcLoading } = useNetworkServices();
  const services = (servicesRaw as ServiceNode[] | undefined) ?? [];

  return (
    <div className="flex min-h-full flex-col">
      <PageHeader icon={Globe} label="Network" title="Topology" description="Live network peer topology and connectivity." glow="cyan" />

      <div className="relative flex-1 overflow-y-auto p-6">
        {/* ── Ambient background glows for content area ── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" style={{ height: "350px" }}>
          <div
            className="absolute h-[280px] w-[250px] rounded-full opacity-15 blur-[80px]"
            style={{ left: "0%", top: "-40px", background: "radial-gradient(circle, rgba(34,211,238,0.6) 0%, transparent 70%)" }}
          />
          <div
            className="absolute h-[250px] w-[230px] rounded-full opacity-12 blur-[75px]"
            style={{ right: "10%", top: "-30px", background: "radial-gradient(circle, rgba(52,211,153,0.55) 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          {/* Peer KPI strip */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { key: "active",   label: "Active Peers",   value: topology?.activePeers, icon: Activity, iconClass: "text-emerald-400" },
              { key: "total",    label: "Total Peers",    value: topology?.totalPeers,  icon: Server,   iconClass: "text-indigo-400"  },
              { key: "stale",    label: "Stale Peers",    value: topology?.stalePeers,  icon: WifiOff,  iconClass: "text-white/30"    },
              { key: "services", label: "Total Services", value: stats?.totalServices,  icon: Layers,   iconClass: "text-cyan-400"    },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="relative overflow-hidden rounded-2xl p-5 ring-1 ring-white/8 transition-all duration-200 hover:ring-white/15"
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/6">
                    <Icon className={`h-4 w-4 ${card.iconClass}`} />
                  </div>
                  {(topoLoading || statsLoading) ? (
                    <Skeleton className="h-9 w-20 bg-white/10" />
                  ) : (
                    <p className="text-3xl font-semibold tabular-nums text-white">{card.value ?? 0}</p>
                  )}
                  <p className="mt-1 text-sm text-white/40">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Secondary metrics row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: "types", label: "Service Types",   value: stats?.uniqueServiceTypes, icon: Cpu,     iconClass: "text-sky-400",    fmt: (v: number) => String(v) },
              { key: "fid",   label: "Avg Fidelity",    value: stats?.avgFidelity,        icon: Zap,     iconClass: "text-violet-400", fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
              { key: "spp",   label: "Services / Peer", value: stats?.avgServicesPerPeer,  icon: Network, iconClass: "text-teal-400",   fmt: (v: number) => v.toFixed(1) },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.key}
                  className="flex items-center gap-4 rounded-2xl p-4 ring-1 ring-white/8 transition-all duration-200 hover:ring-white/15"
                  style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/6">
                    <Icon className={`h-4 w-4 ${card.iconClass}`} />
                  </div>
                  <div>
                    {statsLoading ? (
                      <Skeleton className="h-7 w-14 bg-white/10" />
                    ) : (
                      <p className="text-xl font-semibold tabular-nums text-white">
                        {card.value != null ? card.fmt(card.value) : "—"}
                      </p>
                    )}
                    <p className="text-xs text-white/40">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Graph */}
          {topoLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl bg-white/5" />
          ) : (
            <Network3dGraph topology={topology ?? null} />
          )}

          {/* Peer list */}
          {!topoLoading && topology && topology.peers.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Connected Peers</p>
              <div className="flex flex-col gap-1.5">
                {topology.peers.map((peer) => (
                  <div
                    key={peer.peerId}
                    className="flex items-center justify-between rounded-2xl px-5 py-3.5 ring-1 ring-white/8 transition-all duration-200 hover:ring-white/15"
                    style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
                  >
                    <div className="flex items-center gap-3">
                      {peer.isStale
                        ? <WifiOff className="h-4 w-4 shrink-0 text-white/20" />
                        : <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
                      }
                      <span className="font-mono text-xs text-white/60">{peer.peerId.slice(0, 32)}…</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs capitalize text-white/30">{peer.trustTier.replace(/_/g, " ")}</span>
                      <Badge
                        variant="outline"
                        className={
                          peer.healthStatus === "healthy"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                        }
                      >
                        {peer.healthStatus === "healthy"
                          ? <CheckCircle2 className="mr-1 h-3 w-3" />
                          : <AlertCircle className="mr-1 h-3 w-3" />
                        }
                        {peer.healthStatus}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(peer.lastSeenAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Service capabilities */}
          {!svcLoading && services.length > 0 && (
            <ServiceCapabilities services={services} />
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCapabilities({ services }: { services: ServiceNode[] }) {
  const byType = new Map<string, ServiceNode>();
  for (const svc of services) {
    if (!byType.has(svc.serviceType)) byType.set(svc.serviceType, svc);
  }
  const unique = Array.from(byType.values()).sort((a, b) =>
    a.serviceType.localeCompare(b.serviceType)
  );

  return (
    <section className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
        Service Capabilities
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
        {unique.map((svc) => (
          <div
            key={svc.serviceType}
            className="flex flex-col gap-2.5 rounded-2xl p-4 ring-1 ring-white/8 transition-all duration-200 hover:ring-white/15"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize text-white/80">
                {svc.serviceType.replace(/_/g, " ")}
              </span>
              <span className="tabular-nums text-sm font-semibold text-violet-400">
                {(svc.fidelity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/30">
              <span>{svc.qubitMin}–{svc.qubitMax} qubits</span>
              <span className="text-white/10">·</span>
              <span className="capitalize">{svc.connectivity}</span>
            </div>
            {svc.gateSet.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {svc.gateSet.map((g) => (
                  <span
                    key={g}
                    className="rounded-md bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-white/50"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
