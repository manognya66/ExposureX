"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  Shield,
  Mail,
  Lock,
  Globe,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { Vendor } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ThirdPartyRiskPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  // New Vendor Form
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("SaaS Provider");
  const [criticality, setCriticality] = useState("High");
  const [sensitivity, setSensitivity] = useState("Confidential");
  const [notes, setNotes] = useState("");

  const loadVendors = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const data = await api.getVendors(params);
      setVendors(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [search, categoryFilter]);

  const handleCreateVendor = async () => {
    try {
      await api.createVendor({
        name,
        domain,
        category,
        business_criticality: criticality,
        data_sensitivity: sensitivity,
        notes,
      });
      setIsAddModalOpen(false);
      setName("");
      setDomain("");
      setNotes("");
      loadVendors();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Building2 className="w-5 h-5 text-[#ff6600]" />
            <span>Third-Party Risk Assessment</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              SEPARATED FROM INTERNAL SCORE
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Evaluates external exposure, email security posture (SPF/DKIM/DMARC), and supply chain risk for vendors and partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Onboard New Vendor</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor name or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 font-sans focus:outline-none focus:border-[#ff6600]"
        >
          <option value="">All Categories</option>
          <option value="SaaS Provider">SaaS Provider</option>
          <option value="Cloud Hosting">Cloud Hosting</option>
          <option value="Payment Gateway">Payment Gateway</option>
          <option value="Analytics">Analytics</option>
        </select>
      </div>

      {/* Vendor Cards Grid */}
      {vendors.length === 0 ? (
        <div className="card-cyber p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
          <Building2 className="w-8 h-8 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-400 font-sans">No third-party vendors enrolled</p>
          <p className="text-xs text-zinc-500 max-w-sm font-sans">
            Use the &quot;Onboard New Vendor&quot; button above to register external suppliers, evaluate SPF/DMARC posture, and monitor supply chain risk.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendors.map((v) => {
            const isCrit = v.risk_band === "Critical";
            const isHigh = v.risk_band === "High";
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVendor(v)}
                className="card-cyber p-5 hover:border-[#ff6600]/40 cursor-pointer transition-all flex flex-col justify-between bg-[#09090b] border border-zinc-800 rounded-2xl shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {v.category}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                        isCrit
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : isHigh
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      )}
                    >
                      {v.risk_band}
                    </span>
                  </div>

                  <div className="font-bold text-slate-100 text-sm mt-1">{v.name}</div>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>{v.domain}</span>
                  </div>

                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-100">{v.overall_risk_score}</span>
                    <span className="text-xs text-slate-500 font-mono">/ 100 Risk</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-[#1a2333]">
                    <div className="flex justify-between">
                      <span>Email Security (DMARC):</span>
                      <span className="font-mono text-slate-200">{v.email_security_score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Hygiene (TLS):</span>
                      <span className="font-mono text-slate-200">{v.hygiene_score}/100</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#1a2333] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{v.business_criticality} Criticality</span>
                  <span className="text-emerald-400 font-mono">Inspect Posture →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 overflow-hidden">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0b0f19] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-[#0e1424] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#ff6600]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-sans">{selectedVendor.name}</h3>
                    <span className={cn(
                      "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                      selectedVendor.risk_band === "Critical"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : selectedVendor.risk_band === "High"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    )}>
                      {selectedVendor.risk_band} Risk ({selectedVendor.overall_risk_score}/100)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-cyan-400 flex items-center gap-1.5 mt-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{selectedVendor.domain}</span>
                    <a
                      href={`https://${selectedVendor.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-cyan-300 transition-colors"
                      title="Open domain in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Overall Risk Score</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold font-mono text-amber-400">{selectedVendor.overall_risk_score}</span>
                    <span className="text-xs font-mono text-zinc-500">/ 100</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090d16] border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Category</span>
                  <div className="text-xs font-bold text-zinc-200 mt-1 truncate">{selectedVendor.category}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090d16] border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Criticality</span>
                  <div className="text-xs font-bold text-orange-400 mt-1">{selectedVendor.business_criticality}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090d16] border border-zinc-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-zinc-500 block">Data Sensitivity</span>
                  <div className="text-xs font-bold text-purple-400 mt-1">{selectedVendor.data_sensitivity}</div>
                </div>
              </div>

              {/* Security Pillars Breakdown */}
              <div className="p-4 rounded-xl bg-[#090d16] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>Security Pillars &amp; Posture Metrics</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Continuous Assessment</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">External Exposure:</span>
                    <span className="font-mono text-cyan-400 font-bold">{selectedVendor.external_exposure_score} / 100</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">Vulnerability Posture:</span>
                    <span className="font-mono text-red-400 font-bold">{selectedVendor.vulnerability_score} / 100</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">Credential Leaks:</span>
                    <span className="font-mono text-purple-400 font-bold">{selectedVendor.credential_score} / 100</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                    <span className="text-zinc-400">Email Security (SPF/DMARC):</span>
                    <span className="font-mono text-emerald-400 font-bold">{selectedVendor.email_security_score} / 100</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between sm:col-span-2">
                    <span className="text-zinc-400">Transport Hygiene (TLS 1.3 / HSTS):</span>
                    <span className="font-mono text-emerald-400 font-bold">{selectedVendor.hygiene_score} / 100</span>
                  </div>
                </div>
              </div>

              {/* Live Protocol Telemetry Section */}
              {selectedVendor.evidence && (selectedVendor.evidence.dns_protocol || selectedVendor.evidence.tls_protocol || selectedVendor.evidence.http_protocol) ? (
                <div className="p-4 sm:p-5 rounded-xl bg-slate-950/90 border border-cyan-800/50 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyan-900/40">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2">
                          <span>Live Protocol Telemetry Verified</span>
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <div className="text-[11px] text-zinc-400">Active cryptographic &amp; network handshake evidence</div>
                      </div>
                    </div>
                    {selectedVendor.last_assessed_at && (
                      <span className="text-[10px] font-mono text-zinc-500">
                        Assessed: {new Date(selectedVendor.last_assessed_at).toLocaleDateString()} {new Date(selectedVendor.last_assessed_at).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DNS & Email Security */}
                    <div className="p-3 rounded-lg bg-[#070b14] border border-cyan-950 space-y-2.5">
                      <div className="text-[11px] font-mono text-cyan-300 font-semibold uppercase flex items-center gap-1.5 pb-1 border-b border-zinc-800">
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                        <span>DNS &amp; Mail Routing Hygiene</span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-zinc-400 text-[11px] block mb-1">DNS A Records (IPv4):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedVendor.evidence.dns_protocol?.a_records && selectedVendor.evidence.dns_protocol.a_records.length > 0 ? (
                              selectedVendor.evidence.dns_protocol.a_records.map((ip: string, idx: number) => (
                                <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-cyan-300">
                                  {ip}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-500 font-mono text-[11px]">No A records</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="text-zinc-400 text-[11px] block mb-1">Mail Exchangers (MX):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedVendor.evidence.dns_protocol?.mx_records && selectedVendor.evidence.dns_protocol.mx_records.length > 0 ? (
                              selectedVendor.evidence.dns_protocol.mx_records.map((mx: string, idx: number) => (
                                <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                  {mx}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-500 font-mono text-[11px]">No MX records detected</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-zinc-400 text-[11px]">DMARC Policy:</span>
                          <span className={cn(
                            "font-semibold font-mono px-2 py-0.5 rounded text-[10px] uppercase border",
                            selectedVendor.evidence.dns_protocol?.dmarc_enforcement === "reject"
                              ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                              : selectedVendor.evidence.dns_protocol?.dmarc_enforcement === "quarantine"
                              ? "bg-amber-950/80 text-amber-400 border-amber-800"
                              : "bg-red-950/80 text-red-400 border-red-800"
                          )}>
                            {selectedVendor.evidence.dns_protocol?.dmarc_enforcement || "NONE"}
                          </span>
                        </div>

                        {selectedVendor.evidence.dns_protocol?.dmarc && (
                          <div className="pt-1">
                            <span className="text-zinc-500 text-[10px] block mb-0.5 font-mono">Raw DMARC Record:</span>
                            <div className="p-1.5 rounded bg-black/60 border border-zinc-900 font-mono text-[10px] text-zinc-400 break-all leading-tight">
                              {selectedVendor.evidence.dns_protocol.dmarc}
                            </div>
                          </div>
                        )}

                        {selectedVendor.evidence.dns_protocol?.spf && (
                          <div className="pt-1">
                            <span className="text-zinc-500 text-[10px] block mb-0.5 font-mono">Raw SPF Record:</span>
                            <div className="p-1.5 rounded bg-black/60 border border-zinc-900 font-mono text-[10px] text-zinc-400 break-all leading-tight">
                              {selectedVendor.evidence.dns_protocol.spf}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TLS & Web Server Hygiene */}
                    <div className="p-3 rounded-lg bg-[#070b14] border border-cyan-950 space-y-2.5">
                      <div className="text-[11px] font-mono text-cyan-300 font-semibold uppercase flex items-center gap-1.5 pb-1 border-b border-zinc-800">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Transport Cryptography &amp; HTTPS</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 text-[11px]">TLS Handshake Version:</span>
                          <span className={cn(
                            "font-mono font-bold px-2 py-0.5 rounded text-[10px] border",
                            selectedVendor.evidence.tls_protocol?.tls_version?.includes("1.3")
                              ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                              : selectedVendor.evidence.tls_protocol?.tls_version?.includes("1.2")
                              ? "bg-cyan-950/80 text-cyan-400 border-cyan-800"
                              : "bg-amber-950/80 text-amber-400 border-amber-800"
                          )}>
                            {selectedVendor.evidence.tls_protocol?.tls_version || "Not Handshaked"}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-400 text-[11px] block mb-1">Negotiated Cipher Suite:</span>
                          <div className="p-1.5 rounded bg-black/60 border border-zinc-900 font-mono text-[10px] text-emerald-300 break-all leading-tight">
                            {selectedVendor.evidence.tls_protocol?.cipher || "N/A"}
                          </div>
                        </div>

                        {selectedVendor.evidence.tls_protocol?.issuer && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[11px]">Certificate Issuer:</span>
                            <span className="font-mono text-zinc-300 text-[11px] truncate max-w-[180px]" title={selectedVendor.evidence.tls_protocol.issuer}>
                              {selectedVendor.evidence.tls_protocol.issuer}
                            </span>
                          </div>
                        )}

                        {selectedVendor.evidence.tls_protocol?.san_count !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[11px]">SAN Coverage:</span>
                            <span className="font-mono text-cyan-300 text-[11px]">
                              {selectedVendor.evidence.tls_protocol.san_count} Alternative Domains
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-900">
                          <span className="text-zinc-400 text-[11px]">HSTS Strict Security:</span>
                          <span className={cn(
                            "font-bold font-mono px-2 py-0.5 rounded text-[10px] border",
                            selectedVendor.evidence.http_protocol?.hsts
                              ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                              : "bg-amber-950/80 text-amber-400 border-amber-800"
                          )}>
                            {selectedVendor.evidence.http_protocol?.hsts ? "ENFORCED" : "NOT DETECTED"}
                          </span>
                        </div>

                        {selectedVendor.evidence.http_protocol?.server && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 text-[11px]">Web Server Banner:</span>
                            <span className="font-mono text-zinc-300 text-[11px]">
                              {selectedVendor.evidence.http_protocol.server}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-950/60 border border-dashed border-zinc-800 text-center space-y-2">
                  <Globe className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-300">Live Protocol Telemetry Not Yet Gathered</div>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                    Click &quot;Run Live Protocol Assessment&quot; below to execute non-intrusive DNS A/MX, SPF, DMARC, TLS handshake, and HSTS checks for {selectedVendor.domain}.
                  </p>
                </div>
              )}

              {/* Assessment Notes */}
              {selectedVendor.notes && (
                <div className="p-3.5 rounded-xl bg-[#090d16] border border-zinc-800 text-xs space-y-1">
                  <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Assessment Context &amp; Notes:</div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{selectedVendor.notes}</p>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="flex items-center justify-between p-4 bg-[#080c14] border-t border-zinc-800 shrink-0">
              <button
                disabled={isAssessing}
                onClick={async () => {
                  setIsAssessing(true);
                  try {
                    const res = await api.assessVendor(selectedVendor.id);
                    await loadVendors();
                    const updated = await api.getVendorDetail(selectedVendor.id);
                    setSelectedVendor(updated);
                  } catch (e: any) {
                    alert("Assessment error: " + e.message);
                  } finally {
                    setIsAssessing(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-orange-500/25 active:scale-95"
              >
                <Globe className={cn("w-4 h-4", isAssessing && "animate-spin")} />
                <span>{isAssessing ? "Probing Protocols..." : "Run Live Protocol Assessment"}</span>
              </button>
              
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Onboard Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Onboard Third-Party Vendor</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Vendor Organization Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apex Payment Gateway"
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Vendor Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="apexpay-gateway.com"
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
                >
                  <option value="SaaS Provider">SaaS Provider</option>
                  <option value="Cloud Hosting">Cloud Hosting</option>
                  <option value="Payment Gateway">Payment Gateway</option>
                  <option value="Analytics">Analytics</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Criticality</label>
                <select
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value)}
                  className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Notes / Scope Context</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Handles credit cards, direct API integration..."
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVendor}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-colors"
              >
                Onboard & Assess
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

