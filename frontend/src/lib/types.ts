export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "Administrator" | "Security Analyst" | "Risk Manager" | "Viewer" | "Auditor";
  is_active: boolean;
}

export interface DashboardMetrics {
  overall_risk_score: number;
  overall_risk_band: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  critical_findings: number;
  high_findings: number;
  moderate_findings: number;
  low_findings: number;
  external_assets: number;
  exposed_identities: number;
  total_identities: number;
  credential_events: number;
  vulnerabilities: number;
  cisa_kev_count: number;
  open_cases: number;
  trend_history: { date: string; score: number }[];
  recent_assets: {
    id: string;
    name: string;
    asset_type: string;
    domain?: string;
    business_criticality: string;
    risk_score: number;
    risk_band: string;
    first_seen: string;
  }[];
  recent_pulse: SecurityPulseEvent[];
}

export interface Asset {
  id: string;
  name: string;
  asset_type: string;
  domain?: string;
  ip?: string;
  port?: number;
  protocol?: string;
  technology?: string;
  discovery_source?: string;
  first_seen?: string;
  last_seen?: string;
  status: string;
  business_criticality: string;
  owner?: string;
  tags: string[];
  risk_score: number;
  risk_band: string;
  vulnerabilities_count?: number;
  credential_exposures_count?: number;
}

export interface AssetDetail extends Asset {
  metadata_info: Record<string, any>;
  vulnerabilities: Vulnerability[];
  credential_exposures: CredentialExposure[];
  associated_identities: {
    id: string;
    email: string;
    username?: string;
    role?: string;
    is_privileged: boolean;
    business_criticality: string;
  }[];
  risk_breakdown: RiskBreakdown;
  relationship_graph: {
    nodes: { id: string; label: string; type: string; criticality?: string; severity?: string; privileged?: boolean }[];
    links: { source: string; target: string; relation: string }[];
  };
}

export interface RiskBreakdown {
  score: number;
  band: string;
  pillars: {
    exposure: number;
    vulnerability: number;
    credential_exposure: number;
    business_impact: number;
  };
  weights: {
    exposure: number;
    vulnerability: number;
    credential_exposure: number;
    business_impact: number;
  };
  formula: string;
  contributing_factors: string[];
  correlation_flags: string[];
  recommended_action: string;
}

export interface Identity {
  id: string;
  email: string;
  username?: string;
  department?: string;
  role?: string;
  account_type: string;
  is_privileged: boolean;
  business_criticality: string;
  status: string;
  associated_asset_ids: string[];
  credential_exposure_count: number;
  risk_score: number;
  risk_band: string;
  created_at?: string;
}

export interface CredentialExposure {
  id: string;
  email: string;
  domain: string;
  email_hash_sha256?: string;
  provider: string;
  exposure_type: string;
  breach_title: string;
  breach_date?: string;
  first_observed?: string;
  last_observed?: string;
  confidence: string;
  severity: string;
  source_category: string;
  risk_contribution: number;
  investigation_status: string;
  exposed_data_classes: string[];
  description?: string;
  related_asset_name?: string;
  identity_role?: string;
}

export interface Vulnerability {
  id: string;
  cve_id: string;
  title: string;
  description?: string;
  cvss_score: number;
  cvss_vector?: string;
  severity: string;
  published_date?: string;
  cisa_kev_status: boolean;
  cisa_kev_date_added?: string;
  affected_technology?: string;
  references: string[];
  risk_contribution?: number;
  associated_asset_name?: string;
}

export interface Finding {
  id: string;
  finding_ref: string;
  title: string;
  severity: string;
  risk_score: number;
  risk_band: string;
  asset_id?: string;
  asset_name?: string;
  identity_email?: string;
  source: string;
  first_seen?: string;
  last_seen?: string;
  status: string;
  owner?: string;
  recommended_action?: string;
}

export interface FindingDetail extends Finding {
  asset?: any;
  identity?: any;
  credential_exposure?: any;
  vulnerability?: any;
  evidence: Record<string, any>;
  why_explanation: string[];
}

export interface SecurityCase {
  id: string;
  case_ref: string;
  title: string;
  severity: string;
  risk_score: number;
  description?: string;
  assigned_analyst?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  comments_count: number;
}

export interface CaseDetail extends SecurityCase {
  resolution?: string;
  analyst_notes?: string;
  evidence: Record<string, any>;
  audit_history: { timestamp: string; action: string; user: string; notes?: string }[];
  comments: { id: string; user_name: string; comment: string; created_at: string }[];
  related_findings: { id: string; ref: string; title: string; severity: string; risk_score: number }[];
}

export interface Vendor {
  id: string;
  name: string;
  domain: string;
  category: string;
  contact_email?: string;
  business_criticality: string;
  data_sensitivity: string;
  external_exposure_score: number;
  vulnerability_score: number;
  credential_score: number;
  email_security_score: number;
  hygiene_score: number;
  overall_risk_score: number;
  risk_band: string;
  assessment_status: string;
  last_assessed_at?: string;
  notes?: string;
  evidence: Record<string, any>;
}

export interface SecurityPulseEvent {
  id: string;
  title: string;
  message: string;
  severity: string;
  event_type: string;
  reasons: string[];
  action_url?: string;
  is_read?: boolean;
  timestamp: string;
}

export interface ProviderStatus {
  id: string;
  name: string;
  category: string;
  status: string;
  is_configured: boolean;
  details: Record<string, any>;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  object: string;
  previous_value?: string;
  new_value?: string;
  ip_address: string;
  result: string;
  metadata_info: Record<string, any>;
}

export interface ApprovedScopeItem {
  id: string;
  scope_type: string;
  pattern: string;
  description?: string;
  is_active: boolean;
  approved_by?: string;
  created_at: string;
}

