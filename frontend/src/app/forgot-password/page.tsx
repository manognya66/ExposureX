"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Shield,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { ExposureXLogo } from "@/components/common/ExposureXLogo";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1); // 1: request code, 2: reset password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDone, setIsDone] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.forgotPassword({ email: email.trim().toLowerCase() });
      setSuccess(res.message || "Password recovery code generated successfully.");
      if (res.preview_code) {
        setCode(res.preview_code);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to generate password recovery code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.resetPassword({
        email: email.trim().toLowerCase(),
        reset_code: code.trim(),
        new_password: newPassword,
      });
      setSuccess(res.message || "Password reset successfully!");
      setIsDone(true);
    } catch (err: any) {
      setError(err.message || "Password reset failed. Please check your verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-white flex flex-col selection:bg-orange-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="bg-[#070d1e]/90 backdrop-blur-md border-b border-[#182852] px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ExposureXLogo />
        </Link>

        <Link
          href="/"
          className="text-xs px-3.5 py-1.5 rounded-xl bg-[#0d1733] hover:bg-[#182852] text-slate-200 font-semibold transition-colors flex items-center gap-1.5 border border-[#182852]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          <span>Return to Sign In</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0d1733]/95 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-[#182852]">
            <div className="w-10 h-10 rounded-xl bg-orange-950/60 border border-orange-700/60 flex items-center justify-center text-orange-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Forgot Password</h1>
              <p className="text-xs text-slate-300">Reset your ExposureX enterprise credentials</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {isDone ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-200">
                Your password has been securely reset. You can now access your CTEM workspace with your new password.
              </p>
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your work email address associated with your ExposureX account to receive an authorization code.
              </p>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Registered Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@company.com"
                  className="w-full px-3.5 py-2.5 bg-[#070d1e] border border-[#182852] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Requesting Code...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Recovery Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    Verification Code
                  </label>
                  {code && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                      Code Loaded: {code}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6-digit code (e.g., 492014)"
                  className="w-full px-3.5 py-2.5 bg-[#070d1e] border border-[#182852] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    New Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 bg-[#070d1e] border border-[#182852] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 font-mono pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-[10px] text-slate-400 hover:text-white font-mono px-1 py-0.5 flex items-center gap-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-orange-400" />
                        <span>HIDE</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>SHOW</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 bg-[#070d1e] border border-[#182852] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2.5 px-3.5 rounded-xl bg-[#070d1e] hover:bg-[#122045] border border-[#182852] text-slate-300 font-medium text-xs transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm &amp; Update Password</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-[#182852] text-center">
            <Link
              href="/"
              className="text-xs text-orange-400 hover:text-orange-300 font-mono flex items-center justify-center gap-1.5 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
