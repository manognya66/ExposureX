"""Third-Party Risk Assessment Module (Strictly Segregated from Internal Score)"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.vendor import Vendor
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit

router = APIRouter(prefix="/vendors", tags=["Third-Party Risk Assessment"])

class VendorCreate(BaseModel):
    name: str
    domain: str
    category: Optional[str] = "SaaS Provider"
    contact_email: Optional[str] = None
    business_criticality: Optional[str] = "High"
    data_sensitivity: Optional[str] = "Confidential"
    notes: Optional[str] = None

class VendorUpdate(BaseModel):
    business_criticality: Optional[str] = None
    data_sensitivity: Optional[str] = None
    assessment_status: Optional[str] = None
    notes: Optional[str] = None

@router.get("/")
def list_vendors(
    category: Optional[str] = None,
    risk_band: Optional[str] = None,
    assessment_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(Vendor)
    if category:
        query = query.filter(Vendor.category == category)
    if risk_band:
        query = query.filter(Vendor.risk_band == risk_band)
    if assessment_status:
        query = query.filter(Vendor.assessment_status == assessment_status)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((Vendor.name.ilike(s)) | (Vendor.domain.ilike(s)))

    vendors = query.order_by(Vendor.overall_risk_score.desc()).all()
    results = []
    for v in vendors:
        results.append({
            "id": v.id,
            "name": v.name,
            "domain": v.domain,
            "category": v.category,
            "contact_email": v.contact_email,
            "business_criticality": v.business_criticality,
            "data_sensitivity": v.data_sensitivity,
            "external_exposure_score": v.external_exposure_score,
            "vulnerability_score": v.vulnerability_score,
            "credential_score": v.credential_score,
            "email_security_score": v.email_security_score,
            "hygiene_score": v.hygiene_score,
            "overall_risk_score": v.overall_risk_score,
            "risk_band": v.risk_band,
            "assessment_status": v.assessment_status,
            "last_assessed_at": v.last_assessed_at.strftime("%Y-%m-%d") if v.last_assessed_at else None,
            "notes": v.notes,
            "evidence": v.evidence or {}
        })
    return results

@router.get("/{vendor_id}")
def get_vendor_detail(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    return {
        "id": v.id,
        "name": v.name,
        "domain": v.domain,
        "category": v.category,
        "contact_email": v.contact_email,
        "business_criticality": v.business_criticality,
        "data_sensitivity": v.data_sensitivity,
        "scores": {
            "overall": v.overall_risk_score,
            "band": v.risk_band,
            "external_exposure": v.external_exposure_score,
            "vulnerability_posture": v.vulnerability_score,
            "credential_exposure": v.credential_score,
            "email_security": v.email_security_score, # SPF/DKIM/DMARC
            "security_hygiene": v.hygiene_score # TLS, headers
        },
        "assessment_status": v.assessment_status,
        "last_assessed_at": v.last_assessed_at.isoformat() if v.last_assessed_at else None,
        "evidence": v.evidence or {},
        "questionnaire_responses": v.questionnaire_responses or {},
        "notes": v.notes
    }

@router.post("/", status_code=201)
def create_vendor(
    req: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.RISK_MANAGER.value, RoleEnum.SECURITY_ANALYST.value]))
):
    existing = db.query(Vendor).filter(Vendor.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor with this name already exists")

    # Synthetic baseline scores for new vendor
    v = Vendor(
        name=req.name,
        domain=req.domain.lower(),
        category=req.category,
        contact_email=req.contact_email,
        business_criticality=req.business_criticality,
        data_sensitivity=req.data_sensitivity,
        external_exposure_score=45.0,
        vulnerability_score=35.0,
        credential_score=25.0,
        email_security_score=80.0,
        hygiene_score=75.0,
        overall_risk_score=42,
        risk_band="Moderate",
        assessment_status="Active",
        notes=req.notes
    )
    db.add(v)
    db.commit()
    db.refresh(v)

    log_audit(db, user=current_user.email, action="VENDOR_CREATE", object_name=f"Vendor: {v.name}")
    return v

@router.patch("/{vendor_id}")
def update_vendor(
    vendor_id: str,
    req: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.RISK_MANAGER.value]))
):
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    if req.business_criticality:
        v.business_criticality = req.business_criticality
    if req.data_sensitivity:
        v.data_sensitivity = req.data_sensitivity
    if req.assessment_status:
        v.assessment_status = req.assessment_status
    if req.notes is not None:
        v.notes = req.notes

    v.updated_at = datetime.utcnow()
    db.commit()

    log_audit(db, user=current_user.email, action="VENDOR_UPDATE", object_name=f"Vendor: {v.name}")
    return v

@router.post("/{vendor_id}/assess")
async def assess_vendor_protocol(
    vendor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.RISK_MANAGER.value, RoleEnum.SECURITY_ANALYST.value]))
):
    """Run real-world DNS, DMARC, SPF, and TLS protocols against vendor domain"""
    v = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")

    from app.providers.discovery.dns_provider import DNSProvider
    dns_provider = DNSProvider()

    # 1. Real DNS & DMARC Protocol
    dns_data = dns_provider._resolve_dns_records(v.domain)
    tls_data = dns_provider._inspect_tls_certificate(v.domain, 443)
    http_data = await dns_provider._inspect_http_protocol(v.domain)

    # 2. Email Security Protocol Scoring
    email_score = 40.0
    dmarc_policy = "none"
    if dns_data.get("dmarc_record"):
        dmarc_raw = dns_data["dmarc_record"].lower()
        if "p=reject" in dmarc_raw:
            email_score = 95.0
            dmarc_policy = "reject"
        elif "p=quarantine" in dmarc_raw:
            email_score = 80.0
            dmarc_policy = "quarantine"
        else:
            email_score = 60.0
            dmarc_policy = "none (monitoring only)"
    elif dns_data.get("spf_record"):
        email_score = 55.0

    # 3. Security Hygiene Protocol Scoring (TLS & HTTP Headers)
    hygiene_score = 50.0
    if tls_data.get("tls_version"):
        if "1.3" in str(tls_data["tls_version"]):
            hygiene_score = 95.0
        elif "1.2" in str(tls_data["tls_version"]):
            hygiene_score = 85.0
        else:
            hygiene_score = 60.0
    if http_data.get("hsts"):
        hygiene_score = min(100.0, hygiene_score + 5.0)

    # 4. Exposure score
    external_score = 30.0 if dns_data.get("a_records") else 10.0

    # 5. Composite Third-Party Risk Score (Higher score = Higher risk)
    # Risk is inverse of email security & hygiene, plus exposure
    calculated_risk = int(
        (100.0 - email_score) * 0.35 +
        (100.0 - hygiene_score) * 0.35 +
        (external_score * 0.30)
    )
    calculated_risk = max(5, min(95, calculated_risk))

    v.email_security_score = email_score
    v.hygiene_score = hygiene_score
    v.external_exposure_score = external_score
    v.overall_risk_score = calculated_risk
    v.risk_band = "Critical" if calculated_risk >= 75 else "High" if calculated_risk >= 50 else "Moderate" if calculated_risk >= 25 else "Low"
    v.last_assessed_at = datetime.utcnow()
    v.evidence = {
        "dns_protocol": {
            "a_records": dns_data.get("a_records", []),
            "mx_records": dns_data.get("mx_records", []),
            "spf": dns_data.get("spf_record"),
            "dmarc": dns_data.get("dmarc_record"),
            "dmarc_enforcement": dmarc_policy
        },
        "tls_protocol": {
            "tls_version": tls_data.get("tls_version"),
            "cipher": tls_data.get("cipher"),
            "issuer": tls_data.get("issuer"),
            "san_count": len(tls_data.get("sans", []))
        },
        "http_protocol": {
            "server": http_data.get("server"),
            "hsts": http_data.get("hsts"),
            "status_code": http_data.get("status_code")
        }
    }
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="VENDOR_PROTOCOL_ASSESSMENT",
        object_name=f"Vendor: {v.name} ({v.domain})",
        new_value=f"Score: {v.overall_risk_score} ({v.risk_band})"
    )

    return {
        "status": "Assessment completed",
        "vendor": v.name,
        "domain": v.domain,
        "overall_risk_score": v.overall_risk_score,
        "risk_band": v.risk_band,
        "protocol_telemetry": v.evidence
    }

