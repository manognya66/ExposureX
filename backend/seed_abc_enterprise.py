"""Seed realistic enterprise CTEM demo data for Abc Enterprise (abc.com)"""
from datetime import datetime, timedelta
import hashlib
import uuid
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.organization import Organization, ApprovedScope
from app.models.asset import Asset, AssetRelationship
from app.models.identity import Identity
from app.models.credential import CredentialExposure, CredentialProvider
from app.models.vulnerability import Vulnerability
from app.models.finding import Finding
from app.models.case import SecurityCase, CaseComment
from app.models.vendor import Vendor
from app.models.notification import SecurityPulseNotification
from app.models.audit import AuditLog

def seed_abc():
    db = SessionLocal()
    try:
        # 1. Get or create Abc Enterprise
        org = db.query(Organization).filter(Organization.domain_primary == "abc.com").first()
        if not org:
            org = Organization(
                name="Abc Enterprise",
                description="Primary enterprise infrastructure scope for continuous exposure management",
                domain_primary="abc.com"
            )
            db.add(org)
            db.commit()
            db.refresh(org)
        print(f"Organization: {org.name} (ID: {org.id})")

        # 2. Approved Scopes
        existing_scopes = [s.pattern for s in db.query(ApprovedScope).filter(ApprovedScope.organization_id == org.id).all()]
        scopes_to_add = [
            ("abc.com", "Domain", "Primary apex corporate domain scope"),
            ("*.abc.com", "Wildcard", "All authorized production and staging subdomains"),
            ("198.51.100.0/24", "CIDR", "Authorized enterprise perimeter DMZ subnet")
        ]
        for pat, stype, desc in scopes_to_add:
            if pat not in existing_scopes:
                db.add(ApprovedScope(
                    organization_id=org.id,
                    scope_type=stype,
                    pattern=pat,
                    description=desc,
                    is_active=True,
                    approved_by="Security Governance Board"
                ))
        db.commit()
        print("Approved scopes verified.")

        # 3. Credential Providers
        if db.query(CredentialProvider).count() == 0:
            db.add_all([
                CredentialProvider(name="XposedOrNot Community", code="XposedOrNot", provider_type="Community Breach Registry", is_configured=True, api_status="Healthy"),
                CredentialProvider(name="LeakCheck Public API", code="LeakCheck", provider_type="Public Breach Intelligence", is_configured=True, api_status="Healthy"),
                CredentialProvider(name="Hudson Rock Cavalier", code="HudsonRock", provider_type="Infostealer Cybercrime Intelligence", is_configured=True, api_status="Healthy"),
            ])
            db.commit()
            print("Credential providers created.")

        # 4. Assets
        existing_assets = {a.name: a for a in db.query(Asset).filter(Asset.organization_id == org.id).all()}
        asset_defs = [
            {
                "name": "vpn.abc.com",
                "asset_type": "Subdomain",
                "domain": "vpn.abc.com",
                "ip": "198.51.100.25",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "Fortinet FortiOS SSL-VPN Gateway",
                "discovery_source": "Certificate Transparency & DNS",
                "status": "Active",
                "business_criticality": "Critical",
                "owner": "Network Security Team",
                "tags": ["Perimeter", "VPN", "Critical Infrastructure"],
                "risk_score": 88,
                "risk_band": "Critical",
            },
            {
                "name": "portal.abc.com",
                "asset_type": "Web Application",
                "domain": "portal.abc.com",
                "ip": "198.51.100.30",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "Next.js / Node.js Reverse Proxy",
                "discovery_source": "Certificate Transparency",
                "status": "Active",
                "business_criticality": "High",
                "owner": "Product Engineering",
                "tags": ["Customer Facing", "Web Portal"],
                "risk_score": 62,
                "risk_band": "High",
            },
            {
                "name": "api.abc.com",
                "asset_type": "API Endpoint",
                "domain": "api.abc.com",
                "ip": "198.51.100.10",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "FastAPI / Kong API Gateway",
                "discovery_source": "Certificate Transparency",
                "status": "Active",
                "business_criticality": "Critical",
                "owner": "Platform API Team",
                "tags": ["API", "Public Interface"],
                "risk_score": 76,
                "risk_band": "Critical",
            },
            {
                "name": "auth.abc.com",
                "asset_type": "Web Application",
                "domain": "auth.abc.com",
                "ip": "198.51.100.35",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "Keycloak SSO Identity Broker",
                "discovery_source": "DNS Intelligence",
                "status": "Active",
                "business_criticality": "Critical",
                "owner": "IAM Team",
                "tags": ["Auth", "SSO", "IAM"],
                "risk_score": 79,
                "risk_band": "Critical",
            },
            {
                "name": "mail.abc.com",
                "asset_type": "Host",
                "domain": "mail.abc.com",
                "ip": "198.51.100.40",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "Microsoft Exchange Hybrid Server",
                "discovery_source": "DNS MX Inspection",
                "status": "Active",
                "business_criticality": "High",
                "owner": "Enterprise IT Ops",
                "tags": ["Email", "MX Gateway"],
                "risk_score": 65,
                "risk_band": "High",
            },
            {
                "name": "cdn.abc.com",
                "asset_type": "Subdomain",
                "domain": "cdn.abc.com",
                "ip": "198.51.100.50",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "Cloudflare Edge CDN",
                "discovery_source": "Certificate Transparency",
                "status": "Active",
                "business_criticality": "Medium",
                "owner": "Web Infrastructure",
                "tags": ["CDN", "Static Media"],
                "risk_score": 34,
                "risk_band": "Low",
            },
            {
                "name": "dev-test.abc.com",
                "asset_type": "Host",
                "domain": "dev-test.abc.com",
                "ip": "198.51.100.60",
                "port": 8080,
                "protocol": "HTTP",
                "technology": "Apache Tomcat / Spring Framework",
                "discovery_source": "Subdomain Passive Enumeration",
                "status": "Active",
                "business_criticality": "High",
                "owner": "DevOps Engineering",
                "tags": ["Dev", "Non-Production Exposed"],
                "risk_score": 71,
                "risk_band": "High",
            },
            {
                "name": "abc.com",
                "asset_type": "Domain",
                "domain": "abc.com",
                "ip": "198.51.100.1",
                "port": 443,
                "protocol": "HTTPS",
                "technology": "Cloudflare Edge WAF",
                "discovery_source": "DNS Apex Zone",
                "status": "Active",
                "business_criticality": "Critical",
                "owner": "Marketing & Communications",
                "tags": ["Apex Domain", "CDN"],
                "risk_score": 40,
                "risk_band": "Moderate",
            }
        ]

        created_assets = {}
        for a_def in asset_defs:
            if a_def["name"] in existing_assets:
                created_assets[a_def["name"]] = existing_assets[a_def["name"]]
            else:
                a = Asset(
                    organization_id=org.id,
                    name=a_def["name"],
                    asset_type=a_def["asset_type"],
                    domain=a_def["domain"],
                    ip=a_def["ip"],
                    port=a_def["port"],
                    protocol=a_def["protocol"],
                    technology=a_def["technology"],
                    discovery_source=a_def["discovery_source"],
                    first_seen=datetime.utcnow() - timedelta(days=40),
                    last_seen=datetime.utcnow(),
                    status=a_def["status"],
                    business_criticality=a_def["business_criticality"],
                    owner=a_def["owner"],
                    tags=a_def["tags"],
                    risk_score=a_def["risk_score"],
                    risk_band=a_def["risk_band"],
                    metadata_info={"asn": "AS13335", "tls_version": "TLSv1.3"}
                )
                db.add(a)
                db.commit()
                db.refresh(a)
                created_assets[a.name] = a
        print(f"Assets created: {len(created_assets)}")

        # 5. Identities
        existing_idents = {i.email: i for i in db.query(Identity).filter(Identity.organization_id == org.id).all()}
        ident_defs = [
            {
                "email": "sam@abc.com",
                "username": "sam.admin",
                "department": "Security Architecture",
                "role": "Principal Security Architect",
                "account_type": "Privileged account",
                "is_privileged": True,
                "business_criticality": "Critical",
                "associated_asset_ids": [created_assets["vpn.abc.com"].id, created_assets["abc.com"].id],
                "credential_exposure_count": 0,
                "risk_score": 50,
                "risk_band": "Moderate"
            },
            {
                "email": "alex.devops@abc.com",
                "username": "alex.devops",
                "department": "DevOps & Cloud Reliability",
                "role": "Lead DevOps Engineer",
                "account_type": "Privileged account",
                "is_privileged": True,
                "business_criticality": "Critical",
                "associated_asset_ids": [created_assets["vpn.abc.com"].id, created_assets["dev-test.abc.com"].id],
                "credential_exposure_count": 1,
                "risk_score": 85,
                "risk_band": "Critical"
            },
            {
                "email": "sarah.chen@abc.com",
                "username": "sarah.chen",
                "department": "Information Security",
                "role": "Incident Response Lead",
                "account_type": "Privileged account",
                "is_privileged": True,
                "business_criticality": "High",
                "associated_asset_ids": [created_assets["vpn.abc.com"].id],
                "credential_exposure_count": 1,
                "risk_score": 55,
                "risk_band": "High"
            },
            {
                "email": "david.finance@abc.com",
                "username": "david.finance",
                "department": "Corporate Treasury & Finance",
                "role": "Finance Director",
                "account_type": "Employee",
                "is_privileged": False,
                "business_criticality": "High",
                "associated_asset_ids": [created_assets["portal.abc.com"].id],
                "credential_exposure_count": 1,
                "risk_score": 42,
                "risk_band": "Moderate"
            },
            {
                "email": "elena.rostova@abc.com",
                "username": "elena.rostova",
                "department": "Governance & Compliance",
                "role": "Lead Compliance Auditor",
                "account_type": "Auditor",
                "is_privileged": False,
                "business_criticality": "Medium",
                "associated_asset_ids": [created_assets["portal.abc.com"].id],
                "credential_exposure_count": 0,
                "risk_score": 25,
                "risk_band": "Low"
            }
        ]

        created_idents = {}
        for idef in ident_defs:
            if idef["email"] in existing_idents:
                created_idents[idef["email"]] = existing_idents[idef["email"]]
            else:
                ident = Identity(
                    organization_id=org.id,
                    email=idef["email"],
                    username=idef["username"],
                    department=idef["department"],
                    role=idef["role"],
                    account_type=idef["account_type"],
                    is_privileged=idef["is_privileged"],
                    business_criticality=idef["business_criticality"],
                    status="Active",
                    associated_asset_ids=idef["associated_asset_ids"],
                    credential_exposure_count=idef["credential_exposure_count"],
                    risk_score=idef["risk_score"],
                    risk_band=idef["risk_band"]
                )
                db.add(ident)
                db.commit()
                db.refresh(ident)
                created_idents[ident.email] = ident
        print(f"Identities created: {len(created_idents)}")

        # 6. Associate top vulnerabilities to assets
        v1 = db.query(Vulnerability).filter(Vulnerability.cve_id.ilike("%2024%")).first()
        if not v1:
            v1 = Vulnerability(
                cve_id="CVE-2024-3400",
                title="Palo Alto PAN-OS GlobalProtect Command Injection",
                description="A command injection vulnerability in the GlobalProtect feature of PAN-OS allows an unauthenticated attacker to execute arbitrary OS code with root privileges.",
                cvss_score=10.0,
                severity="Critical",
                published_date=datetime(2024, 4, 12),
                cisa_kev_status=True,
                affected_technology="Fortinet / Palo Alto VPN Gateway",
                associated_asset_id=created_assets["vpn.abc.com"].id,
                risk_contribution=95
            )
            db.add(v1)
            db.commit()
            db.refresh(v1)
        else:
            v1.associated_asset_id = created_assets["vpn.abc.com"].id
            db.commit()

        v2 = db.query(Vulnerability).filter(Vulnerability.cve_id.ilike("%2023%")).first()
        if v2:
            v2.associated_asset_id = created_assets["dev-test.abc.com"].id
            db.commit()

        # 7. Credential Exposures
        if db.query(CredentialExposure).filter(CredentialExposure.organization_id == org.id).count() == 0:
            exp1 = CredentialExposure(
                organization_id=org.id,
                identity_id=created_idents["alex.devops@abc.com"].id,
                email="alex.devops@abc.com",
                email_hash_sha256=hashlib.sha256(b"alex.devops@abc.com").hexdigest(),
                domain="abc.com",
                provider="Commercial Intelligence Feed",
                exposure_type="Infostealer Malware Log Metadata",
                breach_title="RedLine Stealer Botnet Dump 2026",
                breach_date=datetime(2024, 3, 14),
                first_observed=datetime.utcnow() - timedelta(days=22),
                last_observed=datetime.utcnow() - timedelta(days=3),
                confidence="Verified",
                severity="Critical",
                source_category="Infostealer Log Telemetry",
                related_asset_id=created_assets["vpn.abc.com"].id,
                risk_contribution=85,
                investigation_status="Under Investigation",
                exposed_data_classes=["Corporate Email", "System Username", "VPN Domain Reference"],
                description="Infostealer log telemetry recorded user session metadata matching corporate VPN endpoint. Identity holds privileged production access."
            )
            exp2 = CredentialExposure(
                organization_id=org.id,
                identity_id=created_idents["sarah.chen@abc.com"].id,
                email="sarah.chen@abc.com",
                email_hash_sha256=hashlib.sha256(b"sarah.chen@abc.com").hexdigest(),
                domain="abc.com",
                provider="Commercial Intelligence Feed",
                exposure_type="Data Breach",
                breach_title="Aggregated B2B SaaS Breach 2025",
                breach_date=datetime(2023, 11, 2),
                first_observed=datetime.utcnow() - timedelta(days=90),
                last_observed=datetime.utcnow() - timedelta(days=25),
                confidence="High",
                severity="High",
                source_category="Commercial Breach Intelligence",
                related_asset_id=created_assets["vpn.abc.com"].id,
                risk_contribution=70,
                investigation_status="Confirmed",
                exposed_data_classes=["Corporate Email", "Job Title", "Organization Name"],
                description="Historical B2B platform compromise included corporate email reference and role title."
            )
            exp3 = CredentialExposure(
                organization_id=org.id,
                identity_id=created_idents["david.finance@abc.com"].id,
                email="david.finance@abc.com",
                email_hash_sha256=hashlib.sha256(b"david.finance@abc.com").hexdigest(),
                domain="abc.com",
                provider="Commercial Intelligence Feed",
                exposure_type="Data Breach",
                breach_title="Corporate Travel Agency Aggregator Leak",
                breach_date=datetime(2023, 8, 15),
                first_observed=datetime.utcnow() - timedelta(days=120),
                last_observed=datetime.utcnow() - timedelta(days=50),
                confidence="Medium",
                severity="Moderate",
                source_category="Commercial Breach Intelligence",
                related_asset_id=created_assets["portal.abc.com"].id,
                risk_contribution=45,
                investigation_status="New",
                exposed_data_classes=["Email", "Phone Number"],
                description="Public aggregate breach of third-party corporate booking service."
            )
            db.add_all([exp1, exp2, exp3])
            db.commit()
            print("Credential exposures created.")

        # 8. Findings (Distinct refs for Abc Enterprise)
        if db.query(Finding).filter(Finding.organization_id == org.id).count() == 0:
            exp_first = db.query(CredentialExposure).filter(CredentialExposure.organization_id == org.id).first()
            f1 = Finding(
                finding_ref="EXP-ABC-001",
                title="Critical External VPN Exposure with Exploitable KEV & Privileged Identity Correlation",
                severity="Critical",
                risk_score=92,
                risk_band="Critical",
                organization_id=org.id,
                asset_id=created_assets["vpn.abc.com"].id,
                identity_id=created_idents["alex.devops@abc.com"].id,
                credential_exposure_id=exp_first.id if exp_first else None,
                vulnerability_id=v1.id,
                source="ExposureX Correlation Engine",
                evidence={
                    "asset": "vpn.abc.com (198.51.100.25:443)",
                    "vulnerability": f"{v1.cve_id} (CVSS {v1.cvss_score}, CISA KEV active exploit)",
                    "identity": "alex.devops@abc.com (Privileged DevOps account)",
                    "credential_event": "Infostealer log telemetry recorded targeting corporate perimeter"
                },
                first_seen=datetime.utcnow() - timedelta(days=6),
                last_seen=datetime.utcnow(),
                status="Investigating",
                owner="sam@abc.com",
                recommended_action=(
                    "1. Restrict public access to vpn.abc.com to authorized corporate IP blocks.\n"
                    "2. Apply emergency firmware patch for perimeter VPN.\n"
                    "3. Enforce MFA session revocation and password rotation for alex.devops@abc.com.\n"
                    "4. Monitor gateway access logs for abnormal session patterns."
                )
            )
            f2 = Finding(
                finding_ref="EXP-ABC-002",
                title="Publicly Exposed Development Service with Remote Code Execution Risk",
                severity="High",
                risk_score=71,
                risk_band="High",
                organization_id=org.id,
                asset_id=created_assets["dev-test.abc.com"].id,
                vulnerability_id=v2.id if v2 else None,
                source="ExposureX Asset Discovery",
                evidence={
                    "asset": "dev-test.abc.com:8080 (Apache Tomcat / Spring)",
                    "observation": "Non-production staging environment exposed directly to public internet without WAF"
                },
                first_seen=datetime.utcnow() - timedelta(days=12),
                last_seen=datetime.utcnow(),
                status="New",
                owner="sarah.chen@abc.com",
                recommended_action="De-expose port 8080 or place dev-test behind private VPN with strict access control."
            )
            f3 = Finding(
                finding_ref="EXP-ABC-003",
                title="Internet-Facing API Gateway Exposure Lacking Rate Limiting Headers",
                severity="Moderate",
                risk_score=45,
                risk_band="Moderate",
                organization_id=org.id,
                asset_id=created_assets["api.abc.com"].id,
                source="ExposureX Security Header Inspection",
                evidence={
                    "asset": "api.abc.com (FastAPI / Kong Gateway)",
                    "observation": "Missing RateLimit-Limit and Strict-Transport-Security preload headers"
                },
                first_seen=datetime.utcnow() - timedelta(days=20),
                last_seen=datetime.utcnow(),
                status="Confirmed",
                owner="sam@abc.com",
                recommended_action="Enforce HSTS preload policy and configure global rate limiting on API Gateway."
            )
            f4 = Finding(
                finding_ref="EXP-ABC-004",
                title="Permissive Cross-Origin Resource Sharing (CORS) on Authentication Broker",
                severity="Moderate",
                risk_score=50,
                risk_band="Moderate",
                organization_id=org.id,
                asset_id=created_assets["auth.abc.com"].id,
                source="ExposureX Configuration Audit",
                evidence={
                    "asset": "auth.abc.com (Keycloak SSO)",
                    "observation": "Access-Control-Allow-Origin header set to wildcard with credentials allowed"
                },
                first_seen=datetime.utcnow() - timedelta(days=8),
                last_seen=datetime.utcnow(),
                status="Remediating",
                owner="sarah.chen@abc.com",
                recommended_action="Constrain CORS origins strictly to *.abc.com and explicitly trusted third-party origins."
            )
            db.add_all([f1, f2, f3, f4])
            db.commit()
            print("Findings created.")

        # 9. Cases
        if db.query(SecurityCase).filter(SecurityCase.case_ref.like("INC-ABC%")).count() == 0:
            found_f1 = db.query(Finding).filter(Finding.finding_ref == "EXP-ABC-001").first()
            found_f2 = db.query(Finding).filter(Finding.finding_ref == "EXP-ABC-002").first()
            c1 = SecurityCase(
                case_ref="INC-ABC-001",
                organization_id=org.id,
                title="Critical VPN Exposure & Privileged Credential Correlation",
                severity="Critical",
                risk_score=92,
                description="Correlated critical incident: Internet-facing perimeter VPN (vpn.abc.com) running vulnerable software with CISA KEV exploitation active, coupled with an active infostealer credential exposure for privileged DevOps account alex.devops@abc.com.",
                evidence={
                    "finding_ref": "EXP-ABC-001",
                    "asset": "vpn.abc.com",
                    "identity": "alex.devops@abc.com",
                    "priority": "P1 - Critical Incident Response"
                },
                assigned_analyst="sam@abc.com",
                status="Investigating",
                related_finding_ids=[found_f1.id] if found_f1 else [],
                related_asset_ids=[created_assets["vpn.abc.com"].id],
                resolution=None
            )
            c2 = SecurityCase(
                case_ref="INC-ABC-002",
                organization_id=org.id,
                title="Publicly Exposed Development Environment Remediation",
                severity="High",
                risk_score=71,
                description="Investigation into unmanaged dev-test.abc.com exposed to public internet on port 8080 with potential remote code execution vector.",
                evidence={
                    "finding_ref": "EXP-ABC-002",
                    "asset": "dev-test.abc.com",
                    "priority": "P2 - High Priority"
                },
                assigned_analyst="sarah.chen@abc.com",
                status="Open",
                related_finding_ids=[found_f2.id] if found_f2 else [],
                related_asset_ids=[created_assets["dev-test.abc.com"].id],
                resolution=None
            )
            c3 = SecurityCase(
                case_ref="INC-ABC-003",
                organization_id=org.id,
                title="Quarterly External Attack Surface Assessment & Hardening",
                severity="Moderate",
                risk_score=45,
                description="Routine quarterly verification of external IP boundaries, certificate lifecycles, and API security headers.",
                evidence={
                    "scope": "abc.com / *.abc.com / 198.51.100.0/24",
                    "priority": "P3 - Standard Audit"
                },
                assigned_analyst="sam@abc.com",
                status="Resolved",
                related_finding_ids=[],
                related_asset_ids=[created_assets["abc.com"].id],
                resolution="All subdomains inventoried, SPF/DMARC records validated, and API rate limiting deployed."
            )
            db.add_all([c1, c2, c3])
            db.commit()
            print("Security cases created.")

        # 10. Vendors (Third-Party Risk)
        if db.query(Vendor).filter(Vendor.organization_id == org.id).count() == 0:
            vendors = [
                Vendor(
                    organization_id=org.id,
                    name="Cloudflare Enterprise Edge Services",
                    domain="cloudflare.com",
                    category="SaaS Provider",
                    contact_email="security@cloudflare.com",
                    business_criticality="Critical",
                    data_sensitivity="Confidential",
                    external_exposure_score=22.0,
                    vulnerability_score=18.0,
                    credential_score=25.0,
                    email_security_score=95.0,
                    hygiene_score=98.0,
                    overall_risk_score=24,
                    risk_band="Low",
                    assessment_status="Active",
                    notes="Provides primary Edge DNS, DDoS mitigation, and WAF protection."
                ),
                Vendor(
                    organization_id=org.id,
                    name="Amazon Web Services Infrastructure",
                    domain="aws.amazon.com",
                    category="Cloud Hosting",
                    contact_email="aws-security@amazon.com",
                    business_criticality="Critical",
                    data_sensitivity="Restricted",
                    external_exposure_score=25.0,
                    vulnerability_score=22.0,
                    credential_score=30.0,
                    email_security_score=92.0,
                    hygiene_score=95.0,
                    overall_risk_score=28,
                    risk_band="Low",
                    assessment_status="Active",
                    notes="Houses primary VPC infrastructure, databases, and microservices."
                ),
                Vendor(
                    organization_id=org.id,
                    name="Okta Workforce Identity Cloud",
                    domain="okta.com",
                    category="IT Services",
                    contact_email="security@okta.com",
                    business_criticality="Critical",
                    data_sensitivity="Restricted",
                    external_exposure_score=30.0,
                    vulnerability_score=28.0,
                    credential_score=35.0,
                    email_security_score=90.0,
                    hygiene_score=92.0,
                    overall_risk_score=32,
                    risk_band="Low",
                    assessment_status="Active",
                    notes="Single Sign-On and Multi-Factor Authentication federated gateway."
                ),
                Vendor(
                    organization_id=org.id,
                    name="Salesforce CRM Enterprise Platform",
                    domain="salesforce.com",
                    category="SaaS Provider",
                    contact_email="trust@salesforce.com",
                    business_criticality="High",
                    data_sensitivity="Confidential",
                    external_exposure_score=42.0,
                    vulnerability_score=45.0,
                    credential_score=48.0,
                    email_security_score=85.0,
                    hygiene_score=88.0,
                    overall_risk_score=45,
                    risk_band="Moderate",
                    assessment_status="Active",
                    notes="Customer Relationship Management and partner communications platform."
                ),
                Vendor(
                    organization_id=org.id,
                    name="Atlassian Enterprise Systems",
                    domain="atlassian.net",
                    category="IT Services",
                    contact_email="security@atlassian.com",
                    business_criticality="High",
                    data_sensitivity="Internal",
                    external_exposure_score=55.0,
                    vulnerability_score=52.0,
                    credential_score=50.0,
                    email_security_score=80.0,
                    hygiene_score=82.0,
                    overall_risk_score=54,
                    risk_band="High",
                    assessment_status="Active",
                    notes="Engineering task tracking, sprint management, and internal wiki documentation."
                )
            ]
            db.add_all(vendors)
            db.commit()
            print("Third-party vendors created.")

        # 11. Security Pulse Notifications
        if db.query(SecurityPulseNotification).count() == 0:
            db.add_all([
                SecurityPulseNotification(
                    title="🚨 CRITICAL EXPOSURE DETECTED",
                    message="Perimeter asset vpn.abc.com correlates with an active CISA KEV catalog exploit and exposed credentials.",
                    severity="Critical",
                    event_type="critical_exposure",
                    reasons=[
                        "Actively exploited vulnerability detected on perimeter VPN",
                        "Privileged DevOps credential identified in external infostealer log telemetry",
                        "External asset designated with Critical business criticality"
                    ],
                    action_url="/operations/findings",
                    is_read=False
                ),
                SecurityPulseNotification(
                    title="⚠️ Non-Production Asset Exposed to Public Internet",
                    message="dev-test.abc.com discovered listening on port 8080 with outdated Spring runtime.",
                    severity="High",
                    event_type="asset_discovered",
                    reasons=["Exposed non-production asset", "High CVSS CVE correlation"],
                    action_url="/exposure/assets",
                    is_read=False
                ),
                SecurityPulseNotification(
                    title="ℹ️ Third-Party Vendor Risk Assessment Synchronized",
                    message="Cloudflare Enterprise Edge and Okta Workforce Identity posture refreshed.",
                    severity="Low",
                    event_type="vendor_updated",
                    reasons=["Routine vendor continuous monitoring score updated"],
                    action_url="/risk/third-party",
                    is_read=True
                )
            ])
            db.commit()
            print("Security pulse notifications created.")

        print("SUCCESS: Abc Enterprise CTEM data seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_abc()
