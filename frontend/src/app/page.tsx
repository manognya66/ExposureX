"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Globe,
  KeyRound,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Radio,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { DashboardMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-300 text-sm font-mono animate-pulse">
        Initializing ExposureX Intelligence Engine...
      </div>
    );
  }

  const overallScore = metrics?.overall_risk_score ?? 0;
  const overallBand = metrics?.overall_risk_band ?? (overallScore === 0 ? "LOW" : "CRITICAL");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#182852]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Executive Exposure &amp; Risk Intelligence</span>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-blue-950 border border-blue-800 text-blue-300">
              LIVE POSTURE
            </span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Continuous correlation of external perimeter assets, credential leaks, and active vulnerabilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/operations/findings"
            className="text-xs px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <span>View All Findings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/risk/internal"
            className="text-xs px-3.5 py-2 rounded-xl bg-[#0d1733] hover:bg-[#182852] text-slate-200 border border-[#182852] transition-colors font-medium"
          >
            Explain Risk Model
          </Link>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Risk Score Card */}
        <Link
          href="/risk/internal"
          className="glass-card p-5 border-t-2 border-t-orange-500 hover:border-orange-400 transition-all relative overflow-hidden group block shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">Overall Risk Score</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold font-mono border",
                overallScore >= 75
                  ? "bg-orange-950/80 text-orange-400 border-orange-500/50 glow-orange-sm"
                  : overallScore >= 50
                  ? "bg-amber-950/80 text-amber-400 border-amber-500/50"
                  : "bg-emerald-950/80 text-emerald-400 border-emerald-500/50"
              )}
            >
              {overallBand}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
              {overallScore}
            </span>
            <span className="text-xs font-mono text-slate-400 font-semibold">/ 100 Risk</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#070d1e] h-2 rounded-full mt-3 overflow-hidden border border-[#182852]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                overallScore >= 75
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : overallScore >= 50
                  ? "bg-gradient-to-r from-blue-500 to-orange-400"
                  : "bg-gradient-to-r from-emerald-500 to-blue-500"
              )}
              style={{ width: `${Math.max(overallScore, 4)}%` }}
            ></div>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>4 Weighted Pillars</span>
            <span className="text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold">
              Explain Breakdown <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </Link>

        {/* Critical & High Findings */}
        <Link
          href="/operations/findings"
          className="glass-card p-5 border-t-2 border-t-orange-500 hover:border-orange-400 transition-all group block shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">Active Findings</span>
            <div className="w-7 h-7 rounded-lg bg-orange-950/60 border border-orange-500/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
            </div>
          </div>

          <div className="flex items-baseline gap-3 my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-mono text-orange-400">
                {metrics?.critical_findings || 0}
              </span>
              <span className="text-[10px] font-mono text-orange-300 uppercase font-bold">Critical</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {metrics?.high_findings || 0}
              </span>
              <span className="text-[10px] font-mono text-amber-300 uppercase font-semibold">High</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#182852] flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-slate-300">{metrics?.moderate_findings || 0} Mod • {metrics?.low_findings || 0} Low</span>
            <span className="text-orange-400 group-hover:translate-x-0.5 font-mono text-xs font-medium">Drill down →</span>
          </div>
        </Link>

        {/* External Assets & Perimeter */}
        <Link
          href="/exposure/assets"
          className="glass-card p-5 border-t-2 border-t-blue-500 hover:border-blue-400 transition-all group block shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">Perimeter Assets</span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-500/40 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold font-mono text-white">
              {metrics?.external_assets || 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">Discovered</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#182852] flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Active Boundaries
            </span>
            <span className="text-blue-300 group-hover:text-blue-200 font-mono text-xs font-medium">Inventory →</span>
          </div>
        </Link>

        {/* Credential Exposures & Incidents */}
        <Link
          href="/exposure/credentials"
          className="glass-card p-5 border-t-2 border-t-emerald-500 hover:border-emerald-400 transition-all group block shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">Credential Events</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {metrics?.credential_events || 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({metrics?.exposed_identities || 0} Identities)
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#182852] flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-blue-300 font-mono text-[10px] font-semibold">Zero Plaintext Stored</span>
            <span className="text-emerald-400 group-hover:translate-x-0.5 font-mono text-xs font-medium">Inspect Leaks →</span>
          </div>
        </Link>
      </div>

      {/* Middle Grid: Risk Trend & Pulse Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Trend Chart */}
        <div className="lg:col-span-2 card-cyber p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-400" />
                <span>Exposure Risk Trend (14 Days)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Composite trend factoring newly discovered perimeter assets and correlated breaches.
              </p>
            </div>
            <div className="text-xs font-mono text-white bg-blue-950/80 border border-blue-800/60 px-2.5 py-0.5 rounded font-bold">
              Current: {overallScore}/100
            </div>
          </div>

          {/* Sparkline / Bar Graph Visualization */}
          <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-[#182852]">
            {metrics?.trend_history?.map((point, idx) => {
              const heightPercent = Math.max(15, (point.score / 100) * 100);
              const isLatest = idx === metrics.trend_history.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#0d1733] border border-blue-700 text-[10px] font-mono px-2 py-0.5 rounded text-white z-10 whitespace-nowrap shadow-lg">
                    {point.date}: {point.score}/100
                  </div>

                  <div
                    className={cn(
                      "w-full rounded-t transition-all group-hover:brightness-125",
                      isLatest
                        ? "bg-gradient-to-t from-orange-600 to-orange-400 shadow-md shadow-orange-500/25"
                        : point.score >= 75
                        ? "bg-orange-500/80"
                        : "bg-blue-500/80"
                    )}
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <span className="text-[9px] font-mono text-slate-400 rotate-45 sm:rotate-0 mt-1">
                    {point.date.split(" ")[1]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Moderate (25-74)
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-orange-500"></span> Critical (75-100)
              </span>
            </div>
            <Link href="/risk/internal" className="text-orange-400 hover:text-orange-300 text-xs flex items-center gap-1 font-semibold">
              View Risk Model Breakdown <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Security Pulse Recent Events */}
        <div className="card-cyber p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Recent Security Pulse</span>
            </h2>
            <Link
              href="/operations/security-pulse"
              className="text-[11px] font-mono text-orange-400 hover:text-orange-300 font-semibold"
            >
              Full Stream →
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {(!metrics?.recent_pulse || metrics.recent_pulse.length === 0) ? (
              <div className="py-8 text-center text-slate-400 font-mono text-xs">
                No Security Pulse events recorded yet.
              </div>
            ) : (
              metrics.recent_pulse.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-[#091126] border border-[#182852] hover:border-blue-600 transition-colors text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded",
                        p.severity === "Critical"
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      )}
                    >
                      {p.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.timestamp}</span>
                  </div>

                  <div className="font-semibold text-white text-xs mt-1">{p.title}</div>
                  <p className="text-slate-300 text-[11px] line-clamp-2 mt-0.5">{p.message}</p>

                  {p.action_url && (
                    <Link
                      href={p.action_url}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-orange-400 hover:text-orange-300 mt-2 font-semibold"
                    >
                      <span>Investigate</span> <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Newly Discovered Assets */}
      <div className="card-cyber p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Newly Discovered External Assets</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Passively mapped through Certificate Transparency and authorized DNS feeds under approved scope boundaries.
            </p>
          </div>
          <Link
            href="/exposure/assets"
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
          >
            <span>Manage All Assets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#182852] text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Asset FQDN / Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Criticality</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">First Seen</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182852]/60">
              {(!metrics?.recent_assets || metrics.recent_assets.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                    No external assets mapped yet. Define approved scope boundaries to begin discovery.
                  </td>
                </tr>
              ) : (
                metrics.recent_assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#0d1733]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-white">
                      {asset.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{asset.asset_type}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "text-[10px] font-mono px-2 py-0.5 rounded font-semibold",
                          asset.business_criticality === "Critical"
                            ? "bg-orange-950/60 text-orange-400 border border-orange-500/30"
                            : asset.business_criticality === "High"
                            ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                            : "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                        )}
                      >
                        {asset.business_criticality}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "font-mono font-bold text-xs",
                          asset.risk_score >= 75
                            ? "text-orange-400"
                            : asset.risk_score >= 50
                            ? "text-amber-400"
                            : "text-emerald-400"
                        )}
                      >
                        {asset.risk_score} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {asset.first_seen}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/exposure/assets`}
                        className="text-orange-400 hover:text-orange-300 text-[11px] font-mono font-semibold inline-flex items-center gap-0.5"
                      >
                        <span>Analyze</span> <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
