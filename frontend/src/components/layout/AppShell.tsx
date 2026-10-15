"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LandingPage } from "@/components/landing/LandingPage";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black dark:bg-black light:bg-slate-50 text-[#ff6600] font-mono text-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#ff6600] border-t-white rounded-full animate-spin shadow-lg shadow-orange-500/20" />
          <span className="tracking-widest text-zinc-400 font-bold text-xs uppercase">Initializing Security Workspace...</span>
        </div>
      </div>
    );
  }

  // If user is unauthenticated, show the Landing Page with integrated Sign In
  if (!user) {
    return <LandingPage />;
  }

  // Once authenticated, provide full operational workspace with generous, free-flowing spacing
  return (
    <div className="flex h-screen w-full overflow-hidden min-w-0 bg-black dark:bg-[#000000] light:bg-[#f8fafc] text-white light:text-slate-900 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 lg:p-12 bg-black dark:bg-[#000000] light:bg-[#f8fafc] text-white light:text-slate-900 transition-colors duration-200">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
