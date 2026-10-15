function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // If accessed through standard HTTP/HTTPS reverse proxy (port 80 or 443)
    if (window.location.port === "80" || window.location.port === "443" || !window.location.port) {
      return `${window.location.origin}/api/v1`;
    }
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    // Match current host (127.0.0.1, localhost, or LAN IP).
    // Normalize localhost to 127.0.0.1 to avoid Windows IPv6 (::1) connection refused issues with uvicorn.
    const hostname = window.location.hostname || "127.0.0.1";
    const targetHost = hostname === "localhost" ? "127.0.0.1" : hostname;
    return `http://${targetHost}:8000/api/v1`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined"
    ? (sessionStorage.getItem("exposurex_token") || localStorage.getItem("exposurex_token"))
    : null;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    // If connecting directly to port 8000 failed, attempt same-origin Next.js reverse proxy fallback (/api/v1/...)
    if (typeof window !== "undefined" && url.startsWith("http")) {
      try {
        const fallbackUrl = `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
        res = await fetch(fallbackUrl, {
          ...options,
          headers,
        });
      } catch {
        throw new Error(
          `Unable to connect to ExposureX backend. Please verify the backend service is running on http://127.0.0.1:8000.`
        );
      }
    } else {
      throw new Error(
        `Network error: ${err?.message || "Failed to reach backend service"}`
      );
    }
  }

  // If 401 Unauthorized, clear stored expired session
  if (res.status === 401 && typeof window !== "undefined" && !endpoint.includes("/auth/login")) {
    sessionStorage.removeItem("exposurex_token");
    sessionStorage.removeItem("exposurex_user");
    localStorage.removeItem("exposurex_token");
    localStorage.removeItem("exposurex_user");
    throw new Error("Authentication required or session expired. Please sign in to perform this operation.");
  }

  if (!res.ok) {
    let errorDetail = "API Request failed";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (formData: URLSearchParams) => {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    if (!res.ok) {
      let msg = "Invalid credentials";
      try {
        const errJson = await res.json();
        if (errJson.detail) msg = errJson.detail;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },
  signup: (data: { full_name?: string; email: string; password: string; organization_name?: string; invite_token?: string }) =>
    apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyMfa: (data: { user_id: string; code: string }) =>
    apiFetch("/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  forgotPassword: (data: { email: string }) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetPassword: (data: { email: string; reset_code: string; new_password: string }) =>
    apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  ssoLogin: (data: { provider: string; email: string; full_name?: string; invite_token?: string }) =>
    apiFetch("/auth/sso", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSsoDomains: () => apiFetch<{ registered_domains: string[] }>("/auth/sso/domains"),
  createInvite: (data: { invited_email?: string; role?: string }) =>
    apiFetch<{
      status: string;
      invite_token: string;
      invite_url: string;
      company_name: string;
      allowed_domain: string;
      role: string;
      expires_at: string;
    }>("/auth/invites", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getInviteDetails: (token: string) =>
    apiFetch<{
      valid: boolean;
      invite_token: string;
      company_name: string;
      allowed_domain: string;
      invited_email?: string;
      invited_by: string;
      role: string;
      expires_at: string;
    }>(`/auth/invites/${token}`),
  getMe: () => apiFetch("/auth/me"),
  getUsers: () => apiFetch("/auth/users"),
  createUser: (data: { email: string; full_name: string; password: string; role: string }) =>
    apiFetch("/auth/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: { full_name?: string; role?: string; is_active?: boolean }) =>
    apiFetch(`/auth/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  resetUserPassword: (id: string, new_password: string) =>
    apiFetch(`/auth/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ new_password }) }),
  deleteUser: (id: string) =>
    apiFetch(`/auth/users/${id}`, { method: "DELETE" }),

  // Dashboard
  getDashboardMetrics: () => apiFetch("/dashboard/metrics"),

  // Assets
  getAssets: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/assets/${qs}`);
  },
  getAssetDetail: (id: string) => apiFetch(`/assets/${id}`),
  createAsset: (data: any) => apiFetch("/assets/", { method: "POST", body: JSON.stringify(data) }),
  discoverAssets: (targetScope: string) =>
    apiFetch("/assets/discover", {
      method: "POST",
      body: JSON.stringify({ target_scope: targetScope }),
    }),
  deleteAsset: (id: string) => apiFetch(`/assets/${id}`, { method: "DELETE" }),

  // Identities
  getIdentities: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/identities/${qs}`);
  },
  getIdentityDetail: (id: string) => apiFetch(`/identities/${id}`),
  createIdentity: (data: any) => apiFetch("/identities/", { method: "POST", body: JSON.stringify(data) }),
  importCsv: async (file: File) => {
    const token = localStorage.getItem("exposurex_token");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${getApiBaseUrl()}/identities/import-csv`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("CSV Import failed");
    return res.json();
  },

  // Credentials
  getCredentials: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/credentials/${qs}`);
  },
  getCredentialDetail: (id: string) => apiFetch(`/credentials/${id}`),
  updateCredentialStatus: (id: string, status: string, notes?: string) =>
    apiFetch(`/credentials/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ investigation_status: status, analyst_notes: notes }),
    }),
  createSyntheticExposure: (data: any) =>
    apiFetch("/credentials/synthetic", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Vulnerabilities
  getVulnerabilities: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/vulnerabilities/${qs}`);
  },
  getVulnerabilityDetail: (id: string) => apiFetch(`/vulnerabilities/${id}`),
  syncCisaKev: () => apiFetch("/vulnerabilities/sync-cisa-kev", { method: "POST" }),
  createVulnerability: (data: any) => apiFetch("/vulnerabilities/", { method: "POST", body: JSON.stringify(data) }),

  // Findings
  getFindings: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/findings/${qs}`);
  },
  getFindingDetail: (id: string) => apiFetch(`/findings/${id}`),
  updateFindingStatus: (id: string, status: string) =>
    apiFetch(`/findings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateFindingOwner: (id: string, owner: string) =>
    apiFetch(`/findings/${id}/owner`, {
      method: "PATCH",
      body: JSON.stringify({ owner }),
    }),
  createFinding: (data: any) => apiFetch("/findings/", { method: "POST", body: JSON.stringify(data) }),

  // Cases
  getCases: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/cases/${qs}`);
  },
  getCaseDetail: (id: string) => apiFetch(`/cases/${id}`),
  createCase: (data: any) => apiFetch("/cases/", { method: "POST", body: JSON.stringify(data) }),
  updateCaseStatus: (id: string, status: string, resolution?: string, notes?: string) =>
    apiFetch(`/cases/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, resolution, analyst_notes: notes }),
    }),
  addCaseComment: (id: string, comment: string) =>
    apiFetch(`/cases/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ comment }),
    }),

  // Risk
  getInternalRiskAssessment: () => apiFetch("/risk/internal-assessment"),
  getCompanyBenchmarks: () => apiFetch("/risk/company-benchmarks"),
  getWeights: () => apiFetch("/risk/weights"),
  updateWeights: (weights: any) => apiFetch("/risk/weights", { method: "POST", body: JSON.stringify(weights) }),

  // Vendors (Third-Party Risk)
  getVendors: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/vendors/${qs}`);
  },
  getVendorDetail: (id: string) => apiFetch(`/vendors/${id}`),
  createVendor: (data: any) => apiFetch("/vendors/", { method: "POST", body: JSON.stringify(data) }),
  updateVendor: (id: string, data: any) => apiFetch(`/vendors/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  assessVendor: (id: string) => apiFetch(`/vendors/${id}/assess`, { method: "POST" }),

  // Notifications
  getNotifications: (unreadOnly = false) => apiFetch(`/notifications/?unread_only=${unreadOnly}`),
  markNotificationRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => apiFetch("/notifications/mark-all-read", { method: "POST" }),
  triggerPulseAlert: (data: any) => apiFetch("/notifications/trigger", { method: "POST", body: JSON.stringify(data) }),

  // Providers
  getProviders: () => apiFetch("/providers/"),
  checkProviderHealth: (id: string) => apiFetch(`/providers/${id}/health-check`, { method: "POST" }),
  updateNvdKey: (apiKey: string) =>
    apiFetch("/providers/nvd-key", { method: "POST", body: JSON.stringify({ api_key: apiKey }) }),

  // Audit
  getAuditLogs: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return apiFetch(`/audit/${qs}`);
  },

  // Scope
  getScopes: () => apiFetch("/scope/"),
  addScope: (data: any) => apiFetch("/scope/", { method: "POST", body: JSON.stringify(data) }),
  validateScopeTarget: (target: string) => apiFetch("/scope/validate", { method: "POST", body: JSON.stringify({ target }) }),

  // Search
  globalSearch: (q: string) => apiFetch(`/search/?q=${encodeURIComponent(q)}`),

  // Maintenance
  resetDemoData: () => apiFetch("/demo/reset-demo-data", { method: "POST" }),
};
