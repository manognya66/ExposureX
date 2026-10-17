"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, ShieldAlert, KeyRound, AlertTriangle, ExternalLink, CheckCheck, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { SecurityPulseEvent } from "@/lib/types";
import Link from "next/link";

interface PulseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SecurityPulseDrawer({ isOpen, onClose }: PulseDrawerProps) {
  const [notifications, setNotifications] = useState<SecurityPulseEvent[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications(unreadOnly);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, unreadOnly]);

  // Connect to live WebSocket for real-time alerts with resilient protocol handling
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        const wsProto = isSecure ? "wss:" : "ws:";
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const port = typeof window !== "undefined" ? window.location.port : "3000";
        
        // If accessed directly on 3000/3001, backend is on 8000. If via Nginx (port 80/443), ws is proxied on /ws/pulse
        const wsUrl = (port === "80" || port === "443" || !port)
          ? `${wsProto}//${typeof window !== "undefined" ? window.location.host : "localhost"}/ws/pulse`
          : `${wsProto}//${host}:8000/ws/pulse`;

        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === "SECURITY_PULSE_ALERT") {
              setNotifications((prev) => [
                {
                  id: parsed.id || String(Date.now()),
                  title: parsed.title,
                  message: parsed.message,
                  severity: parsed.severity,
                  event_type: "critical_exposure",
                  reasons: parsed.reasons || [],
                  action_url: parsed.action_url || "/operations/findings",
                  is_read: false,
                  timestamp: parsed.timestamp || new Date().toISOString(),
                },
                ...prev,
              ]);
            }
          } catch {
            // Ignored
          }
        };

        ws.onclose = () => {
          // Reconnect protocol: retry after 4 seconds
          reconnectTimeout = setTimeout(connectWs, 4000);
        };
      } catch (e) {
        // Fallback retry
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

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pulse-notifications-changed"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pulse-notifications-changed"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#0a0f1d] border-l border-[#1a2333] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1a2333] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-red-950/60 border border-red-500/40 text-red-400">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Security Pulse
                <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Real-Time Threat & Exposure Stream</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleMarkAllRead}
              title="Mark all as read"
              className="p-1.5 text-xs text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-2 border-b border-[#1a2333] flex items-center justify-between text-xs bg-[#080d1a]">
          <span className="text-slate-400 text-[11px] font-mono">
            {notifications.filter((n) => !n.is_read).length} unread alerts
          </span>
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`text-[11px] px-2 py-0.5 rounded font-mono border transition-colors ${
              unreadOnly
                ? "bg-cyan-950/60 border-cyan-700 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {unreadOnly ? "Showing Unread" : "Filter Unread"}
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="text-center py-10 text-xs text-slate-500">Loading pulse stream...</div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              No Security Pulse alerts recorded.
            </div>
          )}

          {notifications.map((n) => {
            const isCrit = n.severity?.toLowerCase() === "critical";
            const isHigh = n.severity?.toLowerCase() === "high";

            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`p-3.5 rounded-lg border transition-all text-xs ${
                  isCrit
                    ? "bg-red-950/20 border-red-500/40 hover:border-red-500/70"
                    : isHigh
                    ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                } ${!n.is_read ? "ring-1 ring-cyan-500/30" : "opacity-80"}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                      isCrit
                        ? "bg-red-500 text-white"
                        : isHigh
                        ? "bg-amber-500 text-slate-950"
                        : "bg-cyan-900 text-cyan-300"
                    }`}
                  >
                    {n.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                </div>

                <div className="font-semibold text-slate-100 text-xs mb-1">{n.title}</div>
                <p className="text-slate-300 text-[11px] leading-relaxed mb-2">{n.message}</p>

                {/* Reasons bullet points */}
                {n.reasons && n.reasons.length > 0 && (
                  <div className="bg-black/30 rounded p-2 mb-2 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 font-semibold">REASONS:</div>
                    {n.reasons.map((r, i) => (
                      <div key={i} className="text-[10px] text-slate-300 flex items-start gap-1">
                        <span className="text-cyan-400">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {n.action_url && (
                  <Link
                    href={n.action_url}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span>Investigate</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Real-time Event Broadcast Test */}
        <div className="p-3 border-t border-[#1a2333] bg-[#0f172a]">
          <button
            onClick={async () => {
              await api.triggerPulseAlert({
                title: "PERIMETER TELEMETRY ALERT",
                message: "Live telemetry broadcast: Continuous Threat Exposure Management signal transmitted.",
                severity: "High",
                event_type: "exposure_alert",
                reasons: [
                  "Active perimeter correlation alert",
                  "Real-time WebSocket protocol broadcast",
                ],
                action_url: "/operations/findings",
              });
              fetchNotes();
            }}
            className="w-full py-2 px-3 rounded bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Real-Time Pulse Broadcast</span>
          </button>
        </div>
      </div>
    </div>
  );
}

