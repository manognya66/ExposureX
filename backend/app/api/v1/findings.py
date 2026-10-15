"""Findings Management Endpoints: Correlated exposure items, risk breakdowns, and lifecycle statuses"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.finding import Finding
from app.models.asset import Asset
from app.models.identity import Identity
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit
from app.engine.risk_engine import RiskEngine

router = APIRouter(prefix="/findings", tags=["Findings"])

class FindingUpdateStatus(BaseModel):
    status: str # New, Investigating, Confirmed, False Positive, Remediating, Resolved, Accepted Risk
    analyst_comment: Optional[str] = None

class FindingUpdateOwner(BaseModel):
    owner: str

class FindingCreate(BaseModel):
    title: str
    severity: str # Critical, High, Moderate, Low
    asset_name: Optional[str] = None
    identity_email: Optional[str] = None
    recommended_action: Optional[str] = None

@router.get("/")
def list_findings(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(Finding)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if owner:
        query = query.filter(Finding.owner == owner)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((Finding.finding_ref.ilike(s)) | (Finding.title.ilike(s)))

    findings = query.order_by(Finding.risk_score.desc()).all()
    results = []
    for f in findings:
        results.append({
            "id": f.id,
            "finding_ref": f.finding_ref,
            "title": f.title,
            "severity": f.severity,
            "risk_score": f.risk_score,
            "risk_band": f.risk_band,
            "asset_id": f.asset_id,
            "asset_name": f.asset.name if f.asset else None,
            "identity_email": f.identity.email if f.identity else None,
            "source": f.source,
            "first_seen": f.first_seen.strftime("%Y-%m-%d %H:%M") if f.first_seen else None,
            "last_seen": f.last_seen.strftime("%Y-%m-%d %H:%M") if f.last_seen else None,
            "status": f.status,
            "owner": f.owner,
            "recommended_action": f.recommended_action
        })
    return results

@router.get("/{finding_id}")
def get_finding_detail(
    finding_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    # Match either UUID or finding_ref (e.g. EXP-00042)
    f = db.query(Finding).filter((Finding.id == finding_id) | (Finding.finding_ref == finding_id)).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    # Formulate "Why?" explanation points
    why_points = [
        "Internet-facing perimeter asset detected" if f.asset else "External exposure signal",
        f"Critical vulnerability identified ({f.vulnerability.cve_id})" if f.vulnerability else "Known vulnerability vector identified",
        f"Correlated credential exposure for {f.identity.email}" if f.identity and f.credential_exposure else "Credential intelligence event mapped",
        f"Asset criticality level: {f.asset.business_criticality if f.asset else 'High'}"
    ]

    return {
        "id": f.id,
        "finding_ref": f.finding_ref,
        "title": f.title,
        "severity": f.severity,
        "risk_score": f.risk_score,
        "risk_band": f.risk_band,
        "asset": {
            "id": f.asset.id if f.asset else None,
            "name": f.asset.name if f.asset else None,
            "domain": f.asset.domain if f.asset else None,
            "ip": f.asset.ip if f.asset else None,
            "business_criticality": f.asset.business_criticality if f.asset else "High"
        } if f.asset else None,
        "identity": {
            "id": f.identity.id if f.identity else None,
            "email": f.identity.email if f.identity else None,
            "role": f.identity.role if f.identity else None,
            "is_privileged": f.identity.is_privileged if f.identity else False
        } if f.identity else None,
        "credential_exposure": {
            "id": f.credential_exposure.id if f.credential_exposure else None,
            "breach_title": f.credential_exposure.breach_title if f.credential_exposure else None,
            "provider": f.credential_exposure.provider if f.credential_exposure else None,
            "confidence": f.credential_exposure.confidence if f.credential_exposure else None,
            "exposed_data_classes": f.credential_exposure.exposed_data_classes if f.credential_exposure else []
        } if f.credential_exposure else None,
        "vulnerability": {
            "id": f.vulnerability.id if f.vulnerability else None,
            "cve_id": f.vulnerability.cve_id if f.vulnerability else None,
            "cvss_score": f.vulnerability.cvss_score if f.vulnerability else None,
            "cisa_kev_status": f.vulnerability.cisa_kev_status if f.vulnerability else False
        } if f.vulnerability else None,
        "source": f.source,
        "evidence": f.evidence or {},
        "why_explanation": why_points,
        "first_seen": f.first_seen.isoformat() if f.first_seen else None,
        "last_seen": f.last_seen.isoformat() if f.last_seen else None,
        "status": f.status,
        "owner": f.owner,
        "recommended_action": f.recommended_action
    }

@router.patch("/{finding_id}/status")
def update_finding_status(
    finding_id: str,
    req: FindingUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value, RoleEnum.RISK_MANAGER.value]))
):
    f = db.query(Finding).filter((Finding.id == finding_id) | (Finding.finding_ref == finding_id)).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    prev = f.status
    f.status = req.status
    f.last_seen = datetime.utcnow()
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="FINDING_STATUS_CHANGE",
        object_name=f"Finding: {f.finding_ref}",
        previous_value=prev,
        new_value=req.status
    )
    return {"status": "Updated", "finding_ref": f.finding_ref, "new_status": f.status}

@router.patch("/{finding_id}/owner")
def update_finding_owner(
    finding_id: str,
    req: FindingUpdateOwner,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    f = db.query(Finding).filter((Finding.id == finding_id) | (Finding.finding_ref == finding_id)).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")

    prev = f.owner
    f.owner = req.owner
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="FINDING_OWNER_CHANGE",
        object_name=f"Finding: {f.finding_ref}",
        previous_value=prev or "Unassigned",
        new_value=req.owner
    )
    return {"status": "Owner updated", "owner": f.owner}

@router.post("/", status_code=201)
def create_finding(
    item: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    count = db.query(Finding).count() + 1
    ref = f"EXP-{count:05d}"

    asset = None
    if item.asset_name:
        asset = db.query(Asset).filter(Asset.name.ilike(f"%{item.asset_name}%")).first()

    ident = None
    if item.identity_email:
        ident = db.query(Identity).filter(Identity.email == item.identity_email.lower()).first()

    score_map = {"Critical": 85, "High": 70, "Moderate": 45, "Low": 20}
    score = score_map.get(item.severity, 50)

    finding = Finding(
        finding_ref=ref,
        title=item.title,
        severity=item.severity,
        risk_score=score,
        risk_band=item.severity,
        asset_id=asset.id if asset else None,
        identity_id=ident.id if ident else None,
        source="Analyst Investigation",
        evidence={"created_by": current_user.email},
        status="New",
        owner=current_user.email,
        recommended_action=item.recommended_action or "Investigate asset exposure and correlate identity."
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)

    log_audit(db, user=current_user.email, action="FINDING_CREATE", object_name=f"Finding: {ref}")
    return finding

