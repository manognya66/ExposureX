"""Identity Management & Secure CSV Import Endpoints"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import csv
import io

from app.database import get_db
from app.models.identity import Identity
from app.models.credential import CredentialExposure
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit

router = APIRouter(prefix="/identities", tags=["Identity Management"])

class IdentityCreate(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    account_type: Optional[str] = "Employee" # Employee, Service account, Privileged account, Contractor, Third-party identity
    is_privileged: Optional[bool] = False
    business_criticality: Optional[str] = "Medium"
    status: Optional[str] = "Active"
    associated_asset_ids: Optional[List[str]] = []

@router.get("/")
def list_identities(
    department: Optional[str] = None,
    account_type: Optional[str] = None,
    is_privileged: Optional[bool] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(Identity)
    if department:
        query = query.filter(Identity.department == department)
    if account_type:
        query = query.filter(Identity.account_type == account_type)
    if is_privileged is not None:
        query = query.filter(Identity.is_privileged == is_privileged)
    if status:
        query = query.filter(Identity.status == status)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((Identity.email.ilike(s)) | (Identity.username.ilike(s)) | (Identity.role.ilike(s)))

    identities = query.order_by(Identity.risk_score.desc()).all()
    results = []
    for i in identities:
        results.append({
            "id": i.id,
            "email": i.email,
            "username": i.username,
            "department": i.department,
            "role": i.role,
            "account_type": i.account_type,
            "is_privileged": i.is_privileged,
            "business_criticality": i.business_criticality,
            "status": i.status,
            "associated_asset_ids": i.associated_asset_ids or [],
            "credential_exposure_count": i.credential_exposure_count,
            "risk_score": i.risk_score,
            "risk_band": i.risk_band,
            "created_at": i.created_at.isoformat() if i.created_at else None
        })
    return results

@router.get("/{identity_id}")
def get_identity_detail(
    identity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    ident = db.query(Identity).filter(Identity.id == identity_id).first()
    if not ident:
        raise HTTPException(status_code=404, detail="Identity not found")

    # Minimized credential exposures
    exposures = [
        {
            "id": e.id,
            "email": e.email,
            "domain": e.domain,
            "breach_title": e.breach_title,
            "breach_date": e.breach_date.isoformat() if e.breach_date else None,
            "exposure_type": e.exposure_type,
            "confidence": e.confidence,
            "severity": e.severity,
            "exposed_data_classes": e.exposed_data_classes or [],
            "investigation_status": e.investigation_status
        }
        for e in ident.credential_exposures
    ]

    return {
        "id": ident.id,
        "email": ident.email,
        "username": ident.username,
        "department": ident.department,
        "role": ident.role,
        "account_type": ident.account_type,
        "is_privileged": ident.is_privileged,
        "business_criticality": ident.business_criticality,
        "status": ident.status,
        "associated_asset_ids": ident.associated_asset_ids or [],
        "credential_exposure_count": ident.credential_exposure_count,
        "risk_score": ident.risk_score,
        "risk_band": ident.risk_band,
        "credential_exposures": exposures
    }

@router.post("/", status_code=201)
def create_identity(
    ident_in: IdentityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    existing = db.query(Identity).filter(Identity.email == ident_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Identity with this email already exists")

    new_ident = Identity(
        email=ident_in.email.lower(),
        username=ident_in.username or ident_in.email.split("@")[0],
        department=ident_in.department,
        role=ident_in.role,
        account_type=ident_in.account_type,
        is_privileged=ident_in.is_privileged,
        business_criticality=ident_in.business_criticality,
        status=ident_in.status,
        associated_asset_ids=ident_in.associated_asset_ids or [],
        credential_exposure_count=0,
        risk_score=75 if ident_in.is_privileged else 40,
        risk_band="Critical" if ident_in.is_privileged else "Moderate"
    )
    db.add(new_ident)
    db.commit()
    db.refresh(new_ident)

    log_audit(db, user=current_user.email, action="IDENTITY_CREATE", object_name=f"Identity: {new_ident.email}")
    return new_ident

@router.post("/import-csv")
async def import_identities_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    """Secure CSV bulk import for identity context (Entra ID / HR export)"""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(decoded))
    imported_count = 0
    errors = []

    for idx, row in enumerate(reader):
        email = row.get("email", "").strip().lower()
        if not email or "@" not in email:
            errors.append(f"Row {idx+1}: Missing or invalid email '{email}'")
            continue

        existing = db.query(Identity).filter(Identity.email == email).first()
        if existing:
            continue

        is_priv = str(row.get("is_privileged", "false")).lower() in ("true", "1", "yes")
        account_type = row.get("account_type", "Employee").strip()
        criticality = row.get("business_criticality", "High" if is_priv else "Medium").strip()

        ident = Identity(
            email=email,
            username=row.get("username", email.split("@")[0]).strip(),
            department=row.get("department", "General").strip(),
            role=row.get("role", "Staff").strip(),
            account_type=account_type,
            is_privileged=is_priv,
            business_criticality=criticality,
            status=row.get("status", "Active").strip(),
            risk_score=70 if is_priv else 35,
            risk_band="High" if is_priv else "Moderate"
        )
        db.add(ident)
        imported_count += 1

    db.commit()
    log_audit(
        db,
        user=current_user.email,
        action="IDENTITY_CSV_IMPORT",
        object_name=f"File: {file.filename}",
        new_value=f"Imported {imported_count} identities"
    )

    return {
        "status": "Success",
        "imported_count": imported_count,
        "errors": errors
    }

