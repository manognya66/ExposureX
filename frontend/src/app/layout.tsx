import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ExposureX — Continuous Exposure Management & Risk Intelligence",
  description: "SEE EXPOSURE. REDUCE RISK. STAY AHEAD. Standalone enterprise exposure intelligence, correlation, and explainable risk management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-black text-white antialiased min-h-screen selection:bg-[#ff6600] selection:text-white transition-colors duration-200">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
