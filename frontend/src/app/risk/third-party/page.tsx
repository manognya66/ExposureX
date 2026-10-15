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
    <div className="space-y-6 max-w-7xl mx-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedVendor.name}</h3>
                <div className="text-xs font-mono text-cyan-400">{selectedVendor.domain}</div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Overall Third-Party Risk</span>
                <span className="text-xl font-bold font-mono text-amber-400">
                  {selectedVendor.overall_risk_score} / 100
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Data Sensitivity</span>
                <span className="text-sm font-semibold text-slate-200">{selectedVendor.data_sensitivity}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-mono text-slate-400 font-semibold uppercase text-[10px]">Security Pillars Breakdown:</div>
              <div className="space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span>External Exposure:</span>
                  <span className="font-mono text-cyan-400">{selectedVendor.external_exposure_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Vulnerability Posture:</span>
                  <span className="font-mono text-red-400">{selectedVendor.vulnerability_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Credential Leaks:</span>
                  <span className="font-mono text-purple-400">{selectedVendor.credential_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Email Security (SPF/DKIM/DMARC):</span>
                  <span className="font-mono text-emerald-400">{selectedVendor.email_security_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Hygiene (TLS/Certs):</span>
                  <span className="font-mono text-emerald-400">{selectedVendor.hygiene_score}/100</span>
                </div>
              </div>
            </div>

            {/* Live Protocol Telemetry */}
            {selectedVendor.evidence && selectedVendor.evidence.dns_protocol && (
              <div className="p-3 rounded bg-slate-950/80 border border-cyan-900/40 text-xs space-y-2">
                <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Real-World Protocol Telemetry</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">DNS A Records:</span>
                    <span className="text-cyan-300">{selectedVendor.evidence.dns_protocol.a_records?.join(", ") || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mail (MX):</span>
                    <span className="text-slate-300">{selectedVendor.evidence.dns_protocol.mx_records?.join(", ") || "None"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">DMARC Policy:</span>
                    <span className={cn(
                      "font-semibold px-1.5 py-0.2 rounded text-[10px]",
                      selectedVendor.evidence.dns_protocol.dmarc_enforcement === "reject"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    )}>
                      {selectedVendor.evidence.dns_protocol.dmarc_enforcement?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TLS Handshake:</span>
                    <span className="text-emerald-400">{selectedVendor.evidence.tls_protocol?.tls_version || "Not Handshaked"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TLS Cipher:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{selectedVendor.evidence.tls_protocol?.cipher || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">HSTS Enabled:</span>
                    <span className={selectedVendor.evidence.http_protocol?.hsts ? "text-emerald-400" : "text-amber-400"}>
                      {selectedVendor.evidence.http_protocol?.hsts ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedVendor.notes && (
              <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-[10px] font-mono text-slate-400 font-semibold mb-1">Assessment Notes:</div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{selectedVendor.notes}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-[#1e293b]">
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
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-xs text-white font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/25 active:scale-95"
              >
                <Globe className={cn("w-3.5 h-3.5", isAssessing && "animate-spin")} />
                <span>{isAssessing ? "Probing Protocols..." : "Run Live Protocol Assessment"}</span>
              </button>
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200"
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
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
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

