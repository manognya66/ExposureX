"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Search,
  Filter,
  Plus,
  Radio,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  User,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { Asset, AssetDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assetDetail, setAssetDetail] = useState<AssetDetail | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverScope, setDiscoverScope] = useState("");
  const [isDiscoverModalOpen, setIsDiscoverModalOpen] = useState(false);
  const [discoverResult, setDiscoverResult] = useState<any>(null);

  // Dynamic Add Asset state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState("Subdomain");
  const [newAssetDomain, setNewAssetDomain] = useState("abc.com");
  const [newAssetIp, setNewAssetIp] = useState("");
  const [newAssetPort, setNewAssetPort] = useState("443");
  const [newAssetTech, setNewAssetTech] = useState("");
  const [newAssetCriticality, setNewAssetCriticality] = useState("High");
  const [newAssetOwner, setNewAssetOwner] = useState("");
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const loadAssets = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.asset_type = typeFilter;
      if (criticalityFilter) params.business_criticality = criticalityFilter;
      const data = await api.getAssets(params);
      setAssets(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [search, typeFilter, criticalityFilter]);

  const handleSelectAsset = async (id: string) => {
    setSelectedAssetId(id);
    try {
      const detail = await api.getAssetDetail(id);
      setAssetDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    setDiscoverResult(null);
    try {
      const res = await api.discoverAssets(discoverScope);
      setDiscoverResult(res);
      loadAssets();
    } catch (err: any) {
      alert("Discovery Error: " + err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;
    setIsAddingAsset(true);
    try {
      await api.createAsset({
        name: newAssetName.trim(),
        asset_type: newAssetType,
        domain: newAssetDomain.trim() || undefined,
        ip: newAssetIp.trim() || undefined,
        port: newAssetPort ? parseInt(newAssetPort) : undefined,
        technology: newAssetTech.trim() || undefined,
        business_criticality: newAssetCriticality,
        owner: newAssetOwner.trim() || undefined,
      });
      setIsAddModalOpen(false);
      setNewAssetName("");
      setNewAssetIp("");
      setNewAssetTech("");
      setNewAssetOwner("");
      await loadAssets();
    } catch (err: any) {
      alert("Error adding asset: " + (err.message || err));
    } finally {
      setIsAddingAsset(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Globe className="w-5 h-5 text-[#ff6600]" />
            <span>Asset Inventory</span>
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-orange-500/10 border border-[#ff6600]/30 text-[#ff6600]">
              {assets.length} Active Targets
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Passive-first external asset inventory scoped strictly to approved organization boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
          <button
            onClick={() => setIsDiscoverModalOpen(true)}
            className="text-xs px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors font-sans flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>Run Scoped Discovery</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by name, domain, IP, or technology..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#0f172a] border border-[#1e293b] text-slate-300 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Asset Types</option>
          <option value="Domain">Domain</option>
          <option value="Subdomain">Subdomain</option>
          <option value="Host">Host</option>
          <option value="Web Application">Web Application</option>
          <option value="API Endpoint">API Endpoint</option>
          <option value="Certificate">Certificate</option>
        </select>

        <select
          value={criticalityFilter}
          onChange={(e) => setCriticalityFilter(e.target.value)}
          className="bg-[#0f172a] border border-[#1e293b] text-slate-300 text-xs rounded-md px-3 py-2 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Criticalities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Main Content Layout (Table + Detail Drawer/Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets Table */}
        <div className={cn("card-cyber p-0 overflow-hidden", selectedAssetId ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b14] border-b border-[#1a2333] text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Technology</th>
                  <th className="py-3 px-4">Criticality</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2333]/60">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono text-xs">
                      <Globe className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <div>No external assets recorded in inventory.</div>
                      <div className="text-[11px] text-slate-600 mt-1">Configure an approved scope boundary and run discovery, or add assets to begin.</div>
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const isSelected = selectedAssetId === asset.id;
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => handleSelectAsset(asset.id)}
                        className={cn(
                          "hover:bg-slate-900/60 cursor-pointer transition-colors",
                          isSelected ? "bg-cyan-950/30 border-l-2 border-cyan-400" : ""
                        )}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-cyan-300">
                          <div>{asset.name}</div>
                          {asset.ip && <div className="text-[10px] text-slate-500">{asset.ip}:{asset.port || 443}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{asset.asset_type}</td>
                        <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{asset.technology || "Standard TLS"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded font-semibold",
                              asset.business_criticality === "Critical"
                                ? "bg-red-950/60 text-red-400 border border-red-500/30"
                                : asset.business_criticality === "High"
                                ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800 text-slate-300"
                            )}
                          >
                            {asset.business_criticality}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "font-mono font-bold text-xs",
                              asset.risk_score >= 75
                                ? "text-red-400"
                                : asset.risk_score >= 50
                                ? "text-amber-400"
                                : "text-emerald-400"
                            )}
                          >
                            {asset.risk_score} / 100
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {asset.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAsset(asset.id);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-mono"
                          >
                            Analyze →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asset Detail & Correlation View (Section 32) */}
        {selectedAssetId && assetDetail && (
          <div className="card-cyber p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1a2333]">
              <div>
                <div className="text-xs uppercase font-mono text-cyan-400 font-semibold">Asset Correlation Detail</div>
                <h2 className="text-base font-bold text-slate-100 font-mono mt-0.5">{assetDetail.name}</h2>
              </div>
              <button
                onClick={() => setSelectedAssetId(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Criticality Summary */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-900/80 border border-[#1e293b]">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Calculated Risk</div>
                <div className="text-xl font-extrabold font-mono text-red-400">
                  {assetDetail.risk_score} <span className="text-xs font-normal text-slate-500">/ 100</span>
                </div>
                <div className="text-[10px] font-mono font-semibold text-red-400 uppercase">{assetDetail.risk_band}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400">Criticality</div>
                <div className="text-sm font-bold text-slate-200 mt-1">{assetDetail.business_criticality}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Owner: {assetDetail.owner || "SecOps"}</div>
              </div>
            </div>

            {/* Relationship Visualization (Section 32) */}
            <div>
              <div className="text-[11px] uppercase font-mono text-slate-400 font-semibold mb-2">
                Exposure Correlation Graph
              </div>
              <div className="p-3 rounded bg-black/40 border border-[#1e293b] space-y-2 text-xs">
                {/* Visual relationship flow */}
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-blue-300">
                    {assetDetail.associated_identities.length > 0
                      ? assetDetail.associated_identities[0].email
                      : "Identities mapped"}
                  </span>
                </div>
                <div className="pl-2 text-slate-600 text-xs">↓ Correlates with</div>
                <div className="flex items-center gap-2 text-slate-300">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span className="font-mono text-purple-300">
                    {assetDetail.credential_exposures.length > 0
                      ? `${assetDetail.credential_exposures[0].breach_title} (${assetDetail.credential_exposures.length} events)`
                      : "Zero credential leaks"}
                  </span>
                </div>
                <div className="pl-2 text-slate-600 text-xs">↓ Targets Perimeter Gateway</div>
                <div className="flex items-center gap-2 text-slate-100 font-semibold">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-cyan-300">{assetDetail.name}</span>
                </div>
                <div className="pl-2 text-slate-600 text-xs">↓ Vulnerable To</div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span className="font-mono text-red-400 font-semibold">
                    {assetDetail.vulnerabilities.length > 0
                      ? `${assetDetail.vulnerabilities[0].cve_id} (CVSS ${assetDetail.vulnerabilities[0].cvss_score})`
                      : "No active CVEs"}
                  </span>
                </div>
              </div>
            </div>

            {/* Explainable Risk Pillars */}
            {assetDetail.risk_breakdown && (
              <div>
                <div className="text-[11px] uppercase font-mono text-slate-400 font-semibold mb-2">
                  Risk Pillar Breakdown (Explainable)
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Exposure (30%)</span>
                    <span className="font-mono text-cyan-400">{assetDetail.risk_breakdown.pillars.exposure}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Vulnerability (25%)</span>
                    <span className="font-mono text-red-400">{assetDetail.risk_breakdown.pillars.vulnerability}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Credential Exposure (25%)</span>
                    <span className="font-mono text-purple-400">{assetDetail.risk_breakdown.pillars.credential_exposure}/100</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Business Impact (20%)</span>
                    <span className="font-mono text-amber-400">{assetDetail.risk_breakdown.pillars.business_impact}/100</span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 font-mono">
                  {assetDetail.risk_breakdown.formula}
                </div>
              </div>
            )}

            {/* Recommended Next Action */}
            {assetDetail.risk_breakdown?.recommended_action && (
              <div className="p-3 rounded bg-red-950/20 border border-red-500/30 text-xs">
                <div className="font-mono text-red-400 font-semibold mb-1">Recommended Action:</div>
                <pre className="text-slate-300 font-sans whitespace-pre-wrap text-[11px]">
                  {assetDetail.risk_breakdown.recommended_action}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scoped Discovery Modal */}
      {isDiscoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Run Passive Asset Discovery</h3>
              </div>
              <button onClick={() => setIsDiscoverModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Passive discovery queries authorized Certificate Transparency (crt.sh) and public DNS records.
              <span className="text-cyan-400 font-semibold ml-1">
                Strict scope validation ensures only approved domains (e.g. *.company.com) are scanned.
              </span>
            </p>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Target Organization Scope</label>
              <input
                type="text"
                value={discoverScope}
                onChange={(e) => setDiscoverScope(e.target.value)}
                placeholder="company.com"
                className="w-full px-3 py-2 bg-[#070b14] border border-[#1e293b] rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {discoverResult && (
              <div className="p-3 rounded bg-cyan-950/40 border border-cyan-800 text-xs text-cyan-300 font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Discovery Finished Successfully</span>
                </div>
                <div>Discovered: {discoverResult.total_discovered} assets</div>
                <div>New Assets Added: {discoverResult.new_assets_added}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => setIsDiscoverModalOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Close
              </button>
              <button
                onClick={handleRunDiscovery}
                disabled={isDiscovering}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95"
              >
                {isDiscovering ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Validating Scope & Scanning...</span>
                  </>
                ) : (
                  <span>Start Scoped Scan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dynamic Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="card-cyber max-w-lg w-full p-6 space-y-4 bg-[#09090b] border-zinc-800 rounded-2xl shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff6600]" />
                <h3 className="text-sm font-bold text-white font-sans">Add Perimeter Asset</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Asset Name / Hostname *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. portal.abc.com or api.abc.com"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Asset Type</label>
                  <select
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="Subdomain">Subdomain</option>
                    <option value="Domain">Domain</option>
                    <option value="Host">Host</option>
                    <option value="Web Application">Web Application</option>
                    <option value="API Endpoint">API Endpoint</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Domain (Scope)</label>
                  <input
                    type="text"
                    placeholder="abc.com"
                    value={newAssetDomain}
                    onChange={(e) => setNewAssetDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">IP Address</label>
                  <input
                    type="text"
                    placeholder="198.51.100.25"
                    value={newAssetIp}
                    onChange={(e) => setNewAssetIp(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Port</label>
                  <input
                    type="number"
                    placeholder="443"
                    value={newAssetPort}
                    onChange={(e) => setNewAssetPort(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-mono focus:outline-none focus:border-[#ff6600]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Technology Stack</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js, FortiOS, Nginx"
                    value={newAssetTech}
                    onChange={(e) => setNewAssetTech(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1 font-sans font-medium">Business Criticality</label>
                  <select
                    value={newAssetCriticality}
                    onChange={(e) => setNewAssetCriticality(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-zinc-800 rounded-xl text-white font-sans focus:outline-none focus:border-[#ff6600]"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1 font-sans font-medium">Owner / Team</label>
                <input
                  type="text"
                  placeholder="e.g. Platform Engineering or Network Ops"
                  value={newAssetOwner}
                  onChange={(e) => setNewAssetOwner(e.target.value)}
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
                  disabled={isAddingAsset}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95"
                >
                  {isAddingAsset ? "Adding Asset..." : "Save & Correlate Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

