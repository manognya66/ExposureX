"""Global Cross-Entity Search Endpoint"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.asset import Asset
from app.models.identity import Identity
from app.models.finding import Finding
from app.models.case import SecurityCase
from app.models.vulnerability import Vulnerability
from app.models.credential import CredentialExposure
from app.models.vendor import Vendor
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("/")
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    term = f"%{q.strip().lower()}%"

    # Assets
    assets = db.query(Asset).filter((Asset.name.ilike(term)) | (Asset.domain.ilike(term)) | (Asset.ip.ilike(term))).limit(10).all()
    # Identities
    identities = db.query(Identity).filter((Identity.email.ilike(term)) | (Identity.username.ilike(term))).limit(10).all()
    # Findings
    findings = db.query(Finding).filter((Finding.finding_ref.ilike(term)) | (Finding.title.ilike(term))).limit(10).all()
    # Cases
    cases = db.query(SecurityCase).filter((SecurityCase.case_ref.ilike(term)) | (SecurityCase.title.ilike(term))).limit(10).all()
    # Vulnerabilities
    vulns = db.query(Vulnerability).filter((Vulnerability.cve_id.ilike(term)) | (Vulnerability.title.ilike(term))).limit(10).all()
    # Credential Exposures
    exposures = db.query(CredentialExposure).filter((CredentialExposure.email.ilike(term)) | (CredentialExposure.breach_title.ilike(term))).limit(10).all()
    # Vendors
    vendors = db.query(Vendor).filter((Vendor.name.ilike(term)) | (Vendor.domain.ilike(term))).limit(10).all()

    return {
        "query": q,
        "assets": [{"id": a.id, "name": a.name, "type": a.asset_type, "risk_score": a.risk_score} for a in assets],
        "identities": [{"id": i.id, "email": i.email, "role": i.role, "is_privileged": i.is_privileged} for i in identities],
        "findings": [{"id": f.id, "ref": f.finding_ref, "title": f.title, "severity": f.severity, "risk_score": f.risk_score} for f in findings],
        "cases": [{"id": c.id, "ref": c.case_ref, "title": c.title, "severity": c.severity, "status": c.status} for c in cases],
        "vulnerabilities": [{"id": v.id, "cve_id": v.cve_id, "title": v.title, "severity": v.severity} for v in vulns],
        "credentials": [{"id": e.id, "email": e.email, "breach": e.breach_title, "severity": e.severity} for e in exposures],
        "vendors": [{"id": vn.id, "name": vn.name, "domain": vn.domain, "risk_score": vn.overall_risk_score} for vn in vendors]
    }

