"use client";

import React, { useState, useEffect } from "react";
import { Bell, Radio, ShieldAlert, KeyRound, ExternalLink, RefreshCw, CheckCheck, Flame } from "lucide-react";
import { api } from "@/lib/api";
import { SecurityPulseEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function SecurityPulsePage() {
  const [events, setEvents] = useState<SecurityPulseEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications(false);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

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
              setEvents((prev) => [
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
          reconnectTimeout = setTimeout(connectWs, 4000);
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

  const handleSimulateAlert = async () => {
    await api.triggerPulseAlert({
      title: "🚨 CRITICAL EXPOSURE DETECTED",
      message: "Perimeter asset exposure: Critical vulnerability correlates with exposed credentials in enterprise boundary.",
      severity: "Critical",
      event_type: "critical_exposure",
      reasons: [
        "Actively exploited vulnerability correlated in perimeter scan",
        "Correlated enterprise account exposure detected",
        "Critical boundary asset requiring mitigation",
      ],
      action_url: "/operations/findings",
    });
    loadEvents();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 font-sans">
            <Radio className="w-5 h-5 text-[#ff6600] animate-pulse" />
            <span>Security Pulse Real-Time Notification Stream</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Real-time WebSocket event broadcaster and prioritized alert telemetry for security analysts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSimulateAlert}
            className="text-xs px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Broadcast Test Alert</span>
          </button>
          <button
            onClick={async () => {
              await api.markAllNotificationsRead();
              loadEvents();
            }}
            className="text-xs px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 font-sans"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Events Stream List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="card-cyber p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 bg-[#09090b] border border-zinc-800 rounded-2xl">
            <Radio className="w-8 h-8 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-400 font-sans">No real-time security events recorded</p>
            <p className="text-xs text-zinc-500 max-w-sm font-sans">
              Live threat correlation alerts, critical exposure discoveries, and risk spikes will stream here via WebSockets in real time.
            </p>
          </div>
        ) : (
          events.map((e) => {
            const isCrit = e.severity?.toLowerCase() === "critical";
            const isHigh = e.severity?.toLowerCase() === "high";

            return (
              <div
                key={e.id}
                className={cn(
                  "p-5 rounded-2xl border transition-all text-xs bg-[#09090b] shadow-lg",
                  isCrit
                    ? "border-red-500/40 hover:border-red-500/70"
                    : isHigh
                    ? "border-amber-500/40 hover:border-amber-500/70"
                    : "border-zinc-800 hover:border-[#ff6600]/40"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded",
                        isCrit
                          ? "bg-red-500 text-white shadow-sm shadow-red-500/30"
                          : "bg-amber-500 text-slate-950"
                      )}
                    >
                      {e.severity}
                    </span>
                    <span className="font-semibold text-slate-100 text-sm">{e.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{e.timestamp}</span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed mb-3">{e.message}</p>

                {e.reasons && e.reasons.length > 0 && (
                  <div className="bg-black/40 rounded p-3 mb-3 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Contributing Reasons:</div>
                    {e.reasons.map((r, i) => (
                      <div key={i} className="text-[11px] text-slate-200 flex items-center gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}

                {e.action_url && (
                  <Link
                    href={e.action_url}
                    className="inline-flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    <span>Open Correlated Finding →</span>
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

