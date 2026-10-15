"use client";

import React, { useState, useEffect } from "react";
import {
  FileSearch,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  X,
  User,
  Globe,
  KeyRound,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { Finding, FindingDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedFinding, setSelectedFinding] = useState<FindingDetail | null>(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [caseCreatedStatus, setCaseCreatedStatus] = useState<string | null>(null);

  // Dynamic Add Finding state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState("High");
  const [newAssetName, setNewAssetName] = useState("");
  const [newIdentityEmail, setNewIdentityEmail] = useState("");
  const [newRecommendedAction, setNewRecommendedAction] = useState("");
  const [isAddingFinding, setIsAddingFinding] = useState(false);

  const loadFindings = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getFindings(params);
      setFindings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [search, severityFilter, statusFilter]);

  const handleSelectFinding = async (id: string) => {
    try {
      const detail = await api.getFindingDetail(id);
      setSelectedFinding(detail);
      setCaseCreatedStatus(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedFinding) return;
    try {
      await api.updateFindingStatus(selectedFinding.id, newStatus);
      setSelectedFinding({ ...selectedFinding, status: newStatus });
      loadFindings();
    } catch (err) {
      alert("Error updating status: " + err);
    }
  };

  const handleEscalateToCase = async () => {
    if (!selectedFinding) return;
    try {
      const res = await api.createCase({
        title: selectedFinding.title,
        severity: selectedFinding.severity,
        risk_score: selectedFinding.risk_score,
        description: `Escalated from finding ${selectedFinding.finding_ref}: ${selectedFinding.title}`,
        related_finding_ref: selectedFinding.finding_ref,
      });
      setCaseCreatedStatus(`Created Security Case: ${res.case_ref}`);
      handleUpdateStatus("Investigating");
    } catch (err) {
      alert("Error escalating to case: " + err);
    }
  };

  const handleAddFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsAddingFinding(true);
    try {
      await api.createFinding({
        title: newTitle.trim(),
        severity: newSeverity,
        asset_name: newAssetName.trim() || undefined,
        identity_email: newIdentityEmail.trim() || undefined,
        recommended_action: newRecommendedAction.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewAssetName("");
      setNewIdentityEmail("");
      setNewRecommendedAction("");
      await loadFindings();
    } catch (err: any) {
      alert("Error adding finding: " + (err.message || err));
    } finally {
      setIsAddingFinding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <FileSearch className="w-5 h-5 text-[#ff6600]" />
            <span>Exposure Findings</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {findings.length} Prioritized Findings
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Actionable exposure records synthesized from correlation between assets, identities, and vulnerability telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Finding</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search finding ID (EXP-ABC-001) or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-[#0f172a] border border-[#1e293b] text-slate-300 text-xs rounded-md px-3 py-2"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Moderate">Moderate</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0f172a] border border-[#1e293b] text-slate-300 text-xs rounded-md px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Investigating">Investigating</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Remediating">Remediating</option>
          <option value="Resolved">Resolved</option>
          <option value="Accepted Risk">Accepted Risk</option>
          <option value="False Positive">False Positive</option>
        </select>
      </div>

      {/* Main Content Layout (List + Detail Modal/Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Findings Table */}
        <div className={cn("card-cyber p-0 overflow-hidden", selectedFinding ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b14] border-b border-[#1a2333] text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Finding Ref</th>
                  <th className="py-3 px-4">Title & Correlation</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2333]/60">
                {findings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileSearch className="w-8 h-8 text-slate-600" />
                        <p className="text-sm font-medium text-slate-400">No triage findings generated</p>
                        <p className="text-xs text-slate-600 max-w-sm">
                          Discovered exposures, vulnerabilities, or leaked credentials will be correlated into actionable operational findings.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  findings.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => handleSelectFinding(f.id)}
                      className={cn(
                        "hover:bg-slate-900/60 cursor-pointer transition-colors",
                        selectedFinding?.id === f.id ? "bg-amber-950/20 border-l-2 border-amber-400" : ""
                      )}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{f.finding_ref}</td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-slate-200">{f.title}</div>
                        <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{f.asset_name || "Enterprise Scope"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                            f.severity === "Critical"
                              ? "bg-red-500/20 text-red-400 border border-red-500/40"
                              : f.severity === "High"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                          )}
                        >
                          {f.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">{f.risk_score}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">{f.owner || "Unassigned"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFinding(f.id);
                          }}
                          className="text-amber-400 hover:text-amber-300 font-mono text-xs"
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
        </div>

        {/* Finding Detail Panel (Section 33) */}
        {selectedFinding && (
          <div className="card-cyber p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2333]">
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 font-bold uppercase">
                  Finding {selectedFinding.finding_ref}
                </span>
                <h2 className="text-sm font-bold text-slate-100 mt-1">{selectedFinding.title}</h2>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Severity */}
            <div className="flex items-center justify-between p-3 rounded bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-mono">Risk Score</span>
                <span className="text-2xl font-bold font-mono text-red-400">{selectedFinding.risk_score} / 100</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block font-mono">Current Status</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedFinding.status}</span>
              </div>
            </div>

            {/* Why? Section (Section 33) */}
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-2">Why was this finding created?</div>
              <div className="p-3 rounded bg-black/40 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                {selectedFinding.why_explanation?.map((why, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{why}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action (Section 33) */}
            {selectedFinding.recommended_action && (
              <div className="p-3 rounded bg-red-950/20 border border-red-500/30 text-xs">
                <div className="font-mono text-red-400 font-semibold mb-1">Recommended Action:</div>
                <pre className="text-slate-300 font-sans whitespace-pre-wrap text-[11px] leading-relaxed">
                  {selectedFinding.recommended_action}
                </pre>
              </div>
            )}

            {/* Escalate to Case Notification */}
            {caseCreatedStatus && (
              <div className="p-2.5 rounded bg-cyan-950/40 border border-cyan-800 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{caseCreatedStatus}</span>
              </div>
            )}

            {/* Lifecycle Status Buttons */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1.5">
                Update Status Lifecycle:
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {["Investigating", "Confirmed", "Remediating", "Resolved", "Accepted Risk"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    className={cn(
                      "py-1 px-2 rounded border text-left transition-colors",
                      selectedFinding.status === st
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Escalate to Incident Case Button */}
            <div className="pt-2 border-t border-[#1a2333]">
              <button
                onClick={handleEscalateToCase}
                className="w-full py-2.5 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Escalate &amp; Create Security Case</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Dynamic Finding Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-cyber max-w-lg w-full p-6 space-y-4 bg-[#09090b] border-zinc-800 rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff6600]" />
                <h3 className="text-sm font-bold text-white font-sans">Create Exposure Finding</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFinding} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Finding Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthenticated Remote Code Execution on External Service"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Associated Asset</label>
                  <input
                    type="text"
                    placeholder="e.g. api.abc.com"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Affected Identity Email</label>
                <input
                  type="email"
                  placeholder="e.g. alex.devops@abc.com"
                  value={newIdentityEmail}
                  onChange={(e) => setNewIdentityEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Recommended Action</label>
                <textarea
                  rows={3}
                  placeholder="Detailed mitigation guidance or remediation steps..."
                  value={newRecommendedAction}
                  onChange={(e) => setNewRecommendedAction(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-sans transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingFinding}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95"
                >
                  {isAddingFinding ? "Creating Finding..." : "Save & Triage Finding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

