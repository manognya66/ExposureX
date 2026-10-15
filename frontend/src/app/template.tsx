"use client";

import React from "react";

/**
 * Root Template for Next.js App Router
 * Remounts on every route change, enabling a clean, smooth transition animation
 * between modules and operational views.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-module-fade w-full h-full min-h-0">
      {children}
    </div>
  );
}

