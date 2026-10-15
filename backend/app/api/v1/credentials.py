"""Credential Exposure Intelligence Endpoints (Zero Plaintext Passwords / Minimized Metadata Only)"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import hashlib

from app.database import get_db
from app.models.credential import CredentialExposure
from app.models.identity import Identity
from app.models.asset import Asset
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit
from app.websocket.manager import pulse_manager
from app.models.notification import SecurityPulseNotification

router = APIRouter(prefix="/credentials", tags=["Credential Intelligence"])

class StatusUpdateRequest(BaseModel):
    investigation_status: str # New, Under Investigation, Confirmed, Remediated, False Positive
    analyst_notes: Optional[str] = None

class SyntheticExposureCreate(BaseModel):
    email: str
    breach_title: str
    exposure_type: Optional[str] = "Data Breach"
    severity: Optional[str] = "High"
    confidence: Optional[str] = "Verified"
    source_category: Optional[str] = "Commercial Intelligence"
    related_asset_domain: Optional[str] = None
    exposed_data_classes: Optional[List[str]] = ["Email", "Job Title"]

@router.get("/")
def list_credential_exposures(
    severity: Optional[str] = None,
    confidence: Optional[str] = None,
    investigation_status: Optional[str] = None,
    provider: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(CredentialExposure)
    if severity:
        query = query.filter(CredentialExposure.severity == severity)
    if confidence:
        query = query.filter(CredentialExposure.confidence == confidence)
    if investigation_status:
        query = query.filter(CredentialExposure.investigation_status == investigation_status)
    if provider:
        query = query.filter(CredentialExposure.provider == provider)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((CredentialExposure.email.ilike(s)) | (CredentialExposure.breach_title.ilike(s)) | (CredentialExposure.domain.ilike(s)))

    exposures = query.order_by(CredentialExposure.risk_contribution.desc()).all()
    results = []
    for exp in exposures:
        results.append({
            "id": exp.id,
            "email": exp.email,
            "domain": exp.domain,
            "email_hash_sha256": exp.email_hash_sha256,
            "provider": exp.provider,
            "exposure_type": exp.exposure_type,
            "breach_title": exp.breach_title,
            "breach_date": exp.breach_date.strftime("%Y-%m-%d") if exp.breach_date else None,
            "first_observed": exp.first_observed.strftime("%Y-%m-%d %H:%M") if exp.first_observed else None,
            "last_observed": exp.last_observed.strftime("%Y-%m-%d %H:%M") if exp.last_observed else None,
            "confidence": exp.confidence,
            "severity": exp.severity,
            "source_category": exp.source_category,
            "risk_contribution": exp.risk_contribution,
            "investigation_status": exp.investigation_status,
            "exposed_data_classes": exp.exposed_data_classes or [],
            "description": exp.description,
            "related_asset_name": exp.asset.name if exp.asset else None,
            "identity_role": exp.identity.role if exp.identity else None
        })
    return results

@router.get("/{exposure_id}")
def get_credential_exposure_detail(
    exposure_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    exp = db.query(CredentialExposure).filter(CredentialExposure.id == exposure_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Credential exposure record not found")

    return {
        "id": exp.id,
        "email": exp.email,
        "email_hash_sha256": exp.email_hash_sha256,
        "domain": exp.domain,
        "provider": exp.provider,
        "exposure_type": exp.exposure_type,
        "breach_title": exp.breach_title,
        "breach_date": exp.breach_date.isoformat() if exp.breach_date else None,
        "first_observed": exp.first_observed.isoformat() if exp.first_observed else None,
        "last_observed": exp.last_observed.isoformat() if exp.last_observed else None,
        "confidence": exp.confidence,
        "severity": exp.severity,
        "source_category": exp.source_category,
        "risk_contribution": exp.risk_contribution,
        "investigation_status": exp.investigation_status,
        "exposed_data_classes": exp.exposed_data_classes or [],
        "description": exp.description,
        "related_asset_id": exp.related_asset_id,
        "related_asset_name": exp.asset.name if exp.asset else None
    }

@router.patch("/{exposure_id}/status")
def update_exposure_status(
    exposure_id: str,
    req: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    exp = db.query(CredentialExposure).filter(CredentialExposure.id == exposure_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Credential exposure record not found")

    prev = exp.investigation_status
    exp.investigation_status = req.investigation_status
    if req.analyst_notes:
        exp.description = f"{exp.description or ''}\nAnalyst Note ({current_user.email}): {req.analyst_notes}"
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="CREDENTIAL_STATUS_CHANGE",
        object_name=f"Exposure: {exp.breach_title} ({exp.email})",
        previous_value=prev,
        new_value=req.investigation_status
    )
    return {"status": "Updated", "current_status": exp.investigation_status}

@router.post("/synthetic", status_code=201)
async def create_synthetic_exposure(
    item: SyntheticExposureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    """Generate authorized synthetic exposure record for Demo Mode (Strictly metadata only)"""
    # Link to identity if exists
    ident = db.query(Identity).filter(Identity.email == item.email.strip().lower()).first()
    
    # Link to asset if provided
    asset = None
    if item.related_asset_domain:
        asset = db.query(Asset).filter(Asset.name.ilike(f"%{item.related_asset_domain}%")).first()

    email_clean = item.email.strip().lower()
    exp = CredentialExposure(
        identity_id=ident.id if ident else None,
        email=email_clean,
        email_hash_sha256=hashlib.sha256(email_clean.encode()).hexdigest(),
        domain=email_clean.split("@")[-1],
        provider="Commercial Intelligence Feed",
        exposure_type=item.exposure_type,
        breach_title=item.breach_title,
        breach_date=datetime.utcnow(),
        confidence=item.confidence,
        severity=item.severity,
        source_category=item.source_category,
        related_asset_id=asset.id if asset else None,
        risk_contribution=85 if item.severity == "Critical" else 65,
        investigation_status="New",
        exposed_data_classes=item.exposed_data_classes or ["Email", "Job Title"],
        description=f"Authorized credential exposure event logged for identity {email_clean}."
    )
    db.add(exp)
    if ident:
        ident.credential_exposure_count += 1
        ident.risk_score = min(100, ident.risk_score + 15)
    db.commit()
    db.refresh(exp)

    # Fire Security Pulse notification!
    pulse_note = SecurityPulseNotification(
        title="NEW CREDENTIAL EXPOSURE",
        message=f"New exposure event '{item.breach_title}' detected for identity {email_clean}.",
        severity=item.severity,
        event_type="new_credential_exposure",
        related_entity_type="identity",
        related_entity_id=ident.id if ident else None,
        reasons=[f"Breach: {item.breach_title}", f"Confidence: {item.confidence}", f"Severity: {item.severity}"],
        action_url="/exposure/credentials"
    )
    db.add(pulse_note)
    db.commit()

    # WebSocket broadcast
    await pulse_manager.broadcast_pulse({
        "type": "SECURITY_PULSE_ALERT",
        "title": pulse_note.title,
        "message": pulse_note.message,
        "severity": pulse_note.severity,
        "reasons": pulse_note.reasons,
        "action_url": pulse_note.action_url
    })

    log_audit(db, user=current_user.email, action="SYNTHETIC_EXPOSURE_CREATED", object_name=f"Breach: {exp.breach_title}")
    return exp

