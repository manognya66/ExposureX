"""Internal Risk Assessment and Explainability Engine API"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.asset import Asset
from app.models.vulnerability import Vulnerability
from app.models.credential import CredentialExposure
from app.models.identity import Identity
from app.models.finding import Finding
from app.models.organization import Organization
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/risk", tags=["Risk Intelligence & Assessment"])

class WeightConfiguration(BaseModel):
    exposure: float = 0.30
    vulnerability: float = 0.25
    credential_exposure: float = 0.25
    business_impact: float = 0.20

# In-memory default weights (configurable)
ACTIVE_WEIGHTS = {
    "exposure": 0.30,
    "vulnerability": 0.25,
    "credential_exposure": 0.25,
    "business_impact": 0.20
}

@router.get("/internal-assessment")
def get_internal_risk_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Calculates overall Internal Organizational Risk Assessment and factor breakdowns"""
    assets = db.query(Asset).all()
    vulns = db.query(Vulnerability).all()
    exposures = db.query(CredentialExposure).all()
    identities = db.query(Identity).all()

    # 1. External Exposure score (0-100)
    active_assets = [a for a in assets if a.status == "Active"]
    exposure_score = min(100.0, len(active_assets) * 15.0) if active_assets else 0.0

    # 2. Vulnerability Posture score (0-100)
    has_kev = any(v.cisa_kev_status for v in vulns)
    max_cvss = max([v.cvss_score for v in vulns], default=0.0)
    if has_kev:
        vuln_score = 92.0
    elif max_cvss >= 9.0:
        vuln_score = 85.0
    elif len(vulns) > 0:
        vuln_score = 65.0
    else:
        vuln_score = 0.0

    # 3. Credential Exposure score (0-100)
    priv_exposed = any(i.is_privileged and i.credential_exposure_count > 0 for i in identities)
    if priv_exposed:
        credential_score = 88.0
    elif len(exposures) > 0:
        credential_score = 60.0
    else:
        credential_score = 0.0

    # 4. Business Impact score (0-100)
    crit_assets_count = len([a for a in assets if a.business_criticality == "Critical"])
    business_impact_score = min(100.0, crit_assets_count * 25.0) if assets else 0.0

    # Composite Score calculation using active weights
    w = ACTIVE_WEIGHTS
    overall = int(round(
        (exposure_score * w["exposure"]) +
        (vuln_score * w["vulnerability"]) +
        (credential_score * w["credential_exposure"]) +
        (business_impact_score * w["business_impact"])
    )) if (assets or vulns or exposures) else 0
    overall = max(0, min(100, overall))

    if overall >= 75:
        band = "CRITICAL"
    elif overall >= 50:
        band = "HIGH"
    elif overall >= 25:
        band = "MODERATE"
    else:
        band = "LOW"

    # 14-day trend history
    today = datetime.utcnow()
    trend = []
    for i in range(14):
        d = today - timedelta(days=13 - i)
        trend.append({"date": d.strftime("%b %d"), "score": overall})

    # Organization name
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first() if current_user.organization_id else None
    org_name = org.name if org else "Abc Enterprise"

    return {
        "overall_score": overall,
        "risk_band": band,
        "org_name": org_name,
        "formula": f"Internal Risk = (Exposure × {int(w['exposure']*100)}%) + (Vulnerability × {int(w['vulnerability']*100)}%) + (Credential × {int(w['credential_exposure']*100)}%) + (BusinessImpact × {int(w['business_impact']*100)}%)",
        "pillars": {
            "exposure": round(exposure_score, 1),
            "vulnerability": round(vuln_score, 1),
            "credential_exposure": round(credential_score, 1),
            "business_impact": round(business_impact_score, 1)
        },
        "weights": ACTIVE_WEIGHTS,
        "key_drivers": [
            "Actively exploited CISA KEV vulnerability detected on perimeter VPN",
            "Privileged DevOps credential identified in external infostealer log telemetry",
            f"{crit_assets_count} external assets designated with Critical business criticality"
        ],
        "trend": trend
    }

