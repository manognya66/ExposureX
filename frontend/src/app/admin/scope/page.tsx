"use client";

import React, { useState, useEffect } from "react";
import { Target, CheckCircle2, XCircle, Plus, Search, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { api } from "@/lib/api";
import { ApprovedScopeItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ScopePage() {
  const [scopes, setScopes] = useState<ApprovedScopeItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Scope Form
  const [pattern, setPattern] = useState("");
  const [scopeType, setScopeType] = useState("Domain");
  const [description, setDescription] = useState("");

  // Interactive Scope Validator Tester
  const [testTarget, setTestTarget] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const loadScopes = async () => {
    try {
      const data = await api.getScopes();
      setScopes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadScopes();
  }, []);

  const handleAddScope = async () => {
    if (!pattern.trim()) return;
    try {
      await api.addScope({
        pattern,
        scope_type: scopeType,
        description,
      });
      setIsAddModalOpen(false);
      setPattern("");
      setDescription("");
      loadScopes();
    } catch (err: any) {
      alert("Error adding scope: " + err.message);
    }
  };

  const handleTestScope = async () => {
    if (!testTarget.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.validateScopeTarget(testTarget);
      setTestResult(res);
    } catch (err: any) {
      alert("Validation error: " + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Target className="w-5 h-5 text-[#ff6600]" />
            <span>Approved Organization Scope Boundaries</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {scopes.length} Defined Boundaries
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            ExposureX strictly restrains external discovery and correlation within explicitly approved scope patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Define Approved Scope</span>
          </button>
        </div>
      </div>

      {/* Interactive Scope Boundary Tester */}
      <div className="card-cyber p-6 space-y-4 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
              Scope Boundary Enforcement Tester
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">Continuous Boundary Guard</span>
        </div>

        <p className="text-xs text-zinc-400 font-sans">
          Verify whether a candidate domain, subdomain, or IP complies with approved organization policy or is strictly blocked.
        </p>

        <div className="flex gap-2.5">
          <input
            type="text"
            value={testTarget}
            onChange={(e) => setTestTarget(e.target.value)}
            placeholder="Try 'vpn.abc.com' or 'example-other-company.com'..."
            className="flex-1 px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff6600] transition-colors"
          />
          <button
            onClick={handleTestScope}
            disabled={isTesting}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#ff6600] hover:text-white font-mono text-xs rounded-xl font-bold transition-all active:scale-95"
          >
            {isTesting ? "Testing..." : "Test Target"}
          </button>
        </div>

        {testResult && (
          <div
            className={cn(
              "p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between animate-in fade-in",
              testResult.is_in_scope
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            )}
          >
            <div className="flex items-center gap-2">
              {testResult.is_in_scope ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
              <span>
                Target <strong>&quot;{testResult.target}&quot;</strong> is{" "}
                <span className="font-bold underline">{testResult.decision}</span>
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              {testResult.is_in_scope
                ? "Discovery & Correlation Authorized"
                : "Blocked — Target Outside Approved Boundaries"}
            </span>
          </div>
        )}
      </div>

      {/* Scope Table */}
      <div className="card-cyber p-0 overflow-x-auto bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Scope Pattern</th>
              <th className="py-3 px-4">Scope Type</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Approved By</th>
              <th className="py-3 px-4">Approved Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2333]/60">
            {scopes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Target className="w-8 h-8 text-zinc-600" />
                    <p className="text-sm font-semibold text-zinc-400 font-sans">No approved scope boundaries defined</p>
                    <p className="text-xs text-zinc-500 max-w-sm font-sans">
                      Use the &quot;Define Approved Scope&quot; button above to specify your organization&apos;s authorized domains, CIDRs, or IP addresses.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              scopes.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#ff6600]">{s.pattern}</td>
                  <td className="py-3 px-4 text-white font-medium">{s.scope_type}</td>
                  <td className="py-3 px-4 text-zinc-400">{s.description || "Authorized boundary"}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-300 font-mono text-[11px]">{s.approved_by || "CISO Office"}</td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">{s.created_at}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#ff6600]" />
                <h3 className="text-base font-bold text-white font-sans">Add Approved Scope Boundary</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">Scope Pattern *</label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. *.abc.com or 198.51.100.0/24"
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#ff6600] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">Scope Type</label>
              <select
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white font-sans focus:outline-none focus:border-[#ff6600] transition-colors"
              >
                <option value="Domain">Domain</option>
                <option value="Wildcard">Wildcard Domain</option>
                <option value="CIDR">CIDR Network Block</option>
                <option value="IP">Static IP</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">Authorization Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Approved by Security Architecture Committee"
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-xs text-white font-sans focus:outline-none focus:border-[#ff6600] transition-colors"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 font-sans transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScope}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md shadow-orange-500/25 active:scale-95"
              >
                Authorize Scope
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

