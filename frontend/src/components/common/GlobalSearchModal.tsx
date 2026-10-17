"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Globe, User, ShieldAlert, Briefcase, FileSearch, KeyRound, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.globalSearch(query);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results
    ? (results.assets?.length || 0) +
      (results.identities?.length || 0) +
      (results.findings?.length || 0) +
      (results.cases?.length || 0) +
      (results.vulnerabilities?.length || 0) +
      (results.credentials?.length || 0) +
      (results.vendors?.length || 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#1e293b] gap-2.5 sm:gap-3">
          <Search className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, identities, CVEs, findings, cases, credentials..."
            autoFocus
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none min-w-0"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-300 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1 shrink-0"
            title="Close Search (Esc)"
          >
            <span className="hidden sm:inline">Esc</span>
            <X className="w-3.5 h-3.5 sm:hidden" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Scanning intelligence across all 7 correlation domains...
            </div>
          )}

          {!isLoading && !results && query.length < 2 && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type at least 2 characters to search (e.g. &ldquo;vpn&rdquo;, &ldquo;employee1&rdquo;, &ldquo;CVE-2024&rdquo;)
            </div>
          )}

          {!isLoading && results && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No intelligence records found matching &ldquo;{query}&rdquo;.
            </div>
          )}

          {results && (
            <>
              {/* Assets */}
              {results.assets?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" /> External Assets ({results.assets.length})
                  </div>
                  <div className="space-y-1">
                    {results.assets.map((a: any) => (
                      <Link
                        key={a.id}
                        href={`/exposure/assets`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <span className="font-mono text-cyan-300">{a.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{a.type}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            Risk: {a.risk_score}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings */}
              {results.findings?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 text-amber-400" /> Findings ({results.findings.length})
                  </div>
                  <div className="space-y-1">
                    {results.findings.map((f: any) => (
                      <Link
                        key={f.id}
                        href={`/operations/findings`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-semibold">{f.ref}</span>
                          <span className="text-slate-200">{f.title}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 font-mono">
                          {f.severity}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Identities */}
              {results.identities?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" /> Identities ({results.identities.length})
                  </div>
                  <div className="space-y-1">
                    {results.identities.map((i: any) => (
                      <Link
                        key={i.id}
                        href={`/exposure/identities`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <span className="font-mono text-slate-200">{i.email}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{i.role}</span>
                          {i.is_privileged && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 font-semibold">
                              PRIVILEGED
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Vulnerabilities */}
              {results.vulnerabilities?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Vulnerabilities ({results.vulnerabilities.length})
                  </div>
                  <div className="space-y-1">
                    {results.vulnerabilities.map((v: any) => (
                      <Link
                        key={v.id}
                        href={`/exposure/vulnerabilities`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <span className="font-mono text-red-400 font-semibold">{v.cve_id}</span>
                        <span className="text-slate-300 truncate max-w-sm">{v.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Credential Exposures */}
              {results.credentials?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" /> Credential Exposures ({results.credentials.length})
                  </div>
                  <div className="space-y-1">
                    {results.credentials.map((e: any) => (
                      <Link
                        key={e.id}
                        href={`/exposure/credentials`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <span className="font-mono text-slate-200">{e.email}</span>
                        <span className="text-purple-300 truncate max-w-xs">{e.breach}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Cases */}
              {results.cases?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Security Cases ({results.cases.length})
                  </div>
                  <div className="space-y-1">
                    {results.cases.map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/operations/cases`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <span className="font-mono text-cyan-400">{c.ref}</span>
                        <span className="text-slate-200 truncate">{c.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendors */}
              {results.vendors?.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Third-Party Vendors ({results.vendors.length})
                  </div>
                  <div className="space-y-1">
                    {results.vendors.map((vn: any) => (
                      <Link
                        key={vn.id}
                        href={`/risk/third-party`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-colors text-xs"
                      >
                        <span className="font-semibold text-slate-200">{vn.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{vn.domain}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

