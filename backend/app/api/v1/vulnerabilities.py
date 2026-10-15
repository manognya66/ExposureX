"""Vulnerability Intelligence Endpoints (CISA KEV, NVD Feeds)"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.vulnerability import Vulnerability
from app.models.asset import Asset
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit
from app.providers.vulnerability.cisa_nvd_provider import CisaKevProvider

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerability Intelligence"])

class VulnerabilityCreate(BaseModel):
    cve_id: str
    title: str
    description: Optional[str] = None
    cvss_score: Optional[float] = 7.5
    severity: Optional[str] = "High"
    cisa_kev_status: Optional[bool] = False
    affected_technology: Optional[str] = None
    associated_asset_name: Optional[str] = None

@router.get("/")
def list_vulnerabilities(
    severity: Optional[str] = None,
    cisa_kev_only: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(Vulnerability)
    if severity:
        query = query.filter(Vulnerability.severity == severity)
    if cisa_kev_only:
        query = query.filter(Vulnerability.cisa_kev_status == True)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((Vulnerability.cve_id.ilike(s)) | (Vulnerability.title.ilike(s)) | (Vulnerability.affected_technology.ilike(s)))

    vulns = query.order_by(Vulnerability.cvss_score.desc()).all()
    results = []
    for v in vulns:
        results.append({
            "id": v.id,
            "cve_id": v.cve_id,
            "title": v.title,
            "description": v.description,
            "cvss_score": v.cvss_score,
            "cvss_vector": v.cvss_vector,
            "severity": v.severity,
            "published_date": v.published_date.strftime("%Y-%m-%d") if v.published_date else None,
            "cisa_kev_status": v.cisa_kev_status,
            "cisa_kev_date_added": v.cisa_kev_date_added.strftime("%Y-%m-%d") if v.cisa_kev_date_added else None,
            "affected_technology": v.affected_technology,
            "references": v.references or [],
            "risk_contribution": v.risk_contribution,
            "associated_asset_id": v.associated_asset_id,
            "associated_asset_name": v.asset.name if v.asset else None
        })
    return results

@router.get("/{vuln_id}")
def get_vulnerability_detail(
    vuln_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    v = db.query(Vulnerability).filter(Vulnerability.id == vuln_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vulnerability record not found")

    return {
        "id": v.id,
        "cve_id": v.cve_id,
        "title": v.title,
        "description": v.description,
        "cvss_score": v.cvss_score,
        "cvss_vector": v.cvss_vector,
        "severity": v.severity,
        "published_date": v.published_date.isoformat() if v.published_date else None,
        "cisa_kev_status": v.cisa_kev_status,
        "cisa_kev_date_added": v.cisa_kev_date_added.isoformat() if v.cisa_kev_date_added else None,
        "affected_technology": v.affected_technology,
        "references": v.references or [],
        "risk_contribution": v.risk_contribution,
        "associated_asset_id": v.associated_asset_id,
        "associated_asset_name": v.asset.name if v.asset else None
    }

@router.post("/sync-cisa-kev")
async def sync_cisa_kev(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    """Sync known exploited vulnerabilities from CISA KEV catalog"""
    provider = CisaKevProvider()
    catalog = await provider.sync_known_exploited()
    synced_count = 0

    for item in catalog:
        existing = db.query(Vulnerability).filter(Vulnerability.cve_id == item["cve_id"]).first()
        if not existing:
            v = Vulnerability(
                cve_id=item["cve_id"],
                title=item["title"],
                description=item.get("description"),
                cvss_score=item.get("cvss_score", 9.0),
                severity=item.get("severity", "Critical"),
                cisa_kev_status=True,
                affected_technology=item.get("affected_technology"),
                risk_contribution=90
            )
            db.add(v)
            synced_count += 1
        else:
            existing.cisa_kev_status = True
            synced_count += 1

    db.commit()
    log_audit(db, user=current_user.email, action="VULN_SYNC_CISA_KEV", object_name="CISA KEV Catalog", new_value=f"Synced {synced_count} CVEs")
    return {"status": "Success", "synced_cve_count": synced_count}

@router.post("/", status_code=201)
def create_vulnerability(
    vuln_in: VulnerabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    asset = None
    if vuln_in.associated_asset_name:
        asset = db.query(Asset).filter(Asset.name.ilike(f"%{vuln_in.associated_asset_name}%")).first()

    v = Vulnerability(
        cve_id=vuln_in.cve_id.strip().upper(),
        title=vuln_in.title,
        description=vuln_in.description,
        cvss_score=vuln_in.cvss_score or 7.5,
        severity=vuln_in.severity or "High",
        cisa_kev_status=vuln_in.cisa_kev_status or False,
        affected_technology=vuln_in.affected_technology,
        associated_asset_id=asset.id if asset else None,
        risk_contribution=85 if vuln_in.severity == "Critical" else 65
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    log_audit(db, user=current_user.email, action="VULN_MANUAL_ENTRY", object_name=f"CVE: {v.cve_id}")
    return v

