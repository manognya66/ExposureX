"""Seed script to populate realistic synthetic enterprise data for ExposureX Demo Mode"""
from datetime import datetime, timedelta
import hashlib
from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.models.organization import Organization, ApprovedScope
from app.models.asset import Asset, AssetRelationship
from app.models.identity import Identity
from app.models.credential import CredentialExposure, CredentialProvider
from app.models.vulnerability import Vulnerability
from app.models.finding import Finding
from app.models.case import SecurityCase, CaseComment
from app.models.risk import RiskScoreRecord
from app.models.vendor import Vendor
from app.models.notification import SecurityPulseNotification
from app.models.audit import AuditLog
from app.core.security import hash_password

def seed_database(db: Session, seed_users: bool = False):
    """Seed comprehensive realistic enterprise dataset without dummy users by default"""
    # Check if already seeded
    if db.query(Organization).filter(Organization.name == "Acme Global Enterprise").first():
        return

    # 1. Organization
    org = Organization(
        name="Acme Global Enterprise",
        description="Global enterprise infrastructure scope for continuous exposure management",
        domain_primary="company.com"
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    # 2. Approved Scopes (Explicit scope boundaries)
    scope1 = ApprovedScope(
        organization_id=org.id,
        scope_type="Domain",
        pattern="company.com",
        description="Primary root domain scope",
        is_active=True,
        approved_by="CISO Office"
    )
    scope2 = ApprovedScope(
        organization_id=org.id,
        scope_type="Wildcard",
        pattern="*.company.com",
        description="All authorized subdomains under company.com",
        is_active=True,
        approved_by="CISO Office"
    )
    scope3 = ApprovedScope(
        organization_id=org.id,
        scope_type="CIDR",
        pattern="198.51.100.0/24",
        description="Authorized DMZ external IP block",
        is_active=True,
        approved_by="Network Security Board"
    )
    db.add_all([scope1, scope2, scope3])
    db.commit()

    # 3. Users (Only seeded when seed_users is True, e.g. in test suite)
    if seed_users:
        default_pwd_hash = hash_password("ExposureX@2026!")
        users = [
            User(
                id="00000000-0000-0000-0000-000000000001",
                email="admin@company.com",
                hashed_password=default_pwd_hash,
                full_name="Alex Vance",
                role=RoleEnum.ADMINISTRATOR.value,
                organization_id=org.id
            ),
            User(
                id="00000000-0000-0000-0000-000000000002",
                email="security@company.com",
                hashed_password=default_pwd_hash,
                full_name="Sarah Chen",
                role=RoleEnum.SECURITY_ANALYST.value,
                organization_id=org.id
            ),
            User(
                id="00000000-0000-0000-0000-000000000003",
                email="risk@company.com",
                hashed_password=default_pwd_hash,
                full_name="Marcus Brody",
                role=RoleEnum.RISK_MANAGER.value,
                organization_id=org.id
            ),
            User(
                id="00000000-0000-0000-0000-000000000004",
                email="auditor@company.com",
                hashed_password=default_pwd_hash,
                full_name="Elena Rostova",
                role=RoleEnum.AUDITOR.value,
                organization_id=org.id
            ),
            User(
                id="00000000-0000-0000-0000-000000000005",
                email="viewer@company.com",
                hashed_password=default_pwd_hash,
                full_name="David Miller",
                role=RoleEnum.VIEWER.value,
                organization_id=org.id
            )
        ]
        db.add_all(users)
        db.commit()


    # 4. Credential Providers
    if db.query(CredentialProvider).count() == 0:
        cred_providers = [
            CredentialProvider(name="XposedOrNot Community", code="XposedOrNot", provider_type="Community Breach Registry", is_configured=True, api_status="Healthy"),
            CredentialProvider(name="LeakCheck Public API", code="LeakCheck", provider_type="Public Breach Intelligence", is_configured=True, api_status="Healthy"),
            CredentialProvider(name="Hudson Rock Cavalier", code="HudsonRock", provider_type="Infostealer Cybercrime Intelligence", is_configured=True, api_status="Healthy"),
        ]
        db.add_all(cred_providers)
        db.commit()

    # 5. External Assets
    vpn_asset = Asset(
        organization_id=org.id,
        name="vpn.company.com",
        asset_type="Subdomain",
        domain="vpn.company.com",
        ip="198.51.100.10",
        port=443,
        protocol="HTTPS",
        technology="Palo Alto GlobalProtect VPN Gateway",
        discovery_source="Certificate Transparency & DNS",
        first_seen=datetime.utcnow() - timedelta(days=45),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="Critical",
        owner="Network Security Team",
        tags=["Perimeter", "VPN", "Critical Infrastructure"],
        risk_score=84,
        risk_band="Critical",
        metadata_info={"asn": "AS13335", "tls_version": "TLSv1.2", "server_header": "PAN-OS"}
    )
    portal_asset = Asset(
        organization_id=org.id,
        name="portal.company.com",
        asset_type="Web Application",
        domain="portal.company.com",
        ip="198.51.100.12",
        port=443,
        protocol="HTTPS",
        technology="Next.js / Node.js Reverse Proxy",
        discovery_source="Certificate Transparency",
        first_seen=datetime.utcnow() - timedelta(days=60),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="High",
        owner="Product Engineering",
        tags=["Customer Facing", "Web Portal"],
        risk_score=52,
        risk_band="High",
        metadata_info={"asn": "AS13335", "tls_version": "TLSv1.3"}
    )
    mail_asset = Asset(
        organization_id=org.id,
        name="mail.company.com",
        asset_type="Subdomain",
        domain="mail.company.com",
        ip="198.51.100.15",
        port=443,
        protocol="HTTPS",
        technology="Microsoft Exchange Hybrid",
        discovery_source="DNS Intelligence",
        first_seen=datetime.utcnow() - timedelta(days=120),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="High",
        owner="Enterprise IT Ops",
        tags=["Email", "MX Gateway"],
        risk_score=48,
        risk_band="Moderate",
        metadata_info={"asn": "AS13335"}
    )
    api_asset = Asset(
        organization_id=org.id,
        name="api.company.com",
        asset_type="API Endpoint",
        domain="api.company.com",
        ip="198.51.100.20",
        port=443,
        protocol="HTTPS",
        technology="Kong API Gateway / GraphQL",
        discovery_source="Certificate Transparency",
        first_seen=datetime.utcnow() - timedelta(days=30),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="High",
        owner="Platform API Team",
        tags=["API", "Public Interface"],
        risk_score=62,
        risk_band="High",
        metadata_info={"asn": "AS13335"}
    )
    dev_asset = Asset(
        organization_id=org.id,
        name="dev-test.company.com",
        asset_type="Host",
        domain="dev-test.company.com",
        ip="198.51.100.99",
        port=8080,
        protocol="HTTP",
        technology="Apache Tomcat / Spring Framework",
        discovery_source="Subdomain Passive Enumeration",
        first_seen=datetime.utcnow() - timedelta(days=12),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="Medium",
        owner="Legacy Dev Team",
        tags=["Dev", "Non-Production Exposed"],
        risk_score=71,
        risk_band="High",
        metadata_info={"port": 8080}
    )
    root_asset = Asset(
        organization_id=org.id,
        name="company.com",
        asset_type="Domain",
        domain="company.com",
        ip="198.51.100.1",
        port=443,
        protocol="HTTPS",
        technology="Cloudflare CDN / WAF",
        discovery_source="DNS Apex Zone",
        first_seen=datetime.utcnow() - timedelta(days=300),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="Critical",
        owner="Marketing & Communications",
        tags=["Apex Domain", "CDN"],
        risk_score=35,
        risk_band="Moderate",
        metadata_info={"cdn": "Cloudflare"}
    )
    cert_asset = Asset(
        organization_id=org.id,
        name="Wildcard SSL (*.company.com)",
        asset_type="Certificate",
        domain="*.company.com",
        discovery_source="Certificate Transparency",
        first_seen=datetime.utcnow() - timedelta(days=90),
        last_seen=datetime.utcnow(),
        status="Active",
        business_criticality="High",
        owner="Infrastructure Security",
        tags=["SSL/TLS", "DigiCert"],
        risk_score=20,
        risk_band="Low",
        metadata_info={"issuer": "DigiCert Global Root CA", "expires": "2027-01-15"}
    )
    db.add_all([vpn_asset, portal_asset, mail_asset, api_asset, dev_asset, root_asset, cert_asset])
    db.commit()
    for a in [vpn_asset, portal_asset, mail_asset, api_asset, dev_asset, root_asset, cert_asset]:
        db.refresh(a)

    # Asset Relationships
    rel1 = AssetRelationship(source_asset_id=vpn_asset.id, target_asset_id=root_asset.id, relationship_type="subdomain_of")
    rel2 = AssetRelationship(source_asset_id=portal_asset.id, target_asset_id=root_asset.id, relationship_type="subdomain_of")
    rel3 = AssetRelationship(source_asset_id=cert_asset.id, target_asset_id=vpn_asset.id, relationship_type="secures_cert")
    db.add_all([rel1, rel2, rel3])
    db.commit()

    # 6. Vulnerabilities
    v1 = Vulnerability(
        cve_id="CVE-2024-3400",
        title="Palo Alto PAN-OS GlobalProtect Command Injection",
        description="A command injection vulnerability in the GlobalProtect feature of PAN-OS allows an unauthenticated attacker to execute arbitrary OS code with root privileges.",
        cvss_score=10.0,
        cvss_vector="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        severity="Critical",
        published_date=datetime(2024, 4, 12),
        cisa_kev_status=True,
        cisa_kev_date_added=datetime(2024, 4, 12),
        affected_technology="Palo Alto Networks PAN-OS GlobalProtect",
        references=["https://nvd.nist.gov/vuln/detail/CVE-2024-3400", "https://security.paloaltonetworks.com/CVE-2024-3400"],
        associated_asset_id=vpn_asset.id,
        risk_contribution=95
    )
    v2 = Vulnerability(
        cve_id="CVE-2022-22965",
        title="Spring Framework Remote Code Execution (Spring4Shell)",
        description="A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable to remote code execution via data binding parameter injection.",
        cvss_score=9.8,
        severity="Critical",
        published_date=datetime(2022, 3, 31),
        cisa_kev_status=True,
        affected_technology="Spring Framework / Apache Tomcat",
        associated_asset_id=dev_asset.id,
        risk_contribution=85
    )
    v3 = Vulnerability(
        cve_id="CVE-2023-46805",
        title="Ivanti Connect Secure Authentication Bypass",
        description="An authentication bypass vulnerability in web components allows access to restricted resources.",
        cvss_score=8.2,
        severity="High",
        published_date=datetime(2024, 1, 10),
        cisa_kev_status=True,
        affected_technology="Ivanti Connect Secure",
        associated_asset_id=vpn_asset.id,
        risk_contribution=75
    )
    db.add_all([v1, v2, v3])
    db.commit()
    for v in [v1, v2, v3]:
        db.refresh(v)

    # 7. Identities
    identities = [
        Identity(
            organization_id=org.id,
            email="admin@company.com",
            username="admin.root",
            department="Infrastructure Engineering",
            role="Principal Cloud Architect",
            account_type="Privileged account",
            is_privileged=True,
            business_criticality="Critical",
            status="Active",
            associated_asset_ids=[vpn_asset.id, "company.com"],
            credential_exposure_count=1,
            risk_score=75,
            risk_band="Critical"
        ),
        Identity(
            organization_id=org.id,
            email="security@company.com",
            username="sarah.chen",
            department="Information Security",
            role="Incident Response Lead",
            account_type="Privileged account",
            is_privileged=True,
            business_criticality="High",
            status="Active",
            associated_asset_ids=[vpn_asset.id],
            credential_exposure_count=0,
            risk_score=35,
            risk_band="Moderate"
        ),
        Identity(
            organization_id=org.id,
            email="employee1@company.com",
            username="john.devops",
            department="DevOps & Reliability",
            role="Senior DevOps Engineer",
            account_type="Privileged account",
            is_privileged=True,
            business_criticality="High",
            status="Active",
            associated_asset_ids=[vpn_asset.id, dev_asset.id],
            credential_exposure_count=2,
            risk_score=85,
            risk_band="Critical"
        ),
        Identity(
            organization_id=org.id,
            email="employee2@company.com",
            username="lucas.finance",
            department="Corporate Finance",
            role="Financial Analyst",
            account_type="Employee",
            is_privileged=False,
            business_criticality="Medium",
            status="Active",
            associated_asset_ids=[portal_asset.id],
            credential_exposure_count=1,
            risk_score=42,
            risk_band="Moderate"
        ),
        Identity(
            organization_id=org.id,
            email="contractor.jane@company.com",
            username="jane.qa.ext",
            department="Quality Assurance (Vendor)",
            role="Contractor QA Specialist",
            account_type="Contractor",
            is_privileged=False,
            business_criticality="Low",
            status="Active",
            associated_asset_ids=[portal_asset.id],
            credential_exposure_count=1,
            risk_score=38,
            risk_band="Moderate"
        ),
    ]
    db.add_all(identities)
    db.commit()
    for i in identities:
        db.refresh(i)

    # 8. Credential Exposures (Sanitized minimized metadata ONLY — NO PASSWORDS)
    exp1 = CredentialExposure(
        organization_id=org.id,
        identity_id=identities[2].id, # employee1@company.com
        email="employee1@company.com",
        email_hash_sha256=hashlib.sha256(b"employee1@company.com").hexdigest(),
        domain="company.com",
        provider="Commercial Intelligence Feed",
        exposure_type="Infostealer Malware Log Metadata",
        breach_title="RedLine Stealer Enterprise Aggregation #4",
        breach_date=datetime(2024, 3, 14),
        first_observed=datetime.utcnow() - timedelta(days=22),
        last_observed=datetime.utcnow() - timedelta(days=5),
        confidence="Verified",
        severity="Critical",
        source_category="Infostealer Log Telemetry",
        related_asset_id=vpn_asset.id,
        risk_contribution=85,
        investigation_status="Under Investigation",
        exposed_data_classes=["Corporate Email", "System Username", "VPN Domain Reference"],
        description="Infostealer log telemetry recorded user session metadata matching corporate VPN endpoint. Identity holds privileged production access."
    )
    exp2 = CredentialExposure(
        organization_id=org.id,
        identity_id=identities[0].id, # admin@company.com
        email="admin@company.com",
        email_hash_sha256=hashlib.sha256(b"admin@company.com").hexdigest(),
        domain="company.com",
        provider="Commercial Intelligence Feed",
        exposure_type="Data Breach",
        breach_title="Aggregated B2B SaaS Breach 2023",
        breach_date=datetime(2023, 11, 2),
        first_observed=datetime.utcnow() - timedelta(days=90),
        last_observed=datetime.utcnow() - timedelta(days=30),
        confidence="High",
        severity="High",
        source_category="Commercial Breach Intelligence",
        related_asset_id=vpn_asset.id,
        risk_contribution=70,
        investigation_status="Confirmed",
        exposed_data_classes=["Corporate Email", "Job Title", "Organization Name"],
        description="Historical B2B platform compromise included corporate email reference and role title."
    )
    exp3 = CredentialExposure(
        organization_id=org.id,
        identity_id=identities[3].id, # employee2@company.com
        email="employee2@company.com",
        email_hash_sha256=hashlib.sha256(b"employee2@company.com").hexdigest(),
        domain="company.com",
        provider="Commercial Intelligence Feed",
        exposure_type="Data Breach",
        breach_title="Corporate Travel Agency Leak",
        breach_date=datetime(2023, 8, 15),
        first_observed=datetime.utcnow() - timedelta(days=120),
        last_observed=datetime.utcnow() - timedelta(days=60),
        confidence="Medium",
        severity="Moderate",
        source_category="Commercial Breach Intelligence",
        related_asset_id=portal_asset.id,
        risk_contribution=45,
        investigation_status="New",
        exposed_data_classes=["Email", "Phone Number"],
        description="Public aggregate breach of third-party corporate booking service."
    )
    db.add_all([exp1, exp2, exp3])
    db.commit()
    for e in [exp1, exp2, exp3]:
        db.refresh(e)

    # 9. Findings
    f1 = Finding(
        finding_ref="EXP-00042",
        title="Critical External VPN Exposure with Exploitable KEV & Privileged Identity Correlation",
        severity="Critical",
        risk_score=84,
        risk_band="Critical",
        organization_id=org.id,
        asset_id=vpn_asset.id,
        identity_id=identities[2].id, # employee1
        credential_exposure_id=exp1.id,
        vulnerability_id=v1.id,
        source="ExposureX Correlation Engine",
        evidence={
            "asset": "vpn.company.com (198.51.100.10:443)",
            "vulnerability": "CVE-2024-3400 (CVSS 10.0, CISA KEV active exploit)",
            "identity": "employee1@company.com (Privileged DevOps account)",
            "credential_event": "Infostealer log telemetry recorded targeting VPN gateway"
        },
        first_seen=datetime.utcnow() - timedelta(days=6),
        last_seen=datetime.utcnow(),
        status="Investigating",
        owner="security@company.com",
        recommended_action=(
            "1. Validate and restrict public access to vpn.company.com.\n"
            "2. Apply emergency PAN-OS patch for CVE-2024-3400 immediately.\n"
            "3. Enforce MFA session revocation and password rotation for employee1@company.com.\n"
            "4. Monitor access logs for unauthorized VPN sessions."
        )
    )
    f2 = Finding(
        finding_ref="EXP-00043",
        title="Publicly Exposed Development Service with Remote Code Execution Risk",
        severity="High",
        risk_score=71,
        risk_band="High",
        organization_id=org.id,
        asset_id=dev_asset.id,
        vulnerability_id=v2.id,
        source="ExposureX Asset Discovery",
        evidence={
            "asset": "dev-test.company.com:8080 (Apache Tomcat)",
            "vulnerability": "CVE-2022-22965 (Spring4Shell)",
            "risk_driver": "Non-production environment exposed directly to public internet without WAF"
        },
        first_seen=datetime.utcnow() - timedelta(days=12),
        last_seen=datetime.utcnow(),
        status="New",
        owner="security@company.com",
        recommended_action="De-expose port 8080 or place dev-test behind private VPN with strict access control."
    )
    f3 = Finding(
        finding_ref="EXP-00044",
        title="Internet-Facing API Gateway Exposure Lacking Rate Limiting Headers",
        severity="Moderate",
        risk_score=45,
        risk_band="Moderate",
        organization_id=org.id,
        asset_id=api_asset.id,
        source="ExposureX Security Header Inspection",
        evidence={
            "asset": "api.company.com (Kong Gateway)",
            "observation": "Missing RateLimit-Limit and Strict-Transport-Security preload headers"
        },
        first_seen=datetime.utcnow() - timedelta(days=20),
        last_seen=datetime.utcnow(),
        status="New",
        owner="security@company.com",
        recommended_action="Enforce HSTS preload policy and configure global rate limiting on Kong API Gateway."
    )
    db.add_all([f1, f2, f3])
    db.commit()
    for f in [f1, f2, f3]:
        db.refresh(f)

    # 10. Security Case
    case1 = SecurityCase(
        case_ref="INC-0001",
        title="Critical VPN Exposure & Privileged Credential Correlation",
        severity="Critical",
        risk_score=84,
        description="Correlated critical incident: Internet-facing perimeter VPN (vpn.company.com) running vulnerable PAN-OS software with CISA KEV exploitation active, coupled with an active infostealer credential exposure for privileged DevOps account employee1@company.com.",
        evidence={
            "primary_asset": "vpn.company.com",
            "cve": "CVE-2024-3400",
            "exposed_account": "employee1@company.com",
            "breach": "RedLine Stealer Enterprise Aggregation #4"
        },
        organization_id=org.id,
        assigned_analyst="Sarah Chen (Sec Analyst)",
        assigned_analyst_id=users[1].id if ('users' in locals() and users) else None,
        status="Investigating",
        related_finding_ids=[f1.id],
        related_asset_ids=[vpn_asset.id],
        related_identity_ids=[identities[2].id],
        analyst_notes="Initial triage completed. Verified asset is internet-facing. Contacted DevOps engineer to revoke active sessions and rotate SSO credentials.",
        audit_history=[
            {"timestamp": str(datetime.utcnow() - timedelta(hours=5)), "action": "Case Created from Finding EXP-00042", "user": "security@company.com"},
            {"timestamp": str(datetime.utcnow() - timedelta(hours=3)), "action": "Status changed to Investigating", "user": "security@company.com"}
        ]
    )
    db.add(case1)
    db.commit()
    db.refresh(case1)

    comment1 = CaseComment(
        case_id=case1.id,
        user_id=users[1].id if ('users' in locals() and users) else None,
        user_name="Sarah Chen (Sec Analyst)",
        comment="Confirmed that Palo Alto PAN-OS 10.2.7-h2 was running on the primary gateway. Recommending emergency hotfix deployment in tonight's maintenance window.",
        created_at=datetime.utcnow() - timedelta(hours=2)
    )
    db.add(comment1)
    db.commit()

    # 11. Third-Party Vendors (Separated Third-Party Risk Assessment)
    vendors = [
        Vendor(
            organization_id=org.id,
            name="Apex Payment Gateway",
            domain="apexpay-gateway.com",
            category="Payment Gateway",
            contact_email="security@apexpay-gateway.com",
            business_criticality="Critical",
            data_sensitivity="Restricted",
            external_exposure_score=78.0,
            vulnerability_score=65.0,
            credential_score=58.0,
            email_security_score=82.0,
            hygiene_score=70.0,
            overall_risk_score=68,
            risk_band="High",
            assessment_status="Active",
            notes="Processes global credit card transactions. 2 moderate web vulnerabilities noted in Q3 audit.",
            evidence={"cve_count": 2, "dmarc_enforced": True, "tls_score": "A"}
        ),
        Vendor(
            organization_id=org.id,
            name="SaaS CRM Solutions",
            domain="salescrm360.io",
            category="SaaS Provider",
            contact_email="support@salescrm360.io",
            business_criticality="High",
            data_sensitivity="Confidential",
            external_exposure_score=85.0,
            vulnerability_score=78.0,
            credential_score=72.0,
            email_security_score=60.0,
            hygiene_score=62.0,
            overall_risk_score=76,
            risk_band="Critical",
            assessment_status="Active",
            notes="Recent third-party credential leaks detected containing salescrm360.io employee accounts.",
            evidence={"recent_leaks": 4, "dmarc_enforced": False}
        ),
        Vendor(
            organization_id=org.id,
            name="CloudHost Global",
            domain="cloudhost-infra.net",
            category="Cloud Hosting",
            contact_email="soc@cloudhost-infra.net",
            business_criticality="High",
            data_sensitivity="Confidential",
            external_exposure_score=52.0,
            vulnerability_score=45.0,
            credential_score=40.0,
            email_security_score=90.0,
            hygiene_score=85.0,
            overall_risk_score=48,
            risk_band="Moderate",
            assessment_status="Active",
            notes="Routine infrastructure hosting provider. Clean perimeter and enforced DMARC.",
            evidence={"tls_score": "A+"}
        ),
        Vendor(
            organization_id=org.id,
            name="DevSec Analytics",
            domain="devsec-analytics.co",
            category="Analytics",
            contact_email="privacy@devsec-analytics.co",
            business_criticality="Low",
            data_sensitivity="Public",
            external_exposure_score=25.0,
            vulnerability_score=20.0,
            credential_score=15.0,
            email_security_score=95.0,
            hygiene_score=92.0,
            overall_risk_score=22,
            risk_band="Low",
            assessment_status="Active",
            notes="Low risk vendor. Provides anonymized web analytics.",
            evidence={"tls_score": "A+"}
        )
    ]
    db.add_all(vendors)
    db.commit()

    # 12. Security Pulse Notifications
    notifications = [
        SecurityPulseNotification(
            organization_id=org.id,
            title="CRITICAL EXPOSURE DETECTED",
            message="Internet-facing VPN Gateway correlates with actively exploited CVE-2024-3400 and exposed privileged DevOps credentials.",
            severity="Critical",
            event_type="critical_exposure",
            related_entity_type="asset",
            related_entity_id=vpn_asset.id,
            reasons=[
                "Actively exploited vulnerability (CVE-2024-3400 in CISA KEV catalog)",
                "Privileged identity credential exposure detected (employee1@company.com)",
                "Critical business perimeter asset"
            ],
            action_url=f"/operations/findings",
            is_read=False,
            timestamp=datetime.utcnow() - timedelta(minutes=45)
        ),
        SecurityPulseNotification(
            organization_id=org.id,
            title="NEW CREDENTIAL EXPOSURE",
            message="Commercial intelligence feed reported 1 new exposure event for privileged account employee1@company.com.",
            severity="High",
            event_type="new_credential_exposure",
            related_entity_type="identity",
            related_entity_id=identities[2].id,
            reasons=["Source: RedLine Stealer Enterprise Aggregation #4", "Confidence: Verified"],
            action_url="/exposure/credentials",
            is_read=False,
            timestamp=datetime.utcnow() - timedelta(hours=3)
        ),
        SecurityPulseNotification(
            organization_id=org.id,
            title="THIRD-PARTY RISK INCREASE",
            message="Vendor SaaS CRM Solutions (salescrm360.io) risk score elevated to 76 (Critical) following credential telemetry.",
            severity="High",
            event_type="third_party_risk_increase",
            related_entity_type="vendor",
            reasons=["Credential exposure score spiked to 72/100", "Missing strict DMARC enforcement"],
            action_url="/risk/third-party",
            is_read=True,
            timestamp=datetime.utcnow() - timedelta(hours=14)
        )
    ]
    db.add_all(notifications)
    db.commit()

    # 13. Audit Logs
    audit_events = [
        AuditLog(
            user="admin@company.com",
            action="LOGIN",
            object="System Authentication",
            result="SUCCESS",
            ip_address="198.51.100.5",
            metadata_info={"mfa_verified": True}
        ),
        AuditLog(
            user="admin@company.com",
            action="SCOPE_ADD",
            object="ApprovedScope: *.company.com",
            new_value="Wildcard subdomain scope approved by CISO Office",
            result="SUCCESS",
            ip_address="198.51.100.5"
        ),
        AuditLog(
            user="security@company.com",
            action="CASE_CREATE",
            object="Case: INC-0001",
            new_value="Created case for Critical VPN Exposure & Privileged Credential Correlation",
            result="SUCCESS",
            ip_address="198.51.100.12"
        ),
        AuditLog(
            user="security@company.com",
            action="FINDING_STATUS_CHANGE",
            object="Finding: EXP-00042",
            previous_value="New",
            new_value="Investigating",
            result="SUCCESS",
            ip_address="198.51.100.12"
        )
    ]
    db.add_all(audit_events)
    db.commit()
