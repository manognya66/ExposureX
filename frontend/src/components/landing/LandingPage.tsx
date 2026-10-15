"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Shield,
  ShieldAlert,
  Globe,
  KeyRound,
  Users,
  Cpu,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  BellRing,
  Building2,
  Sparkles,
  Layers,
  Activity,
  Terminal,
  UserPlus,
  Key,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Gauge,
  Scale,
  Calculator,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ExposureXLogo } from "@/components/common/ExposureXLogo";

// Official Branded SSO Icons
function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function MicrosoftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M12 1h10v10H12z" />
      <path fill="#05a6f0" d="M1 12h10v10H1z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function LandingPage() {
  const { login, setAuthSession } = useAuth();

  // Auth modes: 'signin' | 'signup' | 'mfa' | 'forgot'
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "mfa" | "forgot">("signin");

  // Sign In states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signInError, setSignInError] = useState("");
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Sign Up states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState("");

  // SSO states
  const [isSsoLoading, setIsSsoLoading] = useState<string | null>(null);
  const [ssoError, setSsoError] = useState("");
  const [registeredDomains, setRegisteredDomains] = useState<string[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{
    companyName: string;
    allowedDomain: string;
    invitedBy: string;
    invitedEmail?: string;
  } | null>(null);

  const [ssoModal, setSsoModal] = useState<{
    isOpen: boolean;
    provider: "google" | "microsoft";
    email: string;
    name: string;
  }>({
    isOpen: false,
    provider: "google",
    email: "",
    name: "",
  });

  useEffect(() => {
    // Read ?invite=<token> from URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const inv = params.get("invite");
      if (inv) {
        setInviteToken(inv);
        api.getInviteDetails(inv)
          .then((res: any) => {
            if (res && res.valid) {
              setInviteDetails({
                companyName: res.company_name,
                allowedDomain: res.allowed_domain,
                invitedBy: res.invited_by,
                invitedEmail: res.invited_email,
              });
              if (res.invited_email) {
                setEmail(res.invited_email);
                setSignupEmail(res.invited_email);
              }
            }
          })
          .catch(() => {});
      }
    }

    api.getSsoDomains()
      .then((res: any) => {
        if (res && Array.isArray(res.registered_domains)) {
          setRegisteredDomains(res.registered_domains);
        }
      })
      .catch(() => {});
  }, []);

  // Forgot Password states
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<number>(1);
  const [forgotSimulatedCode, setForgotSimulatedCode] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // MFA states
  const [mfaUserId, setMfaUserId] = useState("");
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [simulatedMfaCode, setSimulatedMfaCode] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [mfaError, setMfaError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setSignInError("Please enter both email and password.");
      return;
    }
    setIsSubmitting(true);
    setSignInError("");
    setIsAccountNotFound(false);

    try {
      const res = await login(email.trim(), password);
      if (res && res.mfa_required) {
        setMfaUserId(res.user_id);
        setMfaEmail(res.email);
        setSimulatedMfaCode(res.mfa_temp_code || "");
        setAuthMode("mfa");
      }
    } catch (err: any) {
      const msg = err.message || "Invalid credentials.";
      if (msg.includes("ACCOUNT_NOT_FOUND") || msg.toLowerCase().includes("no account registered")) {
        setIsAccountNotFound(true);
        setSignInError("No account registered with this email. Please sign up to create your account.");
      } else {
        setSignInError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = (
    role: "Administrator" | "Security Analyst" | "Risk Manager" | "Viewer" | "Auditor" = "Administrator"
  ) => {
    const demoEmail = email.trim() || "sam@abc.com";
    const namePart = demoEmail.split("@")[0].replace(".", " ");
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    setAuthSession("demo-token-preview-session", {
      id: "usr-demo-admin",
      email: demoEmail,
      full_name: `${formattedName} (Demo Analyst)`,
      role: role,
      is_active: true,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim()) {
      setSignupError("Please provide your work email and password.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }
    setIsSigningUp(true);
    setSignupError("");

    try {
      const res = await api.signup({
        email: signupEmail.trim(),
        password: signupPassword,
        invite_token: inviteToken || undefined,
      });

      setMfaUserId(res.user_id);
      setMfaEmail(res.email);
      setSimulatedMfaCode(res.mfa_temp_code || "");
      setMfaCode(res.mfa_temp_code || "");
      setAuthMode("mfa");
    } catch (err: any) {
      setSignupError(err.message || "Sign up failed. Please try again.");
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || mfaCode.trim().length !== 6) {
      setMfaError("Please enter a valid 6-digit MFA verification code.");
      return;
    }
    setIsVerifyingMfa(true);
    setMfaError("");

    try {
      const res = await api.verifyMfa({
        user_id: mfaUserId,
        code: mfaCode.trim(),
      });

      setAuthSession(res.access_token, {
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        is_active: true,
      });
    } catch (err: any) {
      setMfaError(err.message || "Invalid MFA code. Please verify and try again.");
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const switchToSignUpWithEmail = () => {
    setSignupEmail(email);
    setAuthMode("signup");
    setSignInError("");
    setIsAccountNotFound(false);
  };

  const triggerSso = (provider: "google" | "microsoft") => {
    setSsoError("");
    const candidateEmail = (email || signupEmail).trim();
    if (candidateEmail && candidateEmail.includes("@")) {
      handleSsoExecute(provider, candidateEmail, candidateEmail.split("@")[0]);
    } else {
      setSsoModal({
        isOpen: true,
        provider,
        email: candidateEmail || (inviteDetails?.allowedDomain ? `analyst@${inviteDetails.allowedDomain}` : "sam@abc.com"),
        name: candidateEmail ? candidateEmail.split("@")[0].replace(".", " ") : "Enterprise Analyst",
      });
    }
  };

  const handleSsoExecute = async (
    provider: "google" | "microsoft",
    emailToUse: string,
    nameToUse: string
  ) => {
    setIsSsoLoading(provider);
    setSignInError("");
    setSignupError("");
    setSsoError("");
    try {
      const res = await api.ssoLogin({
        provider,
        email: emailToUse.trim(),
        full_name: nameToUse.trim() || undefined,
        invite_token: inviteToken || undefined,
      });
      setAuthSession(res.access_token, {
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        is_active: true,
      });
      setSsoModal({ isOpen: false, provider: "google", email: "", name: "" });
      setSsoError("");
    } catch (err: any) {
      const msg = err.message || `${provider} authentication failed.`;
      setSsoError(msg);
      if (authMode === "signup") setSignupError(msg);
      else setSignInError(msg);

      setSsoModal({
        isOpen: true,
        provider,
        email: emailToUse,
        name: nameToUse,
      });
    } finally {
      setIsSsoLoading(null);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered work email.");
      return;
    }
    setIsForgotSubmitting(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const res = await api.forgotPassword({ email: forgotEmail.trim() });
      setForgotStep(2);
      setForgotSimulatedCode(res.reset_code_simulated || "");
      if (res.reset_code_simulated) {
        setForgotCode(res.reset_code_simulated);
      }
      setForgotSuccess("Verification code generated. Please set your new password.");
    } catch (err: any) {
      setForgotError(err.message || "Failed to process password reset request.");
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleResetPasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    setIsForgotSubmitting(true);
    setForgotError("");
    try {
      await api.resetPassword({
        email: forgotEmail.trim(),
        reset_code: forgotCode.trim(),
        new_password: forgotNewPassword,
      });
      setForgotSuccess("Password reset successfully! You may now sign in.");
      setEmail(forgotEmail.trim());
      setTimeout(() => {
        setAuthMode("signin");
        setSignInError("");
        setForgotSuccess("");
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || "Password reset failed. Please check your verification code.");
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-white font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#070d1e]/90 backdrop-blur-md border-b border-[#1a2333] px-6 lg:px-12 h-16 flex items-center justify-between">
        <div className="flex-1 flex items-center justify-start">
          <ExposureXLogo />
        </div>

        <nav className="hidden md:flex items-center justify-center gap-6 text-xs text-slate-400 font-mono shrink-0">
          <a href="#features" className="hover:text-cyan-400 transition-colors">Core Capabilities</a>
          <a href="#workflow" className="hover:text-cyan-400 transition-colors">CTEM Workflow</a>
          <a href="#pillars" className="hover:text-cyan-400 transition-colors">Explainable Risk</a>
          <a href="#governance" className="hover:text-cyan-400 transition-colors">Scope Boundaries</a>
        </nav>

        <div className="flex-1 flex items-center justify-end">
          {authMode !== "signin" ? (
            <button
              onClick={() => {
                setAuthMode("signin");
                setSignInError("");
                setIsAccountNotFound(false);
              }}
              className="text-xs px-4 py-2 w-[148px] justify-center rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 font-semibold transition-colors flex items-center gap-2 border border-[#1e293b] shadow-sm whitespace-nowrap active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap font-medium">Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMode("signup");
                setSignupError("");
              }}
              className="text-xs px-4 py-2 w-[148px] justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center gap-2 shadow-md shadow-orange-500/25 active:scale-95 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Create Account</span>
            </button>
          )}
        </div>
      </header>

      {/* Hero & Login Section */}
      <section className="relative overflow-hidden py-12 lg:py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-mono text-slate-300 shadow-sm shadow-orange-500/10">
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse shrink-0" />
              <span>
                Developed by{" "}
                <strong className="text-orange-400 font-bold tracking-wide">
                  Shashank Manognya R
                </strong>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-400 hidden sm:inline uppercase text-[11px] tracking-wider">
                Continuous Exposure Intelligence
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              SEE EXPOSURE. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400">
                REDUCE RISK.
              </span> <br />
              STAY AHEAD.
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              An on-premises Continuous Threat Exposure Management (CTEM) platform that continuously discovers approved external assets, correlates identity context and credential leaks with actively exploited vulnerabilities, and calculates transparent, mathematically explainable risk.
            </p>

            {/* Quick Value Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
              <div className="p-3.5 rounded-xl glass-card border border-orange-500/20 hover:border-orange-500/50 transition-all">
                <div className="text-[#ff6600] font-mono text-xl font-bold">100%</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">Passive Discovery</div>
              </div>
              <div className="p-3.5 rounded-xl glass-card border border-emerald-500/20 hover:border-emerald-500/50 transition-all">
                <div className="text-emerald-400 font-mono text-xl font-bold">Zero</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">Plaintext Leakage</div>
              </div>
              <div className="p-3.5 rounded-xl glass-card border border-amber-500/20 hover:border-amber-500/50 transition-all">
                <div className="text-amber-400 font-mono text-xl font-bold">4-Pillar</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">Explainable Model</div>
              </div>
            </div>
          </div>

          {/* Hero Right: Sign In Card */}
          <div id="signin" className="lg:col-span-5">
            <div className="bg-[#09090b]/95 backdrop-blur-2xl border border-zinc-800 hover:border-[#ff6600]/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative transition-all">
              {/* Colleague Invite Banner */}
              {inviteDetails && (
                <div className="mb-5 p-3.5 rounded-xl bg-orange-500/10 border border-[#ff6600]/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ff6600]/20 border border-[#ff6600]/40 flex items-center justify-center flex-shrink-0 text-[#ff6600] mt-0.5">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">Invited to {inviteDetails.companyName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        @{inviteDetails.allowedDomain}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      You&apos;ve been invited to join this security workspace. Authenticate with your company email (@{inviteDetails.allowedDomain}).
                    </p>
                  </div>
                </div>
              )}

              {/* Header Tabs (Sign In / Sign Up) */}
              {authMode !== "mfa" && authMode !== "forgot" && (
                <div className="flex border-b border-zinc-800 mb-6">
                  <button
                    onClick={() => {
                      setAuthMode("signin");
                      setSignInError("");
                      setIsAccountNotFound(false);
                    }}
                    className={cn(
                      "flex-1 pb-3 text-xs font-semibold font-mono tracking-wider transition-colors border-b-2 flex items-center justify-center gap-1.5",
                      authMode === "signin"
                        ? "border-[#ff6600] text-[#ff6600]"
                        : "border-transparent text-zinc-400 hover:text-white"
                    )}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>

                  <button
                    onClick={() => {
                      setAuthMode("signup");
                      setSignupError("");
                    }}
                    className={cn(
                      "flex-1 pb-3 text-xs font-semibold font-mono tracking-wider transition-colors border-b-2 flex items-center justify-center gap-1.5",
                      authMode === "signup"
                        ? "border-[#ff6600] text-[#ff6600]"
                        : "border-transparent text-zinc-400 hover:text-white"
                    )}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}

              {/* Back to sign in button if in forgot password mode */}
              {authMode === "forgot" && (
                <div className="mb-5 pb-3 border-b border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                    className="text-xs text-[#ff6600] hover:text-[#ff8533] font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-orange-950/60 border border-orange-800/80 text-orange-300">
                    Account Recovery
                  </span>
                </div>
              )}

              {/* MODE 1: SIGN IN */}
              {authMode === "signin" && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-white">Sign In to ExposureX</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Enter your enterprise credentials or sign in with SSO</p>
                  </div>

                  {/* Google & Microsoft SSO Buttons */}
                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={Boolean(isSsoLoading)}
                        onClick={() => triggerSso("google")}
                        className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/40 text-xs text-zinc-200 font-medium transition-all flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
                        title="Sign in with Google Enterprise"
                      >
                        <GoogleIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{isSsoLoading === "google" ? "Connecting..." : "Google"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(isSsoLoading)}
                        onClick={() => triggerSso("microsoft")}
                        className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/40 text-xs text-zinc-200 font-medium transition-all flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
                        title="Sign in with Microsoft 365"
                      >
                        <MicrosoftIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{isSsoLoading === "microsoft" ? "Connecting..." : "Microsoft"}</span>
                      </button>
                    </div>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-mono">
                        <span className="bg-[#09090b] px-2 text-zinc-500">
                          or continue with email
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Not Found Banner */}
                  {isAccountNotFound && (
                    <div className="mb-4 p-3.5 rounded-lg bg-orange-500/10 border border-[#ff6600]/40 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-[#ff6600] font-semibold">
                        <AlertTriangle className="w-4 h-4 text-[#ff6600] flex-shrink-0" />
                        <span>Account Not Found</span>
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        No registered account was found with <strong>{email}</strong>. Please sign up to create your account.
                      </p>
                      <button
                        type="button"
                        onClick={switchToSignUpWithEmail}
                        className="w-full py-1.5 px-3 rounded bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-orange-500/25"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Sign Up with {email}</span>
                      </button>
                    </div>
                  )}

                  {/* Standard Sign In Error */}
                  {signInError && !isAccountNotFound && (
                    <div className="mb-4 p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs space-y-2.5">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{signInError}</span>
                      </div>
                      <div className="pt-2 border-t border-red-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        <span className="text-zinc-400">Testing on Vercel without a backend?</span>
                        <button
                          type="button"
                          onClick={() => handleDemoSignIn()}
                          className="px-3 py-1 rounded bg-[#ff6600] hover:bg-[#e65c00] text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1 w-fit"
                        >
                          <span>Instant Demo Access</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-300 block mb-1.5">
                        Work Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setIsAccountNotFound(false);
                          setSignInError("");
                        }}
                        placeholder="you@company.com"
                        className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-mono text-zinc-300">
                          Account Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setAuthMode("forgot");
                            setForgotStep(1);
                            setForgotError("");
                            setForgotSuccess("");
                          }}
                          className="text-[11px] text-[#ff6600] hover:text-[#ff8533] font-mono underline-offset-2 hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono pr-14 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-[10px] text-zinc-400 hover:text-white font-mono px-1 py-0.5 flex items-center gap-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#ff6600]" />
                              <span>HIDE</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-zinc-400" />
                              <span>SHOW</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#ff6600] hover:bg-[#e65c00] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 mt-2 active:scale-95"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <span>Enter Security Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Evaluating platform?</span>
                      <button
                        type="button"
                        onClick={() => handleDemoSignIn()}
                        className="text-orange-400 hover:text-orange-300 font-mono font-semibold flex items-center gap-1 hover:underline transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-orange-400" />
                        <span>One-Click Demo Mode</span>
                      </button>
                    </div>
                  </form>

                  <div className="mt-5 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-[#ff6600] hover:text-[#ff8533] font-semibold underline underline-offset-2 ml-1"
                    >
                      Sign Up here
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: SIGN UP */}
              {authMode === "signup" && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-white">Create an ExposureX Account</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Register with credentials or enterprise single sign-on</p>
                  </div>

                  {/* Google & Microsoft SSO in Sign Up */}
                  <div className="space-y-2 mb-4">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={Boolean(isSsoLoading)}
                        onClick={() => triggerSso("google")}
                        className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/40 text-xs text-zinc-200 font-medium transition-all flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
                        title="Sign up with Google Enterprise"
                      >
                        <GoogleIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{isSsoLoading === "google" ? "Connecting..." : "Google"}</span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(isSsoLoading)}
                        onClick={() => triggerSso("microsoft")}
                        className="py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#ff6600]/40 text-xs text-zinc-200 font-medium transition-all flex items-center justify-center gap-2 group shadow-sm disabled:opacity-50"
                        title="Sign up with Microsoft 365"
                      >
                        <MicrosoftIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{isSsoLoading === "microsoft" ? "Connecting..." : "Microsoft"}</span>
                      </button>
                    </div>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-zinc-800"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-mono">
                        <span className="bg-[#09090b] px-2 text-zinc-500">
                          or register with email
                        </span>
                      </div>
                    </div>
                  </div>

                  {signupError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{signupError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-300 block mb-1">
                        Work Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="john.doe@company.com"
                        className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-zinc-300 block mb-1">
                        Password (min 6 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono pr-14 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-2.5 top-2.5 text-[10px] text-zinc-400 hover:text-white font-mono px-1 py-0.5 flex items-center gap-1"
                          aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        >
                          {showSignupPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-[#ff6600]" />
                              <span>HIDE</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-zinc-400" />
                              <span>SHOW</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSigningUp}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#ff6600] hover:bg-[#e65c00] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 mt-3 active:scale-95"
                    >
                      {isSigningUp ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign Up & Proceed to MFA</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-[#ff6600] hover:text-[#ff8533] font-semibold underline underline-offset-2 ml-1"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 4: FORGOT PASSWORD */}
              {authMode === "forgot" && (
                <div>
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-white">Reset Account Password</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {forgotStep === 1
                        ? "Enter your registered email to receive a secure recovery code"
                        : "Enter the 6-digit code and choose a new password"}
                    </p>
                  </div>

                  {forgotError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  {forgotSuccess && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                      <div>
                        <label className="text-xs font-mono text-zinc-300 block mb-1.5">
                          Registered Work Email
                        </label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isForgotSubmitting}
                        className="w-full py-2.5 px-4 rounded-lg bg-[#ff6600] hover:bg-[#e65c00] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
                      >
                        {isForgotSubmitting ? (
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
                    <form onSubmit={handleResetPasswordConfirm} className="space-y-4">
                      {/* On-prem local testing simulated code banner */}
                      {forgotSimulatedCode && (
                        <div className="p-3 rounded-lg bg-orange-500/10 border border-[#ff6600]/30 text-xs flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-mono text-[#ff6600] font-bold">Generated Reset Code:</div>
                            <div className="text-lg font-mono font-extrabold text-white tracking-widest">{forgotSimulatedCode}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForgotCode(forgotSimulatedCode)}
                            className="px-2.5 py-1 rounded bg-[#ff6600]/20 hover:bg-[#ff6600]/30 border border-[#ff6600]/40 text-[11px] text-[#ff6600] font-mono transition-colors"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-mono text-zinc-300 block mb-1.5">
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-center tracking-widest text-lg font-mono text-white focus:outline-none focus:border-[#ff6600] transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-mono text-zinc-300 block mb-1.5">
                          New Password (min 6 characters)
                        </label>
                        <div className="relative">
                          <input
                            type={showForgotNewPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff6600] font-mono pr-14 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                            className="absolute right-2.5 top-2.5 text-[10px] text-zinc-400 hover:text-white font-mono px-1 py-0.5 flex items-center gap-1"
                            aria-label={showForgotNewPassword ? "Hide password" : "Show password"}
                          >
                            {showForgotNewPassword ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-[#ff6600]" />
                                <span>HIDE</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                <span>SHOW</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors"
                        >
                          Back
                        </button>

                        <button
                          type="submit"
                          disabled={isForgotSubmitting}
                          className="flex-1 py-2.5 px-4 rounded-lg bg-[#ff6600] hover:bg-[#e65c00] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
                        >
                          {isForgotSubmitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Updating Password...</span>
                            </>
                          ) : (
                            <>
                              <span>Confirm & Update Password</span>
                              <Check className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* MODE 3: MFA VERIFICATION */}
              {authMode === "mfa" && (
                <div>
                  <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-zinc-800">
                    <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">MFA Verification</h2>
                      <p className="text-[11px] text-zinc-400">Multi-Factor Authentication Required</p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
                    Enter the 6-digit verification code to complete Multi-Factor Authentication for <strong className="text-[#ff6600] font-mono">{mfaEmail}</strong>.
                  </p>

                  {/* Simulated Code Display for On-Prem / Local testing */}
                  {simulatedMfaCode && (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold">On-Premises MFA Code:</div>
                        <div className="text-lg font-mono font-extrabold text-white tracking-widest">{simulatedMfaCode}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMfaCode(simulatedMfaCode)}
                        className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] text-emerald-300 font-mono transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  {mfaError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span>{mfaError}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyMfa} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-300 block mb-1.5">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full text-center text-xl tracking-[0.3em] font-mono py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-700 focus:outline-none focus:border-[#ff6600] transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifyingMfa || mfaCode.length !== 6}
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isVerifyingMfa ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Validating MFA Code...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Launch Platform</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className="text-xs text-zinc-400 hover:text-white font-mono flex items-center justify-center gap-1.5 mx-auto transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Sign In</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="features" className="py-16 px-6 lg:px-12 bg-[#090e1c] border-y border-[#1a2333]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Complete Exposure Intelligence Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Built ground-up as a continuous security exposure management platform, replacing fragmented spreadsheets and siloed feeds with automated correlation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Scoped Discovery */}
            <div className="p-5 rounded-xl bg-[#0c1220] border border-[#1a2942] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Scoped External Asset Discovery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Passive reconnaissance via DNS (A/MX/TXT), TLS 1.3 / x509 SANs, and Certificate Transparency logs. Strictly constrained to approved organization boundaries.
              </p>
            </div>

            {/* 2. Credential Intelligence */}
            <div className="p-5 rounded-xl bg-[#0c1220] border border-[#1a2942] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Credential Intelligence & Leak Telemetry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingests exposure telemetry from open community &amp; OSINT registries (XposedOrNot, LeakCheck, Hudson Rock). Retains only sanitized, minimized metadata with zero plaintext storage.
              </p>
            </div>

            {/* 3. Vulnerability Prioritization */}
            <div className="p-5 rounded-xl bg-[#0c1220] border border-[#1a2942] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">CISA KEV Vulnerability Intelligence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synchronizes live with the CISA Known Exploited Vulnerabilities catalog. Prioritizes flaws under active weaponization over passive theoretical CVSS scores.
              </p>
            </div>

            {/* 4. Identity & Business Context */}
            <div className="p-5 rounded-xl bg-[#0c1220] border border-[#1a2942] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Identity Context & Criticality</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Correlates enterprise identities with business criticality tiers (DevOps, C-Suite, IT Admins). Elevates risk when privileged accounts are exposed.
              </p>
            </div>

            {/* 5. Explainable Risk Engine */}
            <div className="p-5 rounded-xl bg-[#0c1220] border border-[#1a2942] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">4-Pillar Transparent Risk Engine</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates risk using a deterministic, configurable formula across Assets, Vulnerabilities, Credentials, and Identities. Zero opaque black-box AI.
              </p>
            </div>

            {/* 6. Security Pulse & Operations */}
            <div className="p-5 rounded-xl bg-[#0c1220] border border-[#1a2942] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Security Pulse Real-Time Operations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bidirectional WebSocket incident alerts, actionable findings with explainable "Why?" evidence, and full lifecycle security case management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Continuous Exposure Pipeline</h2>
          <p className="text-xs text-slate-400">
            From boundary validation to case remediation — how ExposureX connects the dots.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a0f1d] border border-[#1a2333] space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            <span className="px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              1. Approved Scope Boundary
            </span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
              2. Passive Asset Discovery
            </span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
              3. Credential & Vuln Feeds
            </span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300">
              4. Correlation Engine
            </span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              5. Explainable Risk Score
            </span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1.5 rounded bg-red-950/80 border border-red-800 text-red-300">
              6. Security Pulse Alerts
            </span>
            <span className="text-slate-500">→</span>
            <span className="px-3 py-1.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
              7. Security Cases & Remediation
            </span>
          </div>
        </div>
      </section>

      {/* Explainable Risk Engine (4-Pillars) Section */}
      <section id="pillars" className="py-20 px-6 lg:px-12 bg-[#080d1a] border-t border-b border-[#1a2333]">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[11px] font-mono font-semibold tracking-wider uppercase">
              <Scale className="w-3.5 h-3.5" />
              <span>Zero Black-Box Transparency</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
              The 4-Pillar Explainable Risk Engine
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Unlike legacy systems that output mysterious AI confidence scores, ExposureX scores your attack surface using a deterministic, fully auditable mathematical formula. Every single risk point is traceable directly to real-world security telemetry.
            </p>
          </div>

          {/* Mathematical Formula Banner */}
          <div className="p-6 rounded-2xl bg-[#0a101f] border border-[#1e293b] shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  <Calculator className="w-4 h-4" />
                  <span>Deterministic Risk Formulation</span>
                </div>
                <div className="text-sm sm:text-base font-mono text-slate-200 bg-black/50 px-4 py-2.5 rounded-lg border border-slate-800">
                  <span className="text-orange-400 font-bold">Total Risk</span> ={" "}
                  <span className="text-cyan-400">(Exposure × 30%)</span> +{" "}
                  <span className="text-red-400">(Vulnerabilities × 25%)</span> +{" "}
                  <span className="text-amber-400">(Credentials × 25%)</span> +{" "}
                  <span className="text-emerald-400">(Business Impact × 20%)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center px-4 py-2 bg-black/40 border border-slate-800 rounded-xl">
                  <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Output Scale</div>
                  <div className="text-xl font-bold font-mono text-white">0 — 100</div>
                </div>
                <div className="text-center px-4 py-2 bg-black/40 border border-slate-800 rounded-xl">
                  <div className="text-[10px] uppercase font-mono text-slate-400 tracking-wider">Auditability</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">100% Deterministic</div>
                </div>
              </div>
            </div>
          </div>

          {/* The 4 Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: External Exposure */}
            <div className="p-6 rounded-2xl bg-[#0c1220] border border-[#1a2942] hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/60 text-cyan-300">
                    Weight: 30%
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">External Exposure</h3>
                  <div className="text-[11px] font-mono text-cyan-400">Perimeter Reachability</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Evaluates internet-facing attack surface area: open high-risk ports (RDP, SSH, SMB, databases), exposed management consoles, TLS certificate expiry, and unencrypted HTTP endpoints.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/60 space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Score Component:</span>
                  <span className="text-cyan-400 font-semibold">0 - 30.0 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Input Telemetry:</span>
                  <span className="text-slate-300">Port &amp; SAN Scans</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Vulnerability Posture */}
            <div className="p-6 rounded-2xl bg-[#0c1220] border border-[#1a2942] hover:border-red-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-red-950/60 border border-red-700/60 text-red-300">
                    Weight: 25%
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Vulnerability Posture</h3>
                  <div className="text-[11px] font-mono text-red-400">Active Weaponization</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Prioritizes vulnerabilities based on real-world threat intelligence. Flaws listed on CISA KEV (Known Exploited Vulnerabilities) or with public weaponized exploits receive urgent weighting over passive theoretical bugs.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/60 space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Score Component:</span>
                  <span className="text-red-400 font-semibold">0 - 25.0 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Input Telemetry:</span>
                  <span className="text-slate-300">CISA KEV + CVSS 3.1</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Credential Exposure */}
            <div className="p-6 rounded-2xl bg-[#0c1220] border border-[#1a2942] hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-700/60 text-amber-300">
                    Weight: 25%
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Credential Exposure</h3>
                  <div className="text-[11px] font-mono text-amber-400">Breach &amp; Stealer Telemetry</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Ingests breach intelligence from verified feeds (XposedOrNot, Hudson Rock, LeakCheck). Highlights compromised corporate identities, privileged account leaks, and unrotated credentials without storing any plaintext secrets.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/60 space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Score Component:</span>
                  <span className="text-amber-400 font-semibold">0 - 25.0 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Input Telemetry:</span>
                  <span className="text-slate-300">Breach Feeds &amp; Stealers</span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Business Criticality */}
            <div className="p-6 rounded-2xl bg-[#0c1220] border border-[#1a2942] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                    Weight: 20%
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">Business Criticality</h3>
                  <div className="text-[11px] font-mono text-emerald-400">Asset &amp; Role Context</div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Contextualizes technical exposure against business reality. Critical assets (core payment gateways, customer databases) and privileged users (DevOps, Domain Admins, Executive leadership) amplify the score.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800/60 space-y-1.5 font-mono text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Score Component:</span>
                  <span className="text-emerald-400 font-semibold">0 - 20.0 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Input Telemetry:</span>
                  <span className="text-slate-300">Asset Tags &amp; Roles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Calculation Walkthrough Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0b101d] border border-[#1a2942] space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-orange-400 uppercase font-bold tracking-wider">Audit Traceability Demonstration</div>
                <h4 className="text-lg font-bold text-white font-sans">Deterministic Risk Attribution in Action</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-700 text-red-300 font-mono font-bold text-sm">
                  Calculated Risk: 78 / 100 (HIGH)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-cyan-400 font-mono font-semibold">1. Exposure</span>
                  <span className="font-mono text-white font-bold">80 / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full w-[80%]" />
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  80 × 0.30 = <strong className="text-white font-mono">24.0 pts</strong>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Unrestricted port 443 &amp; exposed staging portal.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-red-400 font-mono font-semibold">2. Vulnerabilities</span>
                  <span className="font-mono text-white font-bold">90 / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-400 h-full w-[90%]" />
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  90 × 0.25 = <strong className="text-white font-mono">22.5 pts</strong>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  1 CISA KEV actively exploited VPN vulnerability.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-400 font-mono font-semibold">3. Credentials</span>
                  <span className="font-mono text-white font-bold">75 / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[75%]" />
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  75 × 0.25 = <strong className="text-white font-mono">18.75 pts</strong>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  DevOps engineer corporate identity compromised.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-mono font-semibold">4. Criticality</span>
                  <span className="font-mono text-white font-bold">65 / 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[65%]" />
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  65 × 0.20 = <strong className="text-white font-mono">13.0 pts</strong>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Production environment with Tier-1 asset tagging.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                <span>
                  <strong>Audit Rationale:</strong> 24.0 + 22.5 + 18.75 + 13.0 = <strong className="font-mono text-orange-400">78.25</strong> → Normalized to <strong className="font-mono text-white">78 / 100 (HIGH Risk)</strong>. Every calculation parameter is auditable in compliance reports.
                </span>
              </div>
              <a
                href="#signin"
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold whitespace-nowrap transition-all shadow-md shadow-orange-500/20 text-xs shrink-0"
              >
                Explore Live Telemetry
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Scope Governance & Restriction Notice */}
      <section id="governance" className="py-12 px-6 lg:px-12 bg-[#090e1c] border-t border-[#1a2333]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="p-5 rounded-xl bg-[#080d1a] border border-[#1a2333] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold font-mono text-cyan-400 uppercase flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Strict Architectural Scope Restrictions</span>
              </div>
              <p className="text-[13px] text-slate-400 max-w-4xl leading-relaxed">
                ExposureX is strictly an exposure intelligence, correlation, and risk prioritization platform. It contains zero offensive exploits, does not perform credential stuffing or password spraying, does not store raw passwords or session tokens, and never performs unauthorized live authentication.
              </p>
            </div>
            <a
              href="#signin"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs whitespace-nowrap transition-all shadow-md shadow-orange-500/25 active:scale-95"
            >
              Sign In to Platform
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 lg:px-12 border-t border-[#1a2333] bg-[#060a14] text-center text-xs text-slate-400 font-mono space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-2 text-slate-300 font-medium">
          <span>&copy; {new Date().getFullYear()} ExposureX. All rights reserved.</span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span>
            Developed by{" "}
            <span className="text-orange-400 font-semibold tracking-wide">
              Shashank Manognya R
            </span>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Continuous Exposure Management &amp; Risk Intelligence Platform
        </div>
        <div className="text-[10px] text-slate-600 uppercase tracking-wider">
          SEE EXPOSURE. REDUCE RISK. STAY AHEAD. &bull; v1.0.0
        </div>
      </footer>

      {/* SSO Account Confirmation Modal */}
      {ssoModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {ssoModal.provider === "google" ? <GoogleIcon className="w-5 h-5" /> : <MicrosoftIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {ssoModal.provider === "google" ? "Google Enterprise SSO" : "Microsoft 365 Enterprise SSO"}
                </h3>
                <p className="text-xs text-zinc-400">Federated single sign-on identity</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Confirm your corporate account email to link or sign in with your enterprise {ssoModal.provider === "google" ? "Google Workspace" : "Microsoft Azure AD"} identity.
            </p>

            {/* Domain Enforcement Alert / Error */}
            {ssoError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-red-300">Access Denied: Unregistered Domain</div>
                  <div className="text-[11px] text-red-200 leading-snug">{ssoError}</div>
                </div>
              </div>
            )}

            {/* Corporate Domain Policy Notice */}
            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-mono">Enterprise Policy:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Corporate Domains Authorized
                </span>
              </div>
              <div className="text-[11px] text-zinc-300">
                {inviteDetails ? (
                  <span>This invitation is restricted to colleagues from <strong className="text-white font-mono">@{inviteDetails.allowedDomain}</strong>.</span>
                ) : (
                  <span>Sign in with any corporate company email (e.g. <strong className="text-white font-mono">sam@abc.com</strong>). Personal consumer webmail (@gmail.com, @yahoo.com) is not permitted.</span>
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSsoExecute(ssoModal.provider, ssoModal.email, ssoModal.name);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">
                  Enterprise SSO Email
                </label>
                <input
                  type="email"
                  required
                  value={ssoModal.email}
                  onChange={(e) => {
                    setSsoModal({ ...ssoModal, email: e.target.value });
                    if (ssoError) setSsoError("");
                  }}
                  placeholder="sam@abc.com"
                  className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff6600] font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={ssoModal.name}
                  onChange={(e) => setSsoModal({ ...ssoModal, name: e.target.value })}
                  placeholder="Sam Vance"
                  className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-[#ff6600]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSsoModal({ isOpen: false, provider: "google", email: "", name: "" });
                    setSsoError("");
                  }}
                  className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(isSsoLoading)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#ff6600] hover:bg-[#e65c00] disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active:scale-95"
                >
                  {isSsoLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize & Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}