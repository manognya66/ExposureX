"""Dashboard API: Metrics, Risk Score, Trends, and Drill-downs"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models.asset import Asset
from app.models.identity import Identity
from app.models.credential import CredentialExposure
from app.models.vulnerability import Vulnerability
from app.models.finding import Finding
from app.models.case import SecurityCase
from app.models.notification import SecurityPulseNotification
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # Findings by severity
    critical_findings = db.query(Finding).filter(Finding.severity == "Critical").count()
    high_findings = db.query(Finding).filter(Finding.severity == "High").count()
    moderate_findings = db.query(Finding).filter(Finding.severity == "Moderate").count()
    low_findings = db.query(Finding).filter(Finding.severity == "Low").count()

    # Core inventory & exposure counts
    external_assets = db.query(Asset).count()
    exposed_identities = db.query(Identity).filter(Identity.credential_exposure_count > 0).count()
    total_identities = db.query(Identity).count()
    credential_events = db.query(CredentialExposure).count()
    vulnerabilities = db.query(Vulnerability).count()
    cisa_kev_count = db.query(Vulnerability).filter(Vulnerability.cisa_kev_status == True).count()
    open_cases = db.query(SecurityCase).filter(SecurityCase.status.in_(["Open", "Investigating", "Pending"])).count()

    # Calculate Overall Organizational Risk Score (0-100)
    # Using ExposureX weighted formula across aggregate assets:
    # Assets average risk score weighted with active severe findings
    all_assets = db.query(Asset).all()
    if all_assets:
        avg_asset_risk = sum(a.risk_score for a in all_assets) / len(all_assets)
    else:
        avg_asset_risk = 0.0

    # Severity amplification if critical findings exist
    amplification = 10 if critical_findings > 0 else 0
    overall_risk = int(min(100, max(0, avg_asset_risk + amplification))) if all_assets else 0
    
    if overall_risk >= 75:
        overall_band = "CRITICAL"
    elif overall_risk >= 50:
        overall_band = "HIGH"
    elif overall_risk >= 25:
        overall_band = "MODERATE"
    else:
        overall_band = "LOW"

    # Risk Trend points (last 14 days)
    today = datetime.utcnow()
    trend_history = []
    for i in range(14):
        d = today - timedelta(days=13 - i)
        trend_history.append({
            "date": d.strftime("%b %d"),
            "score": overall_risk
        })

    # Newly discovered assets (recent 5)
    recent_assets = db.query(Asset).order_by(Asset.first_seen.desc()).limit(5).all()
    recent_assets_data = [
        {
            "id": a.id,
            "name": a.name,
            "asset_type": a.asset_type,
            "domain": a.domain,
            "business_criticality": a.business_criticality,
            "risk_score": a.risk_score,
            "risk_band": a.risk_band,
            "first_seen": a.first_seen.strftime("%Y-%m-%d %H:%M") if a.first_seen else None
        }
        for a in recent_assets
    ]

    # Recent Security Pulse events (recent 4)
    recent_pulse = db.query(SecurityPulseNotification).order_by(SecurityPulseNotification.timestamp.desc()).limit(4).all()
    recent_pulse_data = [
        {
            "id": p.id,
            "title": p.title,
            "message": p.message,
            "severity": p.severity,
            "event_type": p.event_type,
            "reasons": p.reasons,
            "timestamp": p.timestamp.strftime("%Y-%m-%d %H:%M"),
            "action_url": p.action_url
        }
        for p in recent_pulse
    ]

    return {
        "overall_risk_score": overall_risk,
        "overall_risk_band": overall_band,
        "critical_findings": critical_findings,
        "high_findings": high_findings,
        "moderate_findings": moderate_findings,
        "low_findings": low_findings,
        "external_assets": external_assets,
        "exposed_identities": exposed_identities,
        "total_identities": total_identities,
        "credential_events": credential_events,
        "vulnerabilities": vulnerabilities,
        "cisa_kev_count": cisa_kev_count,
        "open_cases": open_cases,
        "trend_history": trend_history,
        "recent_assets": recent_assets_data,
        "recent_pulse": recent_pulse_data
    }

