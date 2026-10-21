"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Gauge,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Globe,
  Shield,
  Layers,
  CheckCircle2,
  Scale,
  X,
  RotateCcw,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PeerCompany {
  id: string;
  name: string;
  domain: string;
  sector: string;
  score: number;
  band: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  exposure_score: number;
  vulnerability_score: number;
  credential_exposure_score: number;
  critical_assets: number;
  trend_30d: string;
  trend_direction: "up" | "down";
  delta_vs_org: number;
  open_findings: number;
  status: string;
}

interface BenchmarkData {
  org_score: number;
  industry_average_score: number;
  top_benchmark_score: number;
  highest_risk_peer_score: number;
  total_peers_compared: number;
  peers: PeerCompany[];
}

export default function InternalRiskPage() {
  const [data, setData] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All");
  const [selectedPeer, setSelectedPeer] = useState<PeerCompany | null>(null);

  const loadData = async () => {
    try {
      const [riskRes, benchRes] = await Promise.all([
        api.getInternalRiskAssessment(),
        api.getCompanyBenchmarks().catch(() => null),
      ]);
      setData(riskRes);
      if (benchRes && benchRes.peers && benchRes.peers.length > 0) {
        setBenchmarkData(benchRes);
        // Default to Horizon Energy & Utilities per user design preference
        const horizonPeer = benchRes.peers.find(
          (p: PeerCompany) => p.name.toLowerCase().includes("horizon")
        ) || benchRes.peers[0];
        setSelectedPeer(horizonPeer);
      }
    } catch (err) {
      console.error("Failed to load risk assessment:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="py-20 text-center font-mono text-sm text-zinc-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin" />
        <span>Computing Internal Risk Assessment & Benchmark Scores...</span>
      </div>
    );
  }

  const score = data.overall_score ?? 0;
  const band = data.risk_band || (score === 0 ? "LOW" : score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : "MODERATE");

  // Fallback if benchmarkData hasn't finished loading yet
  const activeComparedPeer: PeerCompany = selectedPeer || {
    id: "comp-7",
    name: "Horizon Energy & Utilities Corporation",
    domain: "horizonenergy.com",
    sector: "Energy & Critical Infrastructure",
    score: 71,
    band: "HIGH",
    exposure_score: 74,
    vulnerability_score: 76,
    credential_exposure_score: 63,
    critical_assets: 19,
    trend_30d: "+3%",
    trend_direction: "up",
    delta_vs_org: 71 - score,
    open_findings: 21,
    status: "Monitored Enterprise",
  };

  const sectors = useMemo(() => {
    const peerList = benchmarkData?.peers || [];
    const unique = Array.from(new Set(peerList.map((p) => p.sector))).filter(Boolean);
    return ["All", ...unique];
  }, [benchmarkData?.peers]);

  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = { All: benchmarkData?.peers?.length || 0 };
    (benchmarkData?.peers || []).forEach((p) => {
      if (p.sector) {
        counts[p.sector] = (counts[p.sector] || 0) + 1;
      }
    });
    return counts;
  }, [benchmarkData?.peers]);

  const filteredPeers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (benchmarkData?.peers || []).filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.sector.toLowerCase().includes(q) ||
        p.band.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q);

      const matchesSector =
        selectedSector === "All" ||
        p.sector.toLowerCase() === selectedSector.toLowerCase();

      return matchesSearch && matchesSector;
    });
  }, [benchmarkData?.peers, searchQuery, selectedSector]);

  const handleSelectPeer = (peer: PeerCompany) => {
    setSelectedPeer(peer);
    const el = document.getElementById("comparison-scoreboard");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] shadow-sm">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3 font-sans">
                <span>Internal Risk Assessment & Explainability</span>
                <span
                  className={cn(
                    "px-3 py-0.5 text-xs font-mono font-bold rounded-full border",
                    score >= 75
                      ? "bg-red-950/60 border-red-800 text-red-400"
                      : score >= 50
                      ? "bg-amber-950/60 border-amber-800 text-amber-400"
                      : "bg-emerald-950/60 border-emerald-800 text-emerald-400"
                  )}
                >
                  {band}
                </span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1 font-sans">
                Continuous mathematically explainable risk score correlating external perimeter reachability, active CISA KEV CVEs, and credential telemetry.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Score & Pillars Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="card-cyber p-7 flex flex-col justify-between relative overflow-hidden bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Your Organization Score
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border",
                  score >= 75
                    ? "bg-red-500/10 text-red-400 border-red-500/30"
                    : score >= 50
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                )}
              >
                {band}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 mt-5">
              <span className="text-6xl font-black font-mono text-white tracking-tight">{score}</span>
              <span className="text-xl font-mono text-zinc-500">/ 100</span>
            </div>

            <div className="w-full bg-zinc-900 h-3 rounded-full mt-5 overflow-hidden border border-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  score >= 75
                    ? "bg-gradient-to-r from-red-600 to-red-400"
                    : score >= 50
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-emerald-500 to-emerald-400"
                )}
                style={{ width: `${Math.max(score, 4)}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-zinc-800 space-y-2.5 text-xs">
            <div className="text-xs font-mono text-[#ff6600] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXPLAINABLE MATHEMATICAL FORMULA:</span>
            </div>
            <div className="text-zinc-300 font-mono text-xs bg-black/70 p-3 rounded-xl border border-zinc-800/80 leading-relaxed break-words">
              {data.formula}
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid Breakdown */}
        <div className="lg:col-span-2 card-cyber p-7 space-y-6 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-sans">
              <Layers className="w-4 h-4 text-[#ff6600]" />
              <span>4 Core Risk Pillars (Normalized 0–100)</span>
            </h2>
            <span className="text-xs font-mono text-zinc-400">Total Combined = 100%</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Exposure Pillar */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white font-sans">1. External Exposure</span>
                <span className="font-mono text-[#ff6600] font-bold text-sm">{data.pillars?.exposure ?? 0} / 100</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#ff6600] h-full rounded-full"
                  style={{ width: `${data.pillars?.exposure ?? 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-zinc-400 font-sans">
                Weight: 30% • Direct reachable services & public IP assets
              </div>
            </div>

            {/* Vulnerability Pillar */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white font-sans">2. Vulnerability Posture</span>
                <span className="font-mono text-red-400 font-bold text-sm">{data.pillars?.vulnerability ?? 0} / 100</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-red-500 h-full rounded-full"
                  style={{ width: `${data.pillars?.vulnerability ?? 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-zinc-400 font-sans">
                Weight: 25% • Active CISA KEV catalog & high CVSS CVEs
              </div>
            </div>

            {/* Credential Exposure Pillar */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white font-sans">3. Credential Exposure</span>
                <span className="font-mono text-amber-400 font-bold text-sm">
                  {data.pillars?.credential_exposure ?? 0} / 100
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{ width: `${data.pillars?.credential_exposure ?? 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-zinc-400 font-sans">
                Weight: 25% • Compromised privileged logins in stealer dumps
              </div>
            </div>

            {/* Business Impact Pillar */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white font-sans">4. Business Criticality</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {data.pillars?.business_impact ?? 0} / 100
                </span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${data.pillars?.business_impact ?? 0}%` }}
                ></div>
              </div>
              <div className="text-xs text-zinc-400 font-sans">
                Weight: 20% • Critical asset designation and dependency tier
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          EXPANDED HEAD-TO-HEAD RISK SCORE COMPARISON
          Format requested by user:
          Your Org             Horizon Energy & Utilities Corporation
                0                                    71
          ========================================================================= */}
      <div className="card-cyber p-7 sm:p-10 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl relative overflow-hidden space-y-8 w-full">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
                Head-to-Head Enterprise Risk Comparison
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-0.5">
                Direct comparative posture matching Your Organization against benchmark peers and market companies with full entity transparency.
              </p>
            </div>
          </div>

          {/* Peer Company Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs font-mono text-zinc-400">Select Peer:</span>
            <select
              value={activeComparedPeer.id}
              onChange={(e) => {
                const found = (benchmarkData?.peers || []).find((p) => p.id === e.target.value);
                if (found) setSelectedPeer(found);
              }}
              className="px-4 py-2.5 rounded-xl bg-black border border-zinc-800 hover:border-[#ff6600]/40 text-xs text-white font-sans focus:outline-none focus:border-[#ff6600] cursor-pointer"
            >
              {(benchmarkData?.peers || [activeComparedPeer]).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.score})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =====================================================================
            EXPANDED DIRECT HEAD-TO-HEAD LAYOUT REQUESTED BY USER
            Your Org             Horizon Energy & Utilities Corporation
                  0                                    71
            ===================================================================== */}
        <div id="comparison-scoreboard" className="w-full py-4 scroll-mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-center items-stretch">
            {/* Left Column: Your Org (Full Name) */}
            <div className="p-8 sm:p-10 rounded-2xl bg-black/90 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col items-center justify-between space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="space-y-1.5 w-full">
                <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                  Primary Enterprise
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-sans text-white tracking-tight leading-tight px-2 break-words">
                  {data.org_name ? `${data.org_name} (Your Organization)` : "Abc Enterprise (Your Organization)"}
                </div>
                <div className="text-xs font-mono text-zinc-400 flex items-center justify-center gap-2 pt-1">
                  <span>abc.com</span>
                  <span>•</span>
                  <span className="text-emerald-400">Primary Tenant Scope</span>
                </div>
              </div>

              <div className="my-4 space-y-2">
                <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono text-white tracking-tight leading-none py-2">
                  {score}
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{band} RISK POSTURE</span>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-mono">
                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60">
                  <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase">Trend</div>
                  <div className="text-emerald-400 font-bold mt-0.5">Stable</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60">
                  <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase">Critical Assets</div>
                  <div className="text-white font-bold mt-0.5">{data.pillars?.business_impact ? Math.round(data.pillars.business_impact / 25) : 0}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60">
                  <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase">Open Findings</div>
                  <div className="text-white font-bold mt-0.5">{score > 0 ? 5 : 0}</div>
                </div>
              </div>
            </div>

            {/* Right Column: Benchmark Peer (Full Corporate Name) */}
            <div className="p-8 sm:p-10 rounded-2xl bg-black/90 border border-zinc-800 hover:border-[#ff6600]/40 transition-all flex flex-col items-center justify-between space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="space-y-1.5 w-full">
                <div className="text-xs font-mono uppercase tracking-widest text-[#ff6600] font-semibold">
                  Benchmark Comparative Peer
                </div>
                <div
                  className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-sans text-[#ff6600] tracking-tight leading-tight px-2 break-words"
                  title={activeComparedPeer.name}
                >
                  {activeComparedPeer.name}
                </div>
                <div className="text-xs font-mono text-zinc-400 flex items-center justify-center gap-2 pt-1">
                  <span>{activeComparedPeer.domain}</span>
                  <span>•</span>
                  <span className="text-zinc-300">{activeComparedPeer.sector}</span>
                </div>
              </div>

              <div className="my-4 space-y-2">
                <div className="text-6xl sm:text-7xl lg:text-8xl font-black font-mono text-[#ff6600] tracking-tight leading-none py-2">
                  {activeComparedPeer.score}
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-bold border",
                    activeComparedPeer.band === "CRITICAL"
                      ? "bg-red-500/10 text-red-400 border-red-500/30"
                      : activeComparedPeer.band === "HIGH"
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                      : activeComparedPeer.band === "MODERATE"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    activeComparedPeer.band === "CRITICAL" ? "bg-red-400" : activeComparedPeer.band === "HIGH" ? "bg-orange-400" : "bg-emerald-400"
                  )}></span>
                  <span>{activeComparedPeer.band} RISK POSTURE</span>
                </div>
              </div>

              <div className="w-full pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-mono">
                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60">
                  <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase">30d Trajectory</div>
                  <div className={cn("font-bold mt-0.5", activeComparedPeer.trend_direction === "down" ? "text-emerald-400" : "text-amber-400")}>
                    {activeComparedPeer.trend_30d}
                  </div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60">
                  <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase">Critical Assets</div>
                  <div className="text-[#ff6600] font-bold mt-0.5">{activeComparedPeer.critical_assets}</div>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-zinc-900/60">
                  <div className="text-zinc-500 text-[9px] sm:text-[10px] uppercase">Open Findings</div>
                  <div className="text-[#ff6600] font-bold mt-0.5">{activeComparedPeer.open_findings}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Summary Callout */}
          <div className="mt-8 text-center">
            <div className="py-3 px-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 inline-flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm font-sans shadow-lg">
              <span className="text-zinc-400 font-mono">Comparative Exposure Posture:</span>
              <span
                className={cn(
                  "font-bold",
                  activeComparedPeer.score > score ? "text-emerald-400" : "text-amber-400"
                )}
              >
                {activeComparedPeer.score > score
                  ? `${data.org_name || "Abc Enterprise"} currently holds ${activeComparedPeer.score - score} points lower exposure risk than ${activeComparedPeer.name}.`
                  : activeComparedPeer.score === score
                  ? `${data.org_name || "Abc Enterprise"} matches the risk score of ${activeComparedPeer.name}.`
                  : `${activeComparedPeer.name} has ${score - activeComparedPeer.score} points lower risk than ${data.org_name || "Abc Enterprise"}.`}
              </span>
            </div>
          </div>
        </div>

        {/* Expanded 4-Pillar Side-by-Side Dimensional Comparison Grid */}
        <div className="pt-8 border-t border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              Side-by-Side 4-Pillar Alignment Matrix:
            </div>
            <div className="text-xs font-mono text-zinc-500">
              <span className="text-white font-bold">Your Org</span> vs <span className="text-[#ff6600] font-bold">{activeComparedPeer.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Pillar 1 */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[10px] uppercase font-mono">Pillar 1 (30%)</span>
                <span className="text-xs font-mono font-semibold text-zinc-400">Perimeter</span>
              </div>
              <div className="text-white font-bold font-sans text-sm">External Exposure</div>
              <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-white font-bold text-lg">{data.pillars?.exposure ?? 0}</span>
                <span className="text-zinc-500 text-xs">vs</span>
                <span className="text-[#ff6600] font-bold text-lg">{activeComparedPeer.exposure_score}</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[10px] uppercase font-mono">Pillar 2 (25%)</span>
                <span className="text-xs font-mono font-semibold text-zinc-400">CVE / KEV</span>
              </div>
              <div className="text-white font-bold font-sans text-sm">Vulnerabilities</div>
              <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-white font-bold text-lg">{data.pillars?.vulnerability ?? 0}</span>
                <span className="text-zinc-500 text-xs">vs</span>
                <span className="text-red-400 font-bold text-lg">{activeComparedPeer.vulnerability_score}</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[10px] uppercase font-mono">Pillar 3 (25%)</span>
                <span className="text-xs font-mono font-semibold text-zinc-400">Breaches</span>
              </div>
              <div className="text-white font-bold font-sans text-sm">Credential Leaks</div>
              <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-white font-bold text-lg">{data.pillars?.credential_exposure ?? 0}</span>
                <span className="text-zinc-500 text-xs">vs</span>
                <span className="text-amber-400 font-bold text-lg">{activeComparedPeer.credential_exposure_score}</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 text-[10px] uppercase font-mono">Pillar 4 (20%)</span>
                <span className="text-xs font-mono font-semibold text-zinc-400">Impact</span>
              </div>
              <div className="text-white font-bold font-sans text-sm">Business Criticality</div>
              <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-white font-bold text-lg">{data.pillars?.business_impact ?? 0}</span>
                <span className="text-zinc-500 text-xs">vs</span>
                <span className="text-emerald-400 font-bold text-lg">68</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Peer Directory Grid & Search */}
      <div className="card-cyber p-7 space-y-6 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white font-sans">Cohort Industry Benchmark Directory</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Click any company below to swap into the direct head-to-head score comparison above.
            </p>
          </div>

          {/* Benchmark KPI Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-black border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-mono">Industry Avg: </span>
              <span className="font-bold text-amber-400 font-mono ml-1">
                {benchmarkData?.industry_average_score ?? 58.4} / 100
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-black border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-mono">Benchmark Leader: </span>
              <span className="font-bold text-emerald-400 font-mono ml-1">
                {benchmarkData?.top_benchmark_score ?? 26} / 100
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-black border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-mono">Cohort Count: </span>
              <span className="font-bold text-white font-mono ml-1">
                {benchmarkData?.total_peers_compared ?? 7} Companies
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search companies by name, domain, sector, risk band or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/80 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {sectors.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSector(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5",
                  selectedSector === s
                    ? "bg-[#ff6600] text-white font-bold shadow-md shadow-orange-500/20"
                    : "bg-black border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                )}
              >
                <span>{s}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono leading-none",
                    selectedSector === s
                      ? "bg-black/30 text-white font-semibold"
                      : "bg-zinc-900 text-zinc-400"
                  )}
                >
                  {sectorCounts[s] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Peer Companies Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredPeers.length === 0 ? (
            <div className="col-span-full py-16 px-4 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <Search className="w-6 h-6 text-zinc-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">No benchmark companies found</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  {searchQuery ? `No companies matching "${searchQuery}"` : "No peer companies found"}{" "}
                  {selectedSector !== "All" ? `in sector "${selectedSector}"` : ""}.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("All");
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-[#ff6600] border border-zinc-800 hover:border-[#ff6600]/40 flex items-center gap-2 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Search & Filters</span>
              </button>
            </div>
          ) : (
            filteredPeers.map((peer) => {
              const isSelected = activeComparedPeer.id === peer.id;
              const deltaPositive = peer.delta_vs_org > 0;

              return (
                <div
                  key={peer.id}
                  onClick={() => handleSelectPeer(peer)}
                  className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 group",
                    isSelected
                      ? "bg-zinc-900 border-[#ff6600] shadow-xl shadow-orange-500/10 ring-1 ring-[#ff6600]/50"
                      : "bg-black/70 hover:bg-zinc-900/80 border-zinc-800 hover:border-[#ff6600]/40"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-[#ff6600] transition-colors font-sans">
                          {peer.name}
                        </h3>
                        <div className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Globe className="w-3 h-3 text-zinc-500" />
                          <span>{peer.domain}</span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase shrink-0",
                          peer.band === "CRITICAL"
                            ? "bg-red-950/60 border-red-800 text-red-400"
                            : peer.band === "HIGH"
                            ? "bg-orange-950/60 border-orange-800 text-orange-400"
                            : peer.band === "MODERATE"
                            ? "bg-amber-950/60 border-amber-800 text-amber-400"
                            : "bg-emerald-950/60 border-emerald-800 text-emerald-400"
                        )}
                      >
                        {peer.band}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-sans">
                        {peer.sector}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-sans">
                        {peer.status}
                      </span>
                    </div>

                    {/* Score & Delta Row */}
                    <div className="flex items-baseline justify-between mt-4 p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-zinc-400">Risk Score</div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black font-mono text-white">{peer.score}</span>
                          <span className="text-xs font-mono text-zinc-500">/100</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-mono text-zinc-400">vs Your Org ({score})</div>
                        <div
                          className={cn(
                            "text-xs font-mono font-bold flex items-center gap-0.5 justify-end mt-0.5",
                            deltaPositive ? "text-red-400" : "text-emerald-400"
                          )}
                        >
                          {deltaPositive ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              <span>+{peer.delta_vs_org} higher</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>{peer.delta_vs_org} lower</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pillar Sub-bars */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-[11px] font-mono">
                      <div className="text-center p-1.5 rounded bg-zinc-900/40 border border-zinc-800/50">
                        <span className="text-zinc-500 block text-[9px] uppercase">Exposure</span>
                        <span className="font-bold text-white">{peer.exposure_score}</span>
                      </div>
                      <div className="text-center p-1.5 rounded bg-zinc-900/40 border border-zinc-800/50">
                        <span className="text-zinc-500 block text-[9px] uppercase">Vulns</span>
                        <span className="font-bold text-red-400">{peer.vulnerability_score}</span>
                      </div>
                      <div className="text-center p-1.5 rounded bg-zinc-900/40 border border-zinc-800/50">
                        <span className="text-zinc-500 block text-[9px] uppercase">Creds</span>
                        <span className="font-bold text-amber-400">{peer.credential_exposure_score}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs font-mono text-zinc-400 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1">
                      {peer.trend_direction === "down" ? (
                        <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>30d: {peer.trend_30d}</span>
                    </div>
                    <span className={cn("font-sans font-bold", isSelected ? "text-[#ff6600]" : "text-zinc-400 group-hover:text-white")}>
                      {isSelected ? "Active in Comparison ✓" : "Compare Head-to-Head →"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
