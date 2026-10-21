"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  MessageSquare,
  Clock,
  User,
  ShieldAlert,
  CheckCircle2,
  X,
  History,
} from "lucide-react";
import { api } from "@/lib/api";
import { SecurityCase, CaseDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CasesPage() {
  const [cases, setCases] = useState<SecurityCase[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseDetail | null>(null);
  const [newComment, setNewComment] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Dynamic Open New Case state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseSeverity, setNewCaseSeverity] = useState("High");
  const [newCaseRiskScore, setNewCaseRiskScore] = useState("75");
  const [newCaseDescription, setNewCaseDescription] = useState("");
  const [newCaseAnalyst, setNewCaseAnalyst] = useState("");
  const [isCreatingCase, setIsCreatingCase] = useState(false);

  const loadCases = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getCases(params);
      setCases(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCases();
  }, [search, statusFilter]);

  const handleSelectCase = async (id: string) => {
    try {
      const detail = await api.getCaseDetail(id);
      setSelectedCase(detail);
      setResolutionText(detail.resolution || "");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedCase || !newComment.trim()) return;
    try {
      await api.addCaseComment(selectedCase.id, newComment);
      setNewComment("");
      handleSelectCase(selectedCase.id);
    } catch (err) {
      alert("Error adding comment: " + err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedCase) return;
    setIsUpdatingStatus(true);
    try {
      await api.updateCaseStatus(selectedCase.id, status, resolutionText);
      handleSelectCase(selectedCase.id);
      loadCases();
    } catch (err) {
      alert("Error updating case: " + err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    setIsCreatingCase(true);
    try {
      await api.createCase({
        title: newCaseTitle.trim(),
        severity: newCaseSeverity,
        risk_score: parseInt(newCaseRiskScore) || 75,
        description: newCaseDescription.trim() || undefined,
        assigned_analyst: newCaseAnalyst.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setNewCaseTitle("");
      setNewCaseDescription("");
      setNewCaseAnalyst("");
      await loadCases();
    } catch (err: any) {
      alert("Error creating case: " + (err.message || err));
    } finally {
      setIsCreatingCase(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Briefcase className="w-5 h-5 text-[#ff6600]" />
            <span>Security Case Management</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {cases.length} Open &amp; Managed Cases
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Tracks investigation lifecycles, analyst collaboration, containment actions, and resolution history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open New Case</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search case ID (INC-ABC-001), title, or assigned analyst..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 font-sans focus:outline-none focus:border-[#ff6600]"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Investigating">Investigating</option>
          <option value="Pending">Pending</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Main Grid: Cases List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className={cn("card-cyber p-0 overflow-hidden bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl", selectedCase ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-5 font-bold">Case ID</th>
                  <th className="py-3.5 px-4 sm:px-5 font-bold">Title & Context</th>
                  <th className="py-3.5 px-4 sm:px-5 font-bold">Severity</th>
                  <th className="py-3.5 px-4 sm:px-5 font-bold">Assigned Analyst</th>
                  <th className="py-3.5 px-4 sm:px-5 font-bold">Status</th>
                  <th className="py-3.5 px-4 sm:px-5 font-bold">Updated</th>
                  <th className="py-3.5 px-4 text-right font-bold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Briefcase className="w-8 h-8 text-zinc-600" />
                        <p className="text-sm font-semibold text-zinc-400 font-sans">No security cases opened</p>
                        <p className="text-xs text-zinc-500 max-w-sm font-sans">
                          Use the &quot;Open New Case&quot; button or escalate a finding from the Findings triage workflow.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cases.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectCase(c.id)}
                      className={cn(
                        "hover:bg-zinc-900/60 cursor-pointer transition-colors",
                        selectedCase?.id === c.id ? "bg-orange-500/10 border-l-2 border-[#ff6600]" : ""
                      )}
                    >
                      <td className="py-3.5 px-4 sm:px-5 font-mono font-bold text-[#ff6600]">{c.case_ref}</td>
                      <td className="py-3.5 px-4 sm:px-5 max-w-sm">
                        <div className="font-semibold text-white">{c.title}</div>
                        <div className="text-[11px] text-zinc-400 line-clamp-1">{c.description}</div>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border",
                            c.severity === "Critical"
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          )}
                        >
                          {c.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-zinc-300">
                        <span className="flex items-center gap-1 font-medium font-mono text-xs">
                          <User className="w-3.5 h-3.5 text-zinc-500" />
                          {c.assigned_analyst || "Unassigned"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5">
                        <span
                          className={cn(
                            "text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border",
                            c.status === "Resolved"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : c.status === "Investigating"
                              ? "bg-orange-500/10 text-[#ff6600] border-orange-500/30"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          )}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-5 text-zinc-500 font-mono text-[11px]">{c.updated_at || c.created_at}</td>
                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCase(c.id);
                          }}
                          className="text-[#ff6600] hover:text-orange-400 font-mono text-xs font-semibold"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Case Detail Panel */}
        {selectedCase && (
          <div className="card-cyber p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2333]">
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 font-bold uppercase">
                  Case {selectedCase.case_ref}
                </span>
                <h2 className="text-sm font-bold text-slate-100 mt-1">{selectedCase.title}</h2>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800">
              {selectedCase.description}
            </p>

            {/* Status Workflow Controls */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold mb-1.5">
                Case Status Workflow:
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                {["Open", "Investigating", "Pending", "Resolved", "Closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(st)}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "py-1 px-2 rounded border text-center transition-colors",
                      selectedCase.status === st
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Textbox */}
            {selectedCase.status === "Resolved" || selectedCase.status === "Closed" ? (
              <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30 text-xs">
                <div className="font-mono text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolution Summary:</span>
                </div>
                <div className="text-slate-200 text-[11px] whitespace-pre-wrap">{selectedCase.resolution || "No formal resolution recorded."}</div>
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Containment / Resolution Notes</label>
                <textarea
                  rows={2}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Record patch deployment, credential revocation, or firewall rules..."
                  className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200"
                />
              </div>
            )}

            {/* Collaboration Comments */}
            <div className="space-y-2 pt-2 border-t border-[#1a2333]">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Analyst Collaboration Notes ({selectedCase.comments.length})</span>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {selectedCase.comments.map((comm) => (
                  <div key={comm.id} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span className="text-cyan-300 font-semibold">{comm.user_name}</span>
                      <span>{comm.created_at}</span>
                    </div>
                    <div className="text-slate-300 text-[11px]">{comm.comment}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add analyst note..."
                  className="flex-1 px-3 py-1.5 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleAddComment}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 active:scale-95"
                >
                  Post
                </button>
              </div>
            </div>

            {/* Audit History */}
            {selectedCase.audit_history?.length > 0 && (
              <div className="pt-2 border-t border-[#1a2333] space-y-1">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
                  <History className="w-3 h-3" /> Case Audit Trail
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto text-[10px] font-mono text-slate-400">
                  {selectedCase.audit_history.map((hist, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-800/40 py-0.5">
                      <span className="text-slate-300">{hist.action}</span>
                      <span className="text-slate-500">{hist.user}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Open New Case Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-cyber max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 bg-[#09090b] border-zinc-800 rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff6600]" />
                <h3 className="text-sm font-bold text-white font-sans">Open Security Incident Case</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Gateway Vulnerability Response"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Severity</label>
                  <select
                    value={newCaseSeverity}
                    onChange={(e) => setNewCaseSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Initial Risk Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCaseRiskScore}
                    onChange={(e) => setNewCaseRiskScore(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Assigned Lead Analyst</label>
                <input
                  type="text"
                  placeholder="e.g. sam@abc.com or Security Team"
                  value={newCaseAnalyst}
                  onChange={(e) => setNewCaseAnalyst(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Case Scope &amp; Description</label>
                <textarea
                  rows={3}
                  placeholder="Summary of incident scope, assets involved, or triage findings..."
                  value={newCaseDescription}
                  onChange={(e) => setNewCaseDescription(e.target.value)}
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
                  disabled={isCreatingCase}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95"
                >
                  {isCreatingCase ? "Opening Case..." : "Open Security Case"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

