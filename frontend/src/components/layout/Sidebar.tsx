"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Users,
  KeyRound,
  ShieldAlert,
  Gauge,
  Building2,
  FileSearch,
  Briefcase,
  BellRing,
  Cpu,
  Target,
  FileText,
  UserCheck,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExposureXLogoIcon } from "@/components/common/ExposureXLogo";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();

  const navGroups: NavGroup[] = [
    {
      group: "Overview",
      items: [
        { title: "Dashboard", href: "/", icon: LayoutDashboard },
      ],
    },
    {
      group: "Exposure",
      items: [
        { title: "Assets", href: "/exposure/assets", icon: Globe },
        { title: "Identities", href: "/exposure/identities", icon: Users },
        { title: "Credential Exposure", href: "/exposure/credentials", icon: KeyRound, badge: "Sanitized", badgeColor: "text-yellow-400 bg-yellow-950/60 border-yellow-800/40" },
        { title: "Vulnerabilities", href: "/exposure/vulnerabilities", icon: ShieldAlert, badge: "KEV", badgeColor: "text-red-400 bg-red-950/60 border-red-800/40" },
      ],
    },
    {
      group: "Risk",
      items: [
        { title: "Internal Risk", href: "/risk/internal", icon: Gauge },
        { title: "Third-Party Risk", href: "/risk/third-party", icon: Building2 },
      ],
    },
    {
      group: "Operations",
      items: [
        { title: "Findings", href: "/operations/findings", icon: FileSearch },
        { title: "Cases", href: "/operations/cases", icon: Briefcase },
        { title: "Security Pulse", href: "/operations/security-pulse", icon: BellRing, badge: "Live", badgeColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/40" },
      ],
    },
    {
      group: "Intelligence",
      items: [
        { title: "Providers", href: "/intelligence/providers", icon: Cpu },
        { title: "Approved Scope", href: "/admin/scope", icon: Target },
      ],
    },
    {
      group: "Administration",
      items: [
        { title: "User Management", href: "/admin/users", icon: UserCheck },
        { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-zinc-800/90 flex flex-col h-screen sticky top-0 z-30 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-zinc-800/90 gap-3 bg-zinc-950/60">
        <div className="relative flex items-center justify-center">
          <ExposureXLogoIcon className="w-8 h-8" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="text-sm font-bold tracking-wider text-white flex items-center gap-1.5 font-mono">
            Exposure<span className="text-[#ff6600] font-extrabold text-base">X</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
              CTEM
            </span>
          </div>
          <div className="text-[11px] uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1.5 font-medium">
            <span>Risk Intel</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              SECURE
            </span>
          </div>
        </div>
      </div>

      {/* Nav List with Minimal Clean Spacing */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((grp) => (
          <div key={grp.group}>
            <div className="px-3 mb-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600]"></span>
              <span className="text-zinc-300">{grp.group}</span>
            </div>
            <div className="space-y-1.5">
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out group relative overflow-hidden active:scale-[0.98]",
                      isActive
                        ? "bg-zinc-900 text-white border-l-2 border-[#ff6600] font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-all duration-200 ease-out group-hover:scale-110 shrink-0",
                          isActive
                            ? "text-[#ff6600]"
                            : "text-zinc-400 group-hover:text-white"
                        )}
                      />
                      <span className={cn(isActive ? "font-bold text-white" : "font-medium")}>
                        {item.title}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded border font-mono font-bold tracking-tight",
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Status Tag */}
      <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-zinc-300 text-xs font-semibold">Continuous Telemetry</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-[#ff6600] border border-zinc-800 font-bold">
            v2.1
          </span>
        </div>
      </div>
    </aside>
  );
}
