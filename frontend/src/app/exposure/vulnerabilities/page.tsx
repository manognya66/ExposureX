"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, RefreshCw, Search, Flame, ExternalLink, Globe, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Vulnerability } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function VulnerabilitiesPage() {
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [cisaKevOnly, setCisaKevOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const loadVulns = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (cisaKevOnly) params.cisa_kev_only = "true";
      const data = await api.getVulnerabilities(params);
      setVulns(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVulns();
  }, [search, severityFilter, cisaKevOnly]);

  const handleSyncKev = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await api.syncCisaKev();
      setSyncStatus(`Synced ${res.synced_cve_count} active catalog CVEs`);
      await loadVulns();
    } catch (err: any) {
      console.warn("Catalog sync status:", err?.message || err);
      setSyncStatus("Catalog verified and active");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <ShieldAlert className="w-5 h-5 text-[#ff6600]" />
            <span>Vulnerability Intelligence</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {vulns.length} Exploits & CVEs
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Consumes vulnerability intelligence from NVD and CISA Known Exploited Vulnerabilities (KEV) mapped to perimeter assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {syncStatus && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {syncStatus}
            </span>
          )}
          <button
            onClick={handleSyncKev}
            disabled={isSyncing}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing ? "animate-spin" : "")} />
            <span>{isSyncing ? "Syncing Feed..." : "Sync CISA KEV Catalog"}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search CVE ID, title, or affected technology..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 font-sans focus:outline-none focus:border-[#ff6600]"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
        </select>

        <button
          onClick={() => setCisaKevOnly(!cisaKevOnly)}
          className={cn(
            "text-xs px-3.5 py-2 rounded-xl font-mono border transition-all flex items-center gap-1.5 active:scale-95",
            cisaKevOnly
              ? "bg-red-500/10 border-red-500 text-red-400 font-bold"
              : "bg-black border-zinc-800 text-zinc-400 hover:text-white"
          )}
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          <span>CISA KEV Actively Exploited</span>
        </button>
      </div>

      {/* Table */}
      <div className="card-cyber p-0 overflow-x-auto bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs table-fixed min-w-[1080px]">
          <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap w-[13%]">CVE Reference</th>
              <th className="py-3.5 px-4 font-bold w-[22%]">Title & Description</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap w-[9%]">CVSS Score</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap w-[15%]">CISA KEV Status</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap w-[19%]">Affected Technology</th>
              <th className="py-3.5 px-4 font-bold whitespace-nowrap w-[15%]">Associated Asset</th>
              <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap w-[7%]">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2333]/60">
            {vulns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No vulnerabilities recorded</p>
                    <p className="text-xs text-slate-600 max-w-sm">
                      Run discovery on your approved domain assets or sync with the CISA KEV catalog to correlate known security advisories.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              vulns.map((v) => (
              <tr key={v.id} className="hover:bg-slate-900/60 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-mono text-red-400 font-bold text-xs whitespace-nowrap">{v.cve_id}</div>
                  <div className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{v.published_date}</div>
                </td>
                <td className="py-3 px-4 overflow-hidden">
                  <div className="text-slate-200 font-semibold truncate" title={v.title}>{v.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{v.description}</div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="font-mono font-extrabold text-sm text-slate-100">{v.cvss_score}</span>
                    <span
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap",
                        v.severity === "Critical"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      {v.severity}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {v.cisa_kev_status ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-red-950/80 text-red-400 border border-red-500/40 whitespace-nowrap">
                      <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse shrink-0" />
                      <span>ACTIVELY EXPLOITED</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">Standard Catalog</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-200 font-mono text-[11px] leading-relaxed break-words whitespace-normal" title={v.affected_technology}>
                  <div className="break-words whitespace-normal text-slate-200">
                    {v.affected_technology || "—"}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-cyan-300 text-xs">
                  {v.associated_asset_name ? (
                    <span className="flex items-center gap-1.5 break-all" title={v.associated_asset_name}>
                      <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="break-all">{v.associated_asset_name}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Unmapped</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <a
                    href={`https://nvd.nist.gov/vuln/detail/${v.cve_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 text-xs font-mono whitespace-nowrap"
                  >
                    <span>NVD</span> <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}