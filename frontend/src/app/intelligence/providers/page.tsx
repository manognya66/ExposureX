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
  Search,
  Globe,
  Eye,
  Layers,
  Lock,
  Server,
  Activity,
  ShieldAlert,
  Network,
  Database,
  Calendar,
  Sparkles,
  Radio,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
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

  // Multi-layer Web Scanner State
  const [scanDomain, setScanDomain] = useState("abc.com");
  const [scanCompany, setScanCompany] = useState("Abc Enterprise");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [activeLayerTab, setActiveLayerTab] = useState<"all" | "dark" | "deep" | "surface">("all");

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

  const handleRunMultiLayerScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scanDomain.trim()) return;
    setIsScanning(true);
    setNotification(null);
    try {
      const res = await api.scanCompanyWebIntelligence(scanDomain.trim(), scanCompany.trim());
      setScanResult(res);
      setNotification({
        type: "success",
        message: `Multi-layer scan complete for ${res.target_domain}: Discovered ${res.total_threat_indicators} indicators (${res.composite_risk_level} Composite Risk).`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Multi-layer scan failed: ${err.message || String(err)}`,
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Filter out any HIBP references per user instruction
  const cleanProviders = providers.filter(
    (p) => p.id.toUpperCase() !== "HIBP" && !p.name.toLowerCase().includes("pwned")
  );

  const categories = [
    { title: "Dark Web Intelligence", key: "Dark Web Intelligence" },
    { title: "Deep Web Intelligence", key: "Deep Web Intelligence" },
    { title: "Surface Web Intelligence", key: "Surface Web Intelligence" },
    { title: "External Asset Discovery", key: "External Asset Discovery" },
    { title: "Credential Intelligence", key: "Credential Intelligence" },
    { title: "Vulnerability Intelligence", key: "Vulnerability Intelligence" },
  ];

  const freeApiPlatforms = [
    {
      name: "Ransomwatch Feed",
      category: "Dark Web Extortion Intelligence",
      badge: "100% Free / Keyless",
      badgeColor: "bg-red-950/80 text-red-300 border-red-800",
      description:
        "Real-time scraper tracking 100+ dark web Tor hidden services and ransomware extortion leak blogs (LockBit, Play, BlackBasta, Akira, 8base, Medusa). Scans darknet victim logs.",
      envVar: "KEYLESS_PUBLIC_FEED",
      signupUrl: "https://github.com/joshhighet/ransomwatch",
      apiDocUrl: "https://raw.githubusercontent.com/joshhighet/ransomwatch/main/posts.json",
      rateLimitInfo: "Keyless: Live Tor Scraping Feed (Updated hourly)",
    },
    {
      name: "URLScan.io API",
      category: "Deep Web Application & DOM Crawler",
      badge: "Free Public Tier",
      badgeColor: "bg-blue-950/80 text-blue-300 border-blue-800",
      description:
        "Deep web inspection engine analyzing website DOM structures, TLS certificate chains, ASN infrastructure, IP relations, and automated security verdicts.",
      envVar: "URLSCAN_API_KEY",
      signupUrl: "https://urlscan.io",
      apiDocUrl: "https://urlscan.io/docs/api/",
      rateLimitInfo: "Keyless Search: Public queries • Free Key: 5,000 scans/mo",
    },
    {
      name: "AlienVault OTX (Open Threat Exchange)",
      category: "Deep Threat Pulse Intelligence",
      badge: "Free Community Tier",
      badgeColor: "bg-purple-950/80 text-purple-300 border-purple-800",
      description:
        "Crowd-sourced open threat intelligence platform detailing threat pulses, malicious campaign tags, adversary groups, and CVE correlations for target domains.",
      envVar: "OTX_API_KEY",
      signupUrl: "https://otx.alienvault.com",
      apiDocUrl: "https://otx.alienvault.com/api",
      rateLimitInfo: "Keyless Indicator API: Public community endpoints",
    },
    {
      name: "HackerTarget DNS Host Search",
      category: "Surface Web Perimeter Mapping",
      badge: "Free OSINT Tier",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      description:
        "Passive DNS infrastructure and hostname mapping query engine returning live subdomains and IP addresses from surface DNS records without active scanning.",
      envVar: "HACKERTARGET_API_KEY",
      signupUrl: "https://hackertarget.com",
      apiDocUrl: "https://hackertarget.com/ip-tools/",
      rateLimitInfo: "Keyless: 50 lookups/day • Free Developer Key",
    },
    {
      name: "XposedOrNot",
      category: "Open-Source Community Breach Registry",
      badge: "100% Free / Keyless",
      badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
      description:
        "Open-source, community-driven database of hundreds of verified data breaches and paste dumps. Offers keyless REST endpoints for email lookups and free domain monitoring.",
      envVar: "XPOSEDORNOT_API_KEY",
      signupUrl: "https://xposedornot.com",
      apiDocUrl: "https://api.xposedornot.com/docs",
      rateLimitInfo: "Keyless: 2 req/sec, 100/day • Free Key: High throughput",
    },
    {
      name: "Hudson Rock Cavalier OSINT",
      category: "Infostealer & Cybercrime Telemetry",
      badge: "Free OSINT Tier",
      badgeColor: "bg-orange-950/80 text-orange-300 border-orange-800",
      description:
        "Specialized threat intelligence analyzing live infostealer malware infections (RedLine, Vidar, Raccoon, Lumma). Detects compromised employee devices and stolen credentials.",
      envVar: "HUDSON_ROCK_API_KEY",
      signupUrl: "https://www.hudsonrock.com/free-tools",
      apiDocUrl: "https://docs.hudsonrock.com",
      rateLimitInfo: "Free OSINT: Keyless lookups • Developer Key: On-demand",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] shadow-md shadow-black/50">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
                <span>Intelligence Provider Adapters</span>
                <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 font-semibold">
                  {cleanProviders.length} Live Adapters
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5 font-sans">
                Real-world, zero-cost intelligence layer spanning Dark Web Tor leak blogs, Deep Web application crawls, and Surface Web asset perimeters.
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

      {/* =====================================================================
          INTERACTIVE MULTI-LAYER WEB & THREAT INTELLIGENCE SCANNER
          Dark Web (Tor blogs & stealers) • Deep Web (DOM & OTX) • Surface Web (DNS & crt.sh)
          ===================================================================== */}
      <div className="card-cyber p-6 sm:p-7 space-y-6 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
                <Radio className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white font-sans">
                Multi-Layer Company Web & Threat Intelligence Scanner
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 font-sans">
              Scan the registered enterprise across the <strong>Dark Web</strong> (Tor extortion blogs & infostealers), <strong>Deep Web</strong> (URLScan DOM & AlienVault OTX pulses), and <strong>Surface Web</strong> (HackerTarget DNS & Certificate Transparency).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Free / Keyless Active</span>
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRunMultiLayerScan} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Company Domain</label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Target Domain (e.g. abc.com, lockheedmartin.com)"
                value={scanDomain}
                onChange={(e) => setScanDomain(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
                required
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">Company Name</label>
            <input
              type="text"
              placeholder="Company Name (e.g. Abc Enterprise)"
              value={scanCompany}
              onChange={(e) => setScanCompany(e.target.value)}
              className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isScanning || !scanDomain.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#ff6600] hover:bg-orange-600 disabled:opacity-50 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scan Web</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Scan Results View */}
        {scanResult && (
          <div className="space-y-5 pt-2 animate-module-fade">
            {/* Summary Bar */}
            <div className="p-4 rounded-xl bg-black border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-mono font-bold uppercase border",
                    scanResult.composite_risk_level === "CRITICAL"
                      ? "bg-red-950/70 border-red-800 text-red-400"
                      : scanResult.composite_risk_level === "HIGH"
                      ? "bg-orange-950/70 border-orange-800 text-orange-400"
                      : scanResult.composite_risk_level === "MODERATE"
                      ? "bg-amber-950/70 border-amber-800 text-amber-400"
                      : "bg-emerald-950/70 border-emerald-800 text-emerald-400"
                  )}
                >
                  {scanResult.composite_risk_level} COMPOSITE RISK
                </span>
                <span className="text-xs text-white font-mono font-bold">{scanResult.target_domain}</span>
                <span className="text-xs text-zinc-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                  {scanResult.total_threat_indicators} Threat Indicators Discovered
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">
                  Scanned: {new Date(scanResult.scan_timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* 3-Column Multi-Layer Dossier Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. DARK WEB COLUMN */}
              <div className="p-5 rounded-2xl bg-black/80 border border-zinc-800 hover:border-red-500/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                          Dark Web Intelligence
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono">Tor Leaks & Infostealers</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                        scanResult.layers?.dark_web?.risk_level === "CRITICAL"
                          ? "bg-red-950 text-red-400"
                          : scanResult.layers?.dark_web?.risk_level === "HIGH"
                          ? "bg-orange-950 text-orange-400"
                          : "bg-zinc-900 text-zinc-400"
                      )}
                    >
                      {scanResult.layers?.dark_web?.risk_level}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {scanResult.layers?.dark_web?.summary}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">Ransomware Leak Claims</span>
                      <span className="font-bold text-white">
                        {scanResult.layers?.dark_web?.ransomware_leak_events ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">Infostealer Infections</span>
                      <span className="font-bold text-amber-400">
                        {scanResult.layers?.dark_web?.infostealer_telemetry?.stealers_detected ?? 0}
                      </span>
                    </div>

                    {scanResult.layers?.dark_web?.ransomware_posts?.length > 0 ? (
                      <div className="mt-2 space-y-1.5">
                        <div className="text-[10px] text-zinc-500 uppercase">Recent Tor Leak Posts:</div>
                        {scanResult.layers.dark_web.ransomware_posts.slice(0, 2).map((p: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-red-950/30 border border-red-900/40 text-[11px]">
                            <div className="text-red-300 font-bold">{p.threat_actor}</div>
                            <div className="text-zinc-400 text-[10px] truncate">{p.post_title}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-mono py-1">
                        ✓ No active ransomware extortion listings
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Source: Ransomwatch Tor Feed</span>
                  <span className="text-emerald-400">Live</span>
                </div>
              </div>

              {/* 2. DEEP WEB COLUMN */}
              <div className="p-5 rounded-2xl bg-black/80 border border-zinc-800 hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                          Deep Web Intelligence
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono">DOM, ASN & OTX Pulses</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                        scanResult.layers?.deep_web?.risk_level === "CRITICAL"
                          ? "bg-red-950 text-red-400"
                          : scanResult.layers?.deep_web?.risk_level === "HIGH"
                          ? "bg-orange-950 text-orange-400"
                          : "bg-zinc-900 text-zinc-400"
                      )}
                    >
                      {scanResult.layers?.deep_web?.risk_level}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {scanResult.layers?.deep_web?.summary}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">Deep Web Crawled Scans</span>
                      <span className="font-bold text-white">
                        {scanResult.layers?.deep_web?.deep_web_crawls_count ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">AlienVault OTX Pulses</span>
                      <span className="font-bold text-purple-400">
                        {scanResult.layers?.deep_web?.alienvault_otx?.pulse_count ?? 0}
                      </span>
                    </div>

                    {scanResult.layers?.deep_web?.asn_footprint?.length > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-zinc-500 text-[11px]">Primary ASNs</span>
                        <span className="text-zinc-300 text-[10px] truncate max-w-[150px]">
                          {scanResult.layers.deep_web.asn_footprint.join(", ")}
                        </span>
                      </div>
                    )}

                    {scanResult.layers?.deep_web?.alienvault_otx?.adversary_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scanResult.layers.deep_web.alienvault_otx.adversary_tags.slice(0, 4).map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-zinc-900 text-[10px] text-zinc-400 border border-zinc-800">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Source: URLScan.io + AlienVault OTX</span>
                  <span className="text-emerald-400">Live</span>
                </div>
              </div>

              {/* 3. SURFACE WEB COLUMN */}
              <div className="p-5 rounded-2xl bg-black/80 border border-zinc-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white uppercase font-mono tracking-wider">
                          Surface Web Intelligence
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-mono">DNS, crt.sh & Archives</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                        scanResult.layers?.surface_web?.risk_level === "CRITICAL"
                          ? "bg-red-950 text-red-400"
                          : scanResult.layers?.surface_web?.risk_level === "HIGH"
                          ? "bg-orange-950 text-orange-400"
                          : "bg-zinc-900 text-zinc-400"
                      )}
                    >
                      {scanResult.layers?.surface_web?.risk_level}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                    {scanResult.layers?.surface_web?.summary}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">Discovered Subdomains</span>
                      <span className="font-bold text-white">
                        {scanResult.layers?.surface_web?.total_surface_hosts ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">Cert Transparency Records</span>
                      <span className="font-bold text-emerald-400">
                        {scanResult.layers?.surface_web?.certificate_transparency_records ?? 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-500 text-[11px]">Wayback Machine Archive</span>
                      <span className="font-bold text-zinc-300">
                        {scanResult.layers?.surface_web?.wayback_archive?.has_historical_snapshots ? "Indexed ✓" : "None"}
                      </span>
                    </div>

                    {scanResult.layers?.surface_web?.discovered_hosts?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-[10px] text-zinc-500 uppercase">Perimeter Hosts:</div>
                        <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                          {scanResult.layers.surface_web.discovered_hosts.slice(0, 4).map((h: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-1 rounded bg-zinc-900/60 border border-zinc-800">
                              <span className="text-zinc-300 truncate max-w-[140px]">{h.hostname}</span>
                              <span className="text-zinc-500 text-[9px]">{h.ip_address}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                  <span>Source: HackerTarget + crt.sh + Archive.org</span>
                  <span className="text-emerald-400">Live</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

                        <h3 className="text-sm font-bold text-white font-sans">{p.name}</h3>

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

      {/* Free & Open Source Intelligence APIs Reference */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff6600]" />
          <h2 className="text-base font-bold text-white font-sans">
            Curated Free & Open-Source Cyber Threat Intelligence APIs
          </h2>
        </div>
        <p className="text-xs text-zinc-400 font-sans">
          These zero-cost, community-supported intelligence feeds provide real-time dark web ransomware logs, deep web DOM inspection, crowd threat pulses, and surface DNS mapping.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freeApiPlatforms.map((platform) => (
            <div
              key={platform.name}
              className="p-5 rounded-2xl bg-black/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-white font-sans">{platform.name}</h3>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold border", platform.badgeColor)}>
                    {platform.badge}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 mb-2">{platform.category}</div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{platform.description}</p>
                <div className="mt-3 text-[11px] font-mono text-zinc-500">
                  <span>Quota: </span>
                  <span className="text-zinc-300">{platform.rateLimitInfo}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <a
                  href={platform.signupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={platform.apiDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ff6600] hover:underline flex items-center gap-1"
                >
                  <span>API Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