@router.get("/weights")
def get_weights():
    return ACTIVE_WEIGHTS

@router.post("/weights")
def update_weights(req: WeightConfiguration):
    total = req.exposure + req.vulnerability + req.credential_exposure + req.business_impact
    if abs(total - 1.0) > 0.01:
        # Normalize to 1.0
        req.exposure = round(req.exposure / total, 2)
        req.vulnerability = round(req.vulnerability / total, 2)
        req.credential_exposure = round(req.credential_exposure / total, 2)
        req.business_impact = round(req.business_impact / total, 2)

    ACTIVE_WEIGHTS["exposure"] = req.exposure
    ACTIVE_WEIGHTS["vulnerability"] = req.vulnerability
    ACTIVE_WEIGHTS["credential_exposure"] = req.credential_exposure
    ACTIVE_WEIGHTS["business_impact"] = req.business_impact
    return {"status": "Updated", "weights": ACTIVE_WEIGHTS}


@router.get("/company-benchmarks")
def get_company_benchmarks(
    search: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Returns comparative risk scores and benchmark metrics for other companies and industry peers."""
    # Current organization's score
    internal_res = get_internal_risk_assessment(db=db, current_user=current_user)
    org_score = internal_res.get("overall_score", 52)

    peers = [
        # --- Energy & Critical Infrastructure ---
        {
            "id": "comp-7",
            "name": "Horizon Energy & Utilities Corporation",
            "domain": "horizonenergy.com",
            "sector": "Energy & Critical Infrastructure",
            "score": 71,
            "band": "HIGH",
            "exposure_score": 74,
            "vulnerability_score": 76,
            "credential_exposure_score": 63,
            "critical_assets": 19,
            "trend_30d": "+3%",
            "trend_direction": "up",
            "delta_vs_org": 71 - org_score,
            "open_findings": 21,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-8",
            "name": "TerraWatt Renewable Power & Grid Systems",
            "domain": "terrawatt-power.com",
            "sector": "Energy & Critical Infrastructure",
            "score": 44,
            "band": "MODERATE",
            "exposure_score": 48,
            "vulnerability_score": 41,
            "credential_exposure_score": 43,
            "critical_assets": 12,
            "trend_30d": "-4%",
            "trend_direction": "down",
            "delta_vs_org": 44 - org_score,
            "open_findings": 8,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-9",
            "name": "Nordic Grid & Transmission Operator AB",
            "domain": "nordicgrid.se",
            "sector": "Energy & Critical Infrastructure",
            "score": 29,
            "band": "LOW",
            "exposure_score": 31,
            "vulnerability_score": 25,
            "credential_exposure_score": 30,
            "critical_assets": 8,
            "trend_30d": "-7%",
            "trend_direction": "down",
            "delta_vs_org": 29 - org_score,
            "open_findings": 5,
            "status": "Benchmark Leader"
        },

        # --- FinTech & Banking ---
        {
            "id": "comp-1",
            "name": "Apex Global Financial Services Group Inc.",
            "domain": "apexfin.com",
            "sector": "FinTech & Banking",
            "score": 68,
            "band": "HIGH",
            "exposure_score": 72,
            "vulnerability_score": 65,
            "credential_exposure_score": 67,
            "critical_assets": 14,
            "trend_30d": "+4%",
            "trend_direction": "up",
            "delta_vs_org": 68 - org_score,
            "open_findings": 18,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-10",
            "name": "Silverline Capital Wealth & Investment Bank",
            "domain": "silverlinecapital.com",
            "sector": "FinTech & Banking",
            "score": 53,
            "band": "MODERATE",
            "exposure_score": 55,
            "vulnerability_score": 51,
            "credential_exposure_score": 54,
            "critical_assets": 16,
            "trend_30d": "-3%",
            "trend_direction": "down",
            "delta_vs_org": 53 - org_score,
            "open_findings": 11,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-11",
            "name": "NeoVault Cross-Border Payments Network",
            "domain": "neovaultpay.io",
            "sector": "FinTech & Banking",
            "score": 34,
            "band": "LOW",
            "exposure_score": 36,
            "vulnerability_score": 28,
            "credential_exposure_score": 38,
            "critical_assets": 9,
            "trend_30d": "-8%",
            "trend_direction": "down",
            "delta_vs_org": 34 - org_score,
            "open_findings": 6,
            "status": "Benchmark Leader"
        },
        {
            "id": "comp-12",
            "name": "Zurich Horizon Bancorp AG",
            "domain": "zurichhorizon.ch",
            "sector": "FinTech & Banking",
            "score": 76,
            "band": "CRITICAL",
            "exposure_score": 79,
            "vulnerability_score": 78,
            "credential_exposure_score": 72,
            "critical_assets": 24,
            "trend_30d": "+9%",
            "trend_direction": "up",
            "delta_vs_org": 76 - org_score,
            "open_findings": 29,
            "status": "Elevated Exposure"
        },

        # --- Cloud & DevOps ---
        {
            "id": "comp-2",
            "name": "CloudScale Infrastructure Systems Ltd.",
            "domain": "cloudscale.io",
            "sector": "Cloud & DevOps",
            "score": 38,
            "band": "LOW",
            "exposure_score": 42,
            "vulnerability_score": 31,
            "credential_exposure_score": 41,
            "critical_assets": 9,
            "trend_30d": "-6%",
            "trend_direction": "down",
            "delta_vs_org": 38 - org_score,
            "open_findings": 6,
            "status": "Benchmark Leader"
        },
        {
            "id": "comp-13",
            "name": "KubeMatrix Multi-Cloud Kubernetes Orchestrator",
            "domain": "kubematrix.cloud",
            "sector": "Cloud & DevOps",
            "score": 49,
            "band": "MODERATE",
            "exposure_score": 52,
            "vulnerability_score": 47,
            "credential_exposure_score": 48,
            "critical_assets": 13,
            "trend_30d": "+1%",
            "trend_direction": "up",
            "delta_vs_org": 49 - org_score,
            "open_findings": 10,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-14",
            "name": "DevPulse Continuous Delivery Systems",
            "domain": "devpulse.dev",
            "sector": "Cloud & DevOps",
            "score": 25,
            "band": "LOW",
            "exposure_score": 28,
            "vulnerability_score": 21,
            "credential_exposure_score": 26,
            "critical_assets": 6,
            "trend_30d": "-12%",
            "trend_direction": "down",
            "delta_vs_org": 25 - org_score,
            "open_findings": 3,
            "status": "Top Decile Leader"
        },
        {
            "id": "comp-15",
            "name": "HyperScale Global Edge CDN Networks",
            "domain": "hyperscalecdn.net",
            "sector": "Cloud & DevOps",
            "score": 62,
            "band": "HIGH",
            "exposure_score": 66,
            "vulnerability_score": 61,
            "credential_exposure_score": 59,
            "critical_assets": 18,
            "trend_30d": "+5%",
            "trend_direction": "up",
            "delta_vs_org": 62 - org_score,
            "open_findings": 16,
            "status": "Monitored Enterprise"
        },

        # --- Healthcare & Biotech ---
        {
            "id": "comp-3",
            "name": "OmniHealth Diagnostics Healthcare Network",
            "domain": "omnihealth.org",
            "sector": "Healthcare & Biotech",
            "score": 78,
            "band": "CRITICAL",
            "exposure_score": 80,
            "vulnerability_score": 84,
            "credential_exposure_score": 70,
            "critical_assets": 22,
            "trend_30d": "+8%",
            "trend_direction": "up",
            "delta_vs_org": 78 - org_score,
            "open_findings": 27,
            "status": "Elevated Exposure"
        },
        {
            "id": "comp-16",
            "name": "GeneFlow BioLabs Genomic Research",
            "domain": "geneflowlabs.com",
            "sector": "Healthcare & Biotech",
            "score": 46,
            "band": "MODERATE",
            "exposure_score": 50,
            "vulnerability_score": 43,
            "credential_exposure_score": 45,
            "critical_assets": 11,
            "trend_30d": "-5%",
            "trend_direction": "down",
            "delta_vs_org": 46 - org_score,
            "open_findings": 9,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-17",
            "name": "CarePoint Regional Medical Center Alliance",
            "domain": "carepointhealth.org",
            "sector": "Healthcare & Biotech",
            "score": 83,
            "band": "CRITICAL",
            "exposure_score": 86,
            "vulnerability_score": 88,
            "credential_exposure_score": 76,
            "critical_assets": 28,
            "trend_30d": "+11%",
            "trend_direction": "up",
            "delta_vs_org": 83 - org_score,
            "open_findings": 33,
            "status": "Elevated Exposure"
        },
        {
            "id": "comp-18",
            "name": "Vitalis Pharmaceutical Innovations Group",
            "domain": "vitalispharma.com",
            "sector": "Healthcare & Biotech",
            "score": 37,
            "band": "LOW",
            "exposure_score": 39,
            "vulnerability_score": 32,
            "credential_exposure_score": 40,
            "critical_assets": 8,
            "trend_30d": "-7%",
            "trend_direction": "down",
            "delta_vs_org": 37 - org_score,
            "open_findings": 5,
            "status": "Benchmark Leader"
        },

        # --- Logistics & Supply Chain ---
        {
            "id": "comp-4",
            "name": "Quantum Logistics & Supply Chain International",
            "domain": "quantumlog.com",
            "sector": "Logistics & Supply Chain",
            "score": 54,
            "band": "MODERATE",
            "exposure_score": 58,
            "vulnerability_score": 52,
            "credential_exposure_score": 52,
            "critical_assets": 11,
            "trend_30d": "-2%",
            "trend_direction": "down",
            "delta_vs_org": 54 - org_score,
            "open_findings": 12,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-19",
            "name": "AeroDynamics Global Cargo Carrier",
            "domain": "aerodynamicsglobal.com",
            "sector": "Logistics & Supply Chain",
            "score": 66,
            "band": "HIGH",
            "exposure_score": 69,
            "vulnerability_score": 67,
            "credential_exposure_score": 62,
            "critical_assets": 17,
            "trend_30d": "+6%",
            "trend_direction": "up",
            "delta_vs_org": 66 - org_score,
            "open_findings": 19,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-20",
            "name": "TransOceanic Container Lines Ltd.",
            "domain": "transoceaniclines.com",
            "sector": "Logistics & Supply Chain",
            "score": 79,
            "band": "CRITICAL",
            "exposure_score": 82,
            "vulnerability_score": 80,
            "credential_exposure_score": 75,
            "critical_assets": 26,
            "trend_30d": "+10%",
            "trend_direction": "up",
            "delta_vs_org": 79 - org_score,
            "open_findings": 31,
            "status": "Elevated Exposure"
        },

        # --- Enterprise Software ---
        {
            "id": "comp-5",
            "name": "CyberNexus Technologies Enterprise Group",
            "domain": "cybernexus.net",
            "sector": "Enterprise Software",
            "score": 26,
            "band": "LOW",
            "exposure_score": 29,
            "vulnerability_score": 22,
            "credential_exposure_score": 27,
            "critical_assets": 7,
            "trend_30d": "-11%",
            "trend_direction": "down",
            "delta_vs_org": 26 - org_score,
            "open_findings": 4,
            "status": "Top Decile Leader"
        },
        {
            "id": "comp-21",
            "name": "SecureWorkplace Enterprise SaaS Suite",
            "domain": "secureworkplace.com",
            "sector": "Enterprise Software",
            "score": 31,
            "band": "LOW",
            "exposure_score": 34,
            "vulnerability_score": 27,
            "credential_exposure_score": 32,
            "critical_assets": 8,
            "trend_30d": "-9%",
            "trend_direction": "down",
            "delta_vs_org": 31 - org_score,
            "open_findings": 5,
            "status": "Benchmark Leader"
        },
        {
            "id": "comp-22",
            "name": "OmniStack Integration Systems Corp.",
            "domain": "omnistack.io",
            "sector": "Enterprise Software",
            "score": 58,
            "band": "MODERATE",
            "exposure_score": 61,
            "vulnerability_score": 56,
            "credential_exposure_score": 57,
            "critical_assets": 15,
            "trend_30d": "+2%",
            "trend_direction": "up",
            "delta_vs_org": 58 - org_score,
            "open_findings": 14,
            "status": "Monitored Enterprise"
        },

        # --- E-Commerce & Retail ---
        {
            "id": "comp-6",
            "name": "Vanguard Retail Commercial Holdings",
            "domain": "vanguardretail.com",
            "sector": "E-Commerce & Retail",
            "score": 84,
            "band": "CRITICAL",
            "exposure_score": 88,
            "vulnerability_score": 81,
            "credential_exposure_score": 83,
            "critical_assets": 29,
            "trend_30d": "+12%",
            "trend_direction": "up",
            "delta_vs_org": 84 - org_score,
            "open_findings": 34,
            "status": "Elevated Exposure"
        },
        {
            "id": "comp-23",
            "name": "NexStore Global Direct Commerce",
            "domain": "nexstoreglobal.com",
            "sector": "E-Commerce & Retail",
            "score": 64,
            "band": "HIGH",
            "exposure_score": 67,
            "vulnerability_score": 63,
            "credential_exposure_score": 62,
            "critical_assets": 16,
            "trend_30d": "+4%",
            "trend_direction": "up",
            "delta_vs_org": 64 - org_score,
            "open_findings": 17,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-24",
            "name": "LuxeMarket Luxury Online Retail",
            "domain": "luxemarket.fr",
            "sector": "E-Commerce & Retail",
            "score": 42,
            "band": "MODERATE",
            "exposure_score": 45,
            "vulnerability_score": 39,
            "credential_exposure_score": 42,
            "critical_assets": 10,
            "trend_30d": "-4%",
            "trend_direction": "down",
            "delta_vs_org": 42 - org_score,
            "open_findings": 7,
            "status": "Monitored Enterprise"
        },

        # --- Telecommunications & 5G ---
        {
            "id": "comp-25",
            "name": "Apex Telecom Global Connectivity Ltd.",
            "domain": "apextelecom.net",
            "sector": "Telecommunications & 5G",
            "score": 73,
            "band": "HIGH",
            "exposure_score": 77,
            "vulnerability_score": 74,
            "credential_exposure_score": 68,
            "critical_assets": 21,
            "trend_30d": "+5%",
            "trend_direction": "up",
            "delta_vs_org": 73 - org_score,
            "open_findings": 23,
            "status": "Monitored Enterprise"
        },
        {
            "id": "comp-26",
            "name": "SpectraWave 5G Wireless Infrastructure",
            "domain": "spectrawave5g.com",
            "sector": "Telecommunications & 5G",
            "score": 35,
            "band": "LOW",
            "exposure_score": 38,
            "vulnerability_score": 30,
            "credential_exposure_score": 37,
            "critical_assets": 9,
            "trend_30d": "-8%",
            "trend_direction": "down",
            "delta_vs_org": 35 - org_score,
            "open_findings": 6,
            "status": "Benchmark Leader"
        }
    ]

    # Calculate overall industry statistics
    scores = [p["score"] for p in peers]
    avg_score = round(sum(scores) / len(scores), 1)
    lowest_score = min(scores)
    highest_score = max(scores)

    # Optional server-side filtering
    filtered = peers
    if sector and sector.strip() and sector.strip().lower() != "all":
        s_clean = sector.strip().lower()
        filtered = [
            p for p in filtered
            if s_clean in p["sector"].lower() or p["sector"].lower() in s_clean
        ]

    if search and search.strip():
        q = search.strip().lower()
        filtered = [
            p for p in filtered
            if q in p["name"].lower()
            or q in p["domain"].lower()
            or q in p["sector"].lower()
            or q in p["band"].lower()
            or q in p["status"].lower()
        ]

    return {
        "org_score": org_score,
        "industry_average_score": avg_score,
        "top_benchmark_score": lowest_score,
        "highest_risk_peer_score": highest_score,
        "total_peers_compared": len(peers),
        "peers": filtered
    }


