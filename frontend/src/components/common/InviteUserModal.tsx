"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Copy,
  Check,
  Building2,
  Shield,
  AlertCircle,
  X,
  Mail,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteUserModal({ isOpen, onClose }: InviteUserModalProps) {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("Security Analyst");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<{
    url: string;
    token: string;
    companyName: string;
    allowedDomain: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const companyDomain = user?.email && user.email.includes("@")
    ? user.email.split("@")[1].toLowerCase()
    : "company.com";

  // Auto-generate a default company invite link on modal open if not already generated
  useEffect(() => {
    if (isOpen && !generatedInvite) {
      handleGenerateInvite();
    }
    if (!isOpen) {
      setError("");
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerateInvite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate email domain if user typed an email
    if (inviteEmail.trim()) {
      const emailDomain = inviteEmail.trim().split("@")[1]?.toLowerCase();
      if (!emailDomain || (emailDomain !== companyDomain && !emailDomain.endsWith(`.${companyDomain}`))) {
        setError(`Colleague must have an email from your company (@${companyDomain}).`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await api.createInvite({
        invited_email: inviteEmail.trim() || undefined,
        role: selectedRole,
      });

      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const fullUrl = `${origin}${res.invite_url}`;

      setGeneratedInvite({
        url: fullUrl,
        token: res.invite_token,
        companyName: res.company_name,
        allowedDomain: res.allowed_domain,
        expiresAt: res.expires_at,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to generate company invite link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedInvite?.url) return;
    navigator.clipboard.writeText(generatedInvite.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[#ff6600] shadow-sm shadow-orange-500/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Invite Team Member</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold">
                Same Company Only
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Generate an exclusive invite link for colleagues from your company
            </p>
          </div>
        </div>

        {/* Company Domain Scope Policy Banner */}
        <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              Company Domain:
            </span>
            <span className="text-white font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              @{companyDomain}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 font-sans">
            Only users with an authorized <strong className="text-white font-mono">@{companyDomain}</strong> work email can sign in or register through this invite URL.
          </p>
        </div>

        {/* Optional Specific Email & Role */}
        <form onSubmit={handleGenerateInvite} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-zinc-300 block mb-1">
                Colleague Work Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder={`colleague@${companyDomain}`}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-300 block mb-1">
                Assigned Platform Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#ff6600]"
              >
                <option value="Security Analyst">Security Analyst</option>
                <option value="Viewer">Viewer</option>
                <option value="Auditor">Auditor</option>
                <option value="Risk Manager">Risk Manager</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-[#ff6600]" />
              <span>Regenerate Link</span>
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800/80 rounded-xl flex items-center gap-2 text-xs text-red-300 font-mono animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generated Invite URL Box */}
        {generatedInvite && (
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-zinc-300 flex items-center justify-between">
              <span>Shareable Company Invite URL:</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                Valid for 7 days
              </span>
            </label>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedInvite.url}
                className="flex-1 px-3 py-2 bg-black border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm",
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-[#ff6600] hover:bg-[#e65c00] text-white active:scale-95"
                )}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-mono">
            Company: <strong className="text-white">{generatedInvite?.companyName || "Enterprise"}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

