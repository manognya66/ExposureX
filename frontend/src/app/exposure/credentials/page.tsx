"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { CredentialExposure } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CredentialsPage() {
  const [exposures, setExposures] = useState<CredentialExposure[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState(false);
  const [statusModalExp, setStatusModalExp] = useState<CredentialExposure | null>(null);
  const [newStatus, setNewStatus] = useState("Under Investigation");
  const [analystNotes, setAnalystNotes] = useState("");

  // Telemetry creation state
  const [synthEmail, setSynthEmail] = useState("");
  const [synthTitle, setSynthTitle] = useState("");
  const [synthSeverity, setSynthSeverity] = useState("High");

  const loadCredentials = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.investigation_status = statusFilter;
      const data = await api.getCredentials(params);
      setExposures(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, [search, severityFilter, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!statusModalExp) return;
    try {
      await api.updateCredentialStatus(statusModalExp.id, newStatus, analystNotes);
      setStatusModalExp(null);
      loadCredentials();
    } catch (err) {
      alert("Error: " + err);
    }
  };

  const handleCreateSynthetic = async () => {
    try {
      await api.createSyntheticExposure({
        email: synthEmail,
        breach_title: synthTitle,
        severity: synthSeverity,
        exposure_type: "Infostealer Log Metadata",
        confidence: "Verified",
        source_category: "Commercial Threat Intelligence",
        related_asset_domain: "vpn.company.com",
        exposed_data_classes: ["Email", "Job Title", "Corporate VPN Domain Reference"],
      });
      setIsSyntheticModalOpen(false);
      loadCredentials();
    } catch (err) {
      alert("Error creating synthetic exposure: " + err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <KeyRound className="w-5 h-5 text-[#ff6600]" />
            <span>Credential Intelligence & Exposure Events</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {exposures.length} Events
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Minimizes breached credential metadata from authorized intelligence providers. Zero plaintext password storage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ZERO PLAINTEXT STORAGE ENFORCED</span>
          </div>

          <button
            onClick={() => setIsSyntheticModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Ingested Telemetry</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search affected email, breach title, or domain..."
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
          <option value="Moderate">Moderate</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 font-sans focus:outline-none focus:border-[#ff6600]"
        >
          <option value="">All Investigation Statuses</option>
          <option value="New">New</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Remediated">Remediated</option>
          <option value="False Positive">False Positive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-cyber p-0 overflow-hidden bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-4 font-bold">Affected Identity</th>
              <th className="py-3.5 px-4 font-bold">Breach Source / Title</th>
              <th className="py-3.5 px-4 font-bold">Provider</th>
              <th className="py-3.5 px-4 font-bold">Exposed Metadata Classes</th>
              <th className="py-3.5 px-4 font-bold">Severity</th>
              <th className="py-3.5 px-4 font-bold">Correlated Asset</th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th className="py-3.5 px-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2333]/60">
            {exposures.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-mono text-xs">
                  <KeyRound className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <div>No credential exposure events logged.</div>
                  <div className="text-[11px] text-slate-600 mt-1">Telemetry will appear here when authorized exposure feeds or breach intelligence are ingested.</div>
                </td>
              </tr>
            ) : (
              exposures.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-100 font-semibold">{exp.email}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                      SHA: {exp.email_hash_sha256?.substring(0, 16)}...
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-purple-300 font-medium">{exp.breach_title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{exp.breach_date || "Continuous Feed"}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{exp.provider}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {exp.exposed_data_classes?.map((c, idx) => (
                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                        exp.severity === "Critical"
                          ? "bg-red-950/60 text-red-400 border border-red-500/40"
                          : "bg-amber-950/60 text-amber-400 border border-amber-500/40"
                      )}
                    >
                      {exp.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-300 text-xs">
                    {exp.related_asset_name || "Enterprise Domain"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded",
                        exp.investigation_status === "Confirmed"
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                          : exp.investigation_status === "Under Investigation"
                          ? "bg-cyan-950/60 text-cyan-400 border border-cyan-800"
                          : "bg-slate-800 text-slate-300"
                      )}
                    >
                      {exp.investigation_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setStatusModalExp(exp);
                        setNewStatus(exp.investigation_status);
                        setAnalystNotes("");
                      }}
                      className="text-purple-400 hover:text-purple-300 text-xs font-mono font-medium"
                    >
                      Triage →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Triage / Status Modal */}
      {statusModalExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">Update Exposure Investigation</h3>
              </div>
              <button onClick={() => setStatusModalExp(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-slate-900/80 p-3 rounded border border-slate-800">
              <div><strong className="text-slate-400">Target Identity:</strong> {statusModalExp.email}</div>
              <div><strong className="text-slate-400">Breach Event:</strong> {statusModalExp.breach_title}</div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Investigation Lifecycle Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
              >
                <option value="New">New</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Remediated">Remediated</option>
                <option value="False Positive">False Positive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Analyst Notes</label>
              <textarea
                rows={3}
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                placeholder="Document verification steps, user contact, or credential rotation..."
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setStatusModalExp(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
              >
                Save Triage Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Synthetic Modal */}
      {isSyntheticModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-slate-100">Ingest Credential Exposure Telemetry</h3>
              </div>
              <button onClick={() => setIsSyntheticModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Target Identity Email</label>
              <input
                type="text"
                value={synthEmail}
                onChange={(e) => setSynthEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Breach Event Title</label>
              <input
                type="text"
                value={synthTitle}
                onChange={(e) => setSynthTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Severity</label>
              <select
                value={synthSeverity}
                onChange={(e) => setSynthSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setIsSyntheticModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSynthetic}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
              >
                Ingest & Correlate Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

