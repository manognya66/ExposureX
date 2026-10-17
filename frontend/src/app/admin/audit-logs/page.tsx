"use client";

import React, { useState, useEffect } from "react";
import { FileText, Search, Filter, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { AuditLogItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const loadLogs = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      const data = await api.getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, actionFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <FileText className="w-5 h-5 text-[#ff6600]" />
            <span>Compliance & Security Audit Trail</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {logs.length} Immutable Log Entries
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Tamper-evident audit logs capturing logins, asset modifications, scope approvals, and risk triage actions.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, target object, or user email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-black border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#ff6600] font-sans"
        >
          <option value="">All Actions</option>
          <option value="LOGIN">LOGIN</option>
          <option value="ASSET_CREATE">ASSET_CREATE</option>
          <option value="SCOPE_ADD">SCOPE_ADD</option>
          <option value="CASE_CREATE">CASE_CREATE</option>
          <option value="FINDING_STATUS_CHANGE">FINDING_STATUS_CHANGE</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card-cyber p-0 overflow-x-auto bg-[#09090b] border border-zinc-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs min-w-[850px]">
          <thead className="bg-black border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
            <tr>
              <th className="py-3.5 px-4 font-bold">Timestamp (UTC)</th>
              <th className="py-3.5 px-4 font-bold">User</th>
              <th className="py-3.5 px-4 font-bold">Action</th>
              <th className="py-3.5 px-4 font-bold">Target Object</th>
              <th className="py-3.5 px-4 font-bold">Prior / New Value</th>
              <th className="py-3.5 px-4 font-bold">IP Address</th>
              <th className="py-3.5 px-4 font-bold">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-zinc-600" />
                    <p className="text-sm font-semibold text-zinc-400 font-sans">No audit events logged</p>
                    <p className="text-xs text-zinc-500 max-w-sm font-sans">
                      All administrative changes, role adjustments, scope alterations, and security actions will be recorded in this tamper-evident audit log.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">{l.timestamp}</td>
                  <td className="py-3 px-4 font-mono text-white font-medium">{l.user}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white font-medium">{l.object}</td>
                  <td className="py-3 px-4 text-zinc-400 text-[11px] max-w-xs truncate font-mono">
                    {l.new_value || l.previous_value || "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">{l.ip_address}</td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border",
                        l.result === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      )}
                    >
                      {l.result}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

