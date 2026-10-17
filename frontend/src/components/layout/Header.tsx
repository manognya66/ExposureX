"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  LogOut,
  User,
  Shield,
  Sun,
  Moon,
  UserPlus,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { useSidebar } from "./SidebarContext";
import { GlobalSearchModal } from "../common/GlobalSearchModal";
import { SecurityPulseDrawer } from "../common/SecurityPulseDrawer";
import { InviteUserModal } from "../common/InviteUserModal";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, logout } = useAuth();
  const { toggleMobile } = useSidebar();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPulseOpen, setIsPulseOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Theme switch state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Real-time notifications count
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasLiveAlert, setHasLiveAlert] = useState<boolean>(false);

  useEffect(() => {
    // Initialize Theme
    const savedTheme = (typeof window !== "undefined"
      ? localStorage.getItem("exposurex_theme")
      : null) as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    if (initialTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }

    // Load initial unread count
    fetchUnreadCount();

    // Listen for custom event from drawer mark-read
    const handleSync = () => fetchUnreadCount();
    window.addEventListener("pulse-notifications-changed", handleSync);

    return () => {
      window.removeEventListener("pulse-notifications-changed", handleSync);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getNotifications(true);
      setUnreadCount(data.length);
    } catch {
      // Ignore if unauthenticated
    }
  };

  // Real-time WebSocket listener for live notifications
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        const wsProto = isSecure ? "wss:" : "ws:";
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const port = typeof window !== "undefined" ? window.location.port : "3000";

        const wsUrl = (port === "80" || port === "443" || !port)
          ? `${wsProto}//${typeof window !== "undefined" ? window.location.host : "localhost"}/ws/pulse`
          : `${wsProto}//${host}:8000/ws/pulse`;

        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "SECURITY_PULSE_ALERT") {
              setUnreadCount((prev) => prev + 1);
              setHasLiveAlert(true);
            }
          } catch {
            // Ignored
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 5000);
        };
      } catch {
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("exposurex_theme", next);
    if (next === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "Administrator":
        return "bg-orange-950/60 text-orange-400 border-orange-500/40";
      case "Security Analyst":
        return "bg-blue-950/60 text-blue-400 border-blue-500/40";
      case "Risk Manager":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-800";
      case "Auditor":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <>
      <header className="h-16 bg-[#09090b]/90 backdrop-blur-xl border-b border-zinc-800/90 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-all shadow-sm">
        {/* Left: Mobile Menu, Brand Icon, Tagline & Search */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Hamburger toggle for mobile & tablet (< lg) */}
          <button
            onClick={toggleMobile}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white lg:hidden transition-colors active:scale-95 shrink-0"
            aria-label="Toggle navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Tagline */}
          <div className="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-white shadow-sm shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#ff6600] animate-pulse" />
            <span className="font-semibold tracking-wider">SEE EXPOSURE. REDUCE RISK. STAY AHEAD.</span>
          </div>

          {/* Responsive Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-[#ff6600]/50 text-zinc-300 hover:text-white text-xs sm:text-sm transition-all w-auto sm:w-60 md:w-72 lg:w-80 text-left group shrink min-w-0"
            title="Global Search"
          >
            <Search className="w-4 h-4 text-zinc-400 group-hover:text-[#ff6600] shrink-0 transition-colors" />
            <span className="hidden sm:inline truncate">Search Assets, CVEs, Leaks...</span>
            <span className="sm:hidden text-xs text-zinc-400">Search</span>
          </button>
        </div>

        {/* Right: Invite Button, Theme Switcher, Notifications & User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Invite User URL Generator Button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/60 text-[#ff6600] hover:text-orange-400 text-xs font-mono font-bold transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="Invite colleagues from your company (@domain)"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Invite Colleague</span>
          </button>

          {/* Light and Dark Theme Switch */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/50 text-zinc-200 transition-all hover:scale-105 active:scale-95"
            title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-[#ff6600] transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-300 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Real-time Security Pulse Notification Bell */}
          <button
            onClick={() => {
              setIsPulseOpen(true);
              setHasLiveAlert(false);
            }}
            className={cn(
              "relative p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-[#ff6600] transition-all hover:scale-105 active:scale-95",
              hasLiveAlert && "border-orange-500/80 glow-orange"
            )}
            title="Open Security Pulse (Real-Time Live Telemetry)"
            aria-label="Security notifications"
          >
            <Bell className={cn("w-4 h-4 text-zinc-300", hasLiveAlert && "text-[#ff6600] animate-bounce")} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#ff6600] text-[10px] font-extrabold text-white shadow-md shadow-orange-500/50 animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile & Sign Out Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/50 transition-all text-sm text-left group"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#ff6600] border border-white/20 flex items-center justify-center text-sm font-bold text-white font-mono shadow-sm">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-black"></span>
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-white text-sm leading-none">
                  {user?.full_name || "Security Analyst"}
                </div>
                <div className="text-xs text-[#ff6600] font-mono leading-none mt-1">
                  {user?.role || "Administrator"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-[#ff6600] transition-colors" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3.5 py-2.5 border-b border-zinc-800">
                  <div className="text-xs font-bold text-white">{user?.full_name}</div>
                  <div className="text-xs font-mono text-zinc-400 truncate mt-0.5">{user?.email}</div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold", getRoleBadgeColor(user?.role))}>
                      {user?.role}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 ml-auto font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Authorized
                    </span>
                  </div>
                </div>

                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsInviteModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-colors font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>Invite Team Member</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-950/40 rounded-lg flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out of ExposureX</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Security Pulse Drawer */}
      <SecurityPulseDrawer isOpen={isPulseOpen} onClose={() => setIsPulseOpen(false)} />

      {/* Company User Invite Modal */}
      <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </>
  );
}
