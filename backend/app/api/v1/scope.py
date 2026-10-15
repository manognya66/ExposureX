"""Approved Organization Scope Management Endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.organization import ApprovedScope, Organization
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit
from app.engine.scope_validator import ScopeValidator

router = APIRouter(prefix="/scope", tags=["Approved Scope Boundaries"])

class ScopeCreate(BaseModel):
    scope_type: str # Domain, Wildcard, CIDR, IP
    pattern: str # e.g. "company.com", "*.company.com"
    description: Optional[str] = None

class ScopeValidationRequest(BaseModel):
    target: str

@router.get("/")
def list_scopes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    scopes = db.query(ApprovedScope).order_by(ApprovedScope.created_at.desc()).all()
    results = []
    for s in scopes:
        results.append({
            "id": s.id,
            "scope_type": s.scope_type,
            "pattern": s.pattern,
            "description": s.description,
            "is_active": s.is_active,
            "approved_by": s.approved_by,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M") if s.created_at else None
        })
    return results

@router.post("/", status_code=201)
def add_scope(
    req: ScopeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value]))
):
    org = db.query(Organization).first()
    if not org:
        org = Organization(name="Primary Organization", domain_primary=req.pattern.strip().lower())
        db.add(org)
        db.commit()
        db.refresh(org)

    new_scope = ApprovedScope(
        organization_id=org.id,
        scope_type=req.scope_type,
        pattern=req.pattern.strip().lower(),
        description=req.description,
        is_active=True,
        approved_by=current_user.email
    )
    db.add(new_scope)
    db.commit()
    db.refresh(new_scope)

    log_audit(db, user=current_user.email, action="SCOPE_ADD", object_name=f"ApprovedScope: {new_scope.pattern}")
    return new_scope

@router.post("/validate")
def validate_target(
    req: ScopeValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    approved_scopes = db.query(ApprovedScope).filter(ApprovedScope.is_active == True).all()
    is_allowed = ScopeValidator.is_target_in_scope(req.target, approved_scopes)
    return {
        "target": req.target,
        "is_in_scope": is_allowed,
        "decision": "APPROVED" if is_allowed else "REJECTED_OUT_OF_SCOPE",
        "matched_scopes": [s.pattern for s in approved_scopes if s.is_active]
    }

