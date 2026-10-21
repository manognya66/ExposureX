"use client";

import React, { useState, useEffect } from "react";
import { Users, UserCheck, Upload, Plus, Search, Shield, KeyRound, AlertCircle, CheckCircle2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Identity } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function IdentitiesPage() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [search, setSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [privilegedFilter, setPrivilegedFilter] = useState("");
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Dynamic Add Identity state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newAccountType, setNewAccountType] = useState("Employee");
  const [newIsPrivileged, setNewIsPrivileged] = useState(false);
  const [newCriticality, setNewCriticality] = useState("High");
  const [isAddingIdentity, setIsAddingIdentity] = useState(false);

  const loadIdentities = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (accountTypeFilter) params.account_type = accountTypeFilter;
      if (privilegedFilter) params.is_privileged = privilegedFilter;
      const data = await api.getIdentities(params);
      setIdentities(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadIdentities();
  }, [search, accountTypeFilter, privilegedFilter]);

  const handleAddIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setIsAddingIdentity(true);
    try {
      await api.createIdentity({
        email: newEmail.trim(),
        username: newUsername.trim() || newEmail.split("@")[0],
        department: newDepartment.trim() || "General",
        role: newRole.trim() || "Staff Member",
        account_type: newAccountType,
        is_privileged: newIsPrivileged,
        business_criticality: newCriticality,
      });
      setIsAddModalOpen(false);
      setNewEmail("");
      setNewUsername("");
      setNewDepartment("");
      setNewRole("");
      setNewIsPrivileged(false);
      await loadIdentities();
    } catch (err: any) {
      alert("Error adding identity: " + (err.message || err));
    } finally {
      setIsAddingIdentity(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await api.importCsv(csvFile);
      setImportResult(res);
      loadIdentities();
    } catch (err: any) {
      alert("Import error: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Users className="w-5 h-5 text-[#ff6600]" />
            <span>Identity Context & Exposure</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {identities.length} Identities
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Correlates employees, service accounts, and privileged administrators with credential exposure telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Identity</span>
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors font-sans flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>Import Identities CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search email, username, role or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={accountTypeFilter}
          onChange={(e) => setAccountTypeFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 font-sans focus:outline-none focus:border-[#ff6600]"
        >
          <option value="">All Account Types</option>
          <option value="Employee">Employee</option>
          <option value="Privileged account">Privileged account</option>
          <option value="Service account">Service account</option>
          <option value="Contractor">Contractor</option>
        </select>

        <select
          value={privilegedFilter}
          onChange={(e) => setPrivilegedFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 font-sans focus:outline-none focus:border-[#ff6600]"
        >
          <option value="">Privileged Status</option>
          <option value="true">Privileged Only</option>
          <option value="false">Standard Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-cyber p-0 overflow-x-auto bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs min-w-[1100px]">
          <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Identity / Email</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Role / Department</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Account Type</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Privilege</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Credential Leaks</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Risk Score</th>
              <th className="py-3.5 px-4 sm:px-5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a2333]/60">
            {identities.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">No identities enrolled in directory</p>
                    <p className="text-xs text-slate-600 max-w-sm">
                      Use the &quot;Import Directory CSV&quot; button above to synchronize corporate identity records, email domains, and roles.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              identities.map((i) => (
                <tr key={i.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="font-mono text-slate-100 font-medium">{i.email}</div>
                    <div className="text-[10px] text-slate-500">{i.username}</div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="text-slate-200">{i.role || "Staff"}</div>
                    <div className="text-[10px] text-slate-400">{i.department}</div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-5 text-slate-300">{i.account_type}</td>
                  <td className="py-3.5 px-4 sm:px-5">
                    {i.is_privileged ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-red-950/60 text-red-400 border border-red-500/40">
                        PRIVILEGED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">Standard</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-5">
                    {i.credential_exposure_count > 0 ? (
                      <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                        {i.credential_exposure_count} events
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">0 detected</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 sm:px-5">
                    <span
                      className={cn(
                        "font-mono font-bold text-xs",
                        i.risk_score >= 75
                          ? "text-red-400"
                          : i.risk_score >= 50
                          ? "text-amber-400"
                          : "text-emerald-400"
                      )}
                    >
                      {i.risk_score} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 sm:px-5">
                    <span className="text-[10px] text-emerald-400 font-mono">{i.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">Import Identities via CSV</h3>
              </div>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload employee directory export (Entra ID, Okta, or HR CSV). Requires columns:{" "}
              <code className="text-cyan-400 font-mono">email, role, department, is_privileged</code>.
            </p>

            <div className="border-2 border-dashed border-[#1e293b] rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-950 file:text-blue-300 hover:file:bg-blue-900"
              />
              {csvFile && <div className="mt-2 text-xs font-mono text-cyan-300">Selected: {csvFile.name}</div>}
            </div>

            {importResult && (
              <div className="p-3 rounded bg-blue-950/40 border border-blue-800 text-xs text-blue-300 font-mono space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Import Completed</span>
                </div>
                <div>Imported: {importResult.imported_count} identities</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile || isImporting}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
              >
                {isImporting ? "Processing CSV..." : "Upload & Ingest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dynamic Identity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-cyber max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 bg-[#09090b] border-zinc-800 rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff6600]" />
                <h3 className="text-sm font-bold text-white font-sans">Add Corporate Identity</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIdentity} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. employee@abc.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Full Name / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex DevOps"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. DevOps & Cloud"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Role / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior DevOps Lead"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Account Type</label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Privileged account">Privileged account</option>
                    <option value="Service account">Service account</option>
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center pt-1">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Business Criticality</label>
                  <select
                    value={newCriticality}
                    onChange={(e) => setNewCriticality(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isPriv"
                    checked={newIsPrivileged}
                    onChange={(e) => setNewIsPrivileged(e.target.checked)}
                    className="w-4 h-4 rounded bg-black border-zinc-700 text-[#ff6600] focus:ring-[#ff6600] cursor-pointer"
                  />
                  <label htmlFor="isPriv" className="text-zinc-300 text-xs font-sans font-medium cursor-pointer">
                    Privileged Administrator
                  </label>
                </div>
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
                  disabled={isAddingIdentity}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95"
                >
                  {isAddingIdentity ? "Adding Identity..." : "Save Identity Context"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

