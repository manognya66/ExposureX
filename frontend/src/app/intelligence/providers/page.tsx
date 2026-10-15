"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Shield,
  FileCode,
  Terminal,
  ExternalLink,
  Info,
  Check,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { ProviderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const loadProviders = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await api.getProviders();
      setProviders(data);
    } catch (err: any) {
      console.warn("Failed to load providers:", err);
      if (!silent) {
        setNotification({
          type: "error",
          message: err.message || "Failed to load intelligence provider status.",
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders(true);
  }, []);

  const handleHealthCheck = async (id: string, name?: string) => {
    setCheckingId(id);
    setNotification(null);
    try {
      const res = await api.checkProviderHealth(id);
      await loadProviders();
      setNotification({
        type: "success",
        message: `Health check for ${name || id}: Status ${res.status || "Healthy"}${
          res.latency_ms !== undefined ? ` • Latency ${res.latency_ms}ms` : ""
        }${res.message ? ` — ${res.message}` : ""}`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Health check failed for ${name || id}: ${err.message || String(err)}`,
      });
    } finally {
      setCheckingId(null);
    }
  };

  // Filter out any HIBP references per user instruction
  const cleanProviders = providers.filter(
    (p) => p.id.toUpperCase() !== "HIBP" && !p.name.toLowerCase().includes("pwned")
  );

  const nvdProvider = cleanProviders.find((p) => p.id === "nvd");
  const isNvdConfigured = Boolean(nvdProvider?.details?.has_api_key);

  const freeApiPlatforms = [
    {
      name: "XposedOrNot",
      category: "Open-Source Community Breach Registry",
      badge: "100% Free / Keyless",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      description:
        "Open-source, community-driven database of hundreds of verified data breaches and paste dumps. Offers keyless REST endpoints for email lookups and free domain-monitoring API keys.",
      envVar: "XPOSEDORNOT_API_KEY",
      signupUrl: "https://xposedornot.com",
      apiDocUrl: "https://api.xposedornot.com/docs",
      rateLimitInfo: "Keyless: 2 req/sec, 100/day • Free Key: High throughput",
    },
    {
      name: "LeakCheck Public API",
      category: "Public Breach Intelligence",
      badge: "Free Public Tier",
      badgeColor: "bg-blue-950/80 text-blue-300 border-blue-800",
      description:
        "Fast breach search engine with billions of compromised records. Provides a free, keyless public endpoint that returns breach names, dates, and exposed data types (passwords, usernames, etc.).",
      envVar: "LEAKCHECK_API_KEY",
      signupUrl: "https://leakcheck.io/api",
      apiDocUrl: "https://leakcheck.io/api",
      rateLimitInfo: "Public: 1 req/sec • Free Developer: 3 req/sec",
    },
    {
      name: "Hudson Rock Cavalier OSINT",
      category: "Infostealer & Cybercrime Telemetry",
      badge: "Free OSINT Tier",
      badgeColor: "bg-orange-950/80 text-orange-300 border-orange-800",
      description:
        "Specialized threat intelligence analyzing live infostealer malware infections (RedLine, Vidar, Raccoon, Lumma). Detects compromised employee devices and stolen browser credentials.",
      envVar: "HUDSON_ROCK_API_KEY",
      signupUrl: "https://www.hudsonrock.com/free-tools",
      apiDocUrl: "https://docs.hudsonrock.com",
      rateLimitInfo: "Free OSINT: Keyless lookups • Developer Key: On-demand",
    },
  ];

  const categories = [
    { title: "Vulnerability Intelligence", key: "Vulnerability Intelligence" },
    { title: "External Asset Discovery", key: "External Asset Discovery" },
    { title: "Credential Intelligence", key: "Credential Intelligence" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] shadow-md shadow-black/50">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Intelligence Provider Adapters</span>
                <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 font-semibold">
                  {cleanProviders.length} Live Adapters
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Zero-cost, real-world intelligence layer for NIST NVD, CISA KEV, Certificate Transparency, and open Credential Breach Registries.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadProviders(false)}
          disabled={isLoading}
          className="text-xs px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/40 disabled:opacity-50 text-zinc-200 transition-colors flex items-center gap-2 font-mono font-medium self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-[#ff6600]", isLoading ? "animate-spin" : "")} />
          <span>Refresh All Adapters</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={cn(
            "p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-3 animate-module-fade",
            notification.type === "success" && "bg-emerald-950/70 border-emerald-800 text-emerald-300",
            notification.type === "error" && "bg-red-950/70 border-red-800 text-red-300",
            notification.type === "info" && "bg-zinc-900 border-zinc-800 text-zinc-300"
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grouped Intelligence Adapters */}
      <div className="space-y-8">
        {categories.map((cat) => {
          const groupProviders = cleanProviders.filter((p) => p.category === cat.key);
          if (groupProviders.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600]"></span>
                  <span className="font-bold text-white">{cat.title}</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-normal">
                  {groupProviders.length} {groupProviders.length === 1 ? "adapter" : "adapters"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupProviders.map((p) => {
                  const isHealthy =
                    p.status === "Healthy" ||
                    p.status === "Active" ||
                    p.status?.includes("Licensed") ||
                    p.status?.includes("Online");
                  const isCredentialProvider = p.category === "Credential Intelligence";

                  return (
                    <div
                      key={p.id}
                      className="card-cyber p-5 flex flex-col justify-between space-y-4 hover:border-[#ff6600]/50 transition-all bg-[#09090b] border border-zinc-800 rounded-xl"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-medium">
                            {p.category}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1",
                              isHealthy
                                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                                : isCredentialProvider
                                ? "bg-zinc-900 text-zinc-300 border border-zinc-800"
                                : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                            )}
                          >
                            {isHealthy ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            ) : isCredentialProvider ? (
                              <Shield className="w-3 h-3 text-zinc-400" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-zinc-500" />
                            )}
                            <span>{p.status}</span>
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white">{p.name}</h3>

                        <div className="mt-3 p-3 rounded-xl bg-black border border-zinc-800/80 text-xs space-y-1.5 font-mono">
                          <div className="text-xs text-zinc-200">
                            <strong className="text-zinc-400 font-normal">Runtime Status: </strong>
                            <span className={isHealthy ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                              {isHealthy ? "Live & Responsive" : p.status}
                            </span>
                          </div>

                          {p.details?.rate_limit_policy && (
                            <div className="text-[11px] text-zinc-300">
                              Tier: <span className="text-white">{p.details.rate_limit_policy}</span>
                            </div>
                          )}

                          {p.details?.message && (
                            <div className="text-[11px] text-zinc-300">
                              Detail: <span className="text-zinc-400">{p.details.message}</span>
                            </div>
                          )}

                          {p.details?.latency_ms !== undefined && (
                            <div className="text-[10px] text-zinc-500">
                              Latency: {p.details.latency_ms} ms
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">ID: {p.id}</span>
                        <button
                          onClick={() => handleHealthCheck(p.id, p.name)}
                          disabled={checkingId === p.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/50 disabled:opacity-50 text-[#ff6600] hover:text-white font-mono flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className={cn("w-3 h-3", checkingId === p.id ? "animate-spin" : "")} />
                          <span>Test Endpoint</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}