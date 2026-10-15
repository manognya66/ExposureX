"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ExposureXLogoProps {
  className?: string;
  iconClassName?: string;
  withText?: boolean;
  subtitle?: string;
  indicator?: boolean;
}

export function ExposureXLogoIcon({
  className = "w-8 h-8",
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#18233a] via-[#0b101d] to-[#040711] p-1.5 border border-orange-500/40 shadow-lg shadow-orange-500/20 group hover:border-orange-500/80 transition-all",
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="expXGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff7700" />
            <stop offset="50%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#e63900" />
          </linearGradient>
          <filter id="expXGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Outer Corner Scanning / CTEM Reticle Brackets */}
        <path
          d="M5 10V6C5 5.44772 5.44772 5 6 5H10"
          stroke="#ff6600"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M22 5H26C26.5523 5 27 5.44772 27 6V10"
          stroke="#ff6600"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M27 22V26C27 26.5523 26.5523 27 26 27H22"
          stroke="#ff6600"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M10 27H6C5.44772 27 5 26.5523 5 26V22"
          stroke="#ff6600"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* Center Illuminated Exposure "X" Crosshairs */}
        <path
          d="M9.5 9.5L22.5 22.5M22.5 9.5L9.5 22.5"
          stroke="url(#expXGradient)"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#expXGlow)"
        />

        {/* Precision Target Core */}
        <circle
          cx="16"
          cy="16"
          r="4.5"
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="2 1.5"
          opacity="0.8"
        />
        <circle cx="16" cy="16" r="2" fill="#ffffff" />
      </svg>
    </div>
  );
}

export function ExposureXLogo({
  className,
  iconClassName = "w-8 h-8",
  withText = true,
  subtitle = "Risk Intelligence",
  indicator = false,
}: ExposureXLogoProps) {
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className="relative">
        <ExposureXLogoIcon className={iconClassName} />
        {indicator && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black"></span>
          </span>
        )}
      </div>
      {withText && (
        <div>
          <div className="text-base font-bold tracking-wider text-white flex items-center gap-1 font-mono">
            Exposure<span className="text-[#ff6600] font-extrabold text-lg leading-none">X</span>
          </div>
          <div className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-medium">
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}

