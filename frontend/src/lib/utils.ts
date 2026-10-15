import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskColor(score: number) {
  if (score >= 75) return "text-cyber-red border-red-500/30 bg-red-500/10";
  if (score >= 50) return "text-cyber-amber border-amber-500/30 bg-amber-500/10";
  if (score >= 25) return "text-cyber-blue border-blue-500/30 bg-blue-500/10";
  return "text-cyber-emerald border-emerald-500/30 bg-emerald-500/10";
}

export function getSeverityBadge(sev: string) {
  switch (sev?.toLowerCase()) {
    case "critical":
      return "bg-red-500/20 text-red-400 border border-red-500/40";
    case "high":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
    case "moderate":
    case "medium":
      return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
    default:
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
  }
}

