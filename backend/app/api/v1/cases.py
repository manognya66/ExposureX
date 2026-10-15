"""Security Case Management Endpoints: Incident response, collaboration, resolution workflows"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.case import SecurityCase, CaseComment
from app.models.finding import Finding
from app.models.asset import Asset
from app.models.identity import Identity
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit
from app.websocket.manager import pulse_manager

router = APIRouter(prefix="/cases", tags=["Case Management"])

class CaseCreate(BaseModel):
    title: str
    severity: str = "High" # Critical, High, Moderate, Low
    risk_score: Optional[int] = 75
    description: Optional[str] = None
    assigned_analyst: Optional[str] = None
    related_finding_ref: Optional[str] = None

class CaseStatusUpdate(BaseModel):
    status: str # Open, Investigating, Pending, Resolved, Closed
    resolution: Optional[str] = None
    analyst_notes: Optional[str] = None

class CaseCommentCreate(BaseModel):
    comment: str

@router.get("/")
def list_cases(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    assigned_analyst: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(SecurityCase)
    if status:
        query = query.filter(SecurityCase.status == status)
    if severity:
        query = query.filter(SecurityCase.severity == severity)
    if assigned_analyst:
        query = query.filter(SecurityCase.assigned_analyst == assigned_analyst)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((SecurityCase.case_ref.ilike(s)) | (SecurityCase.title.ilike(s)))

    cases = query.order_by(SecurityCase.risk_score.desc()).all()
    results = []
    for c in cases:
        results.append({
            "id": c.id,
            "case_ref": c.case_ref,
            "title": c.title,
            "severity": c.severity,
            "risk_score": c.risk_score,
            "description": c.description,
            "assigned_analyst": c.assigned_analyst,
            "status": c.status,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else None,
            "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M") if c.updated_at else None,
            "comments_count": len(c.comments)
        })
    return results

@router.get("/{case_id}")
def get_case_detail(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    c = db.query(SecurityCase).filter((SecurityCase.id == case_id) | (SecurityCase.case_ref == case_id)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    comments = [
        {
            "id": comm.id,
            "user_name": comm.user_name,
            "comment": comm.comment,
            "created_at": comm.created_at.strftime("%Y-%m-%d %H:%M") if comm.created_at else None
        }
        for comm in c.comments
    ]

    # Resolve related finding details if any
    related_findings_details = []
    for fid in (c.related_finding_ids or []):
        f = db.query(Finding).filter(Finding.id == fid).first()
        if f:
            related_findings_details.append({
                "id": f.id,
                "ref": f.finding_ref,
                "title": f.title,
                "severity": f.severity,
                "risk_score": f.risk_score
            })

    return {
        "id": c.id,
        "case_ref": c.case_ref,
        "title": c.title,
        "severity": c.severity,
        "risk_score": c.risk_score,
        "description": c.description,
        "evidence": c.evidence or {},
        "assigned_analyst": c.assigned_analyst,
        "status": c.status,
        "resolution": c.resolution,
        "analyst_notes": c.analyst_notes,
        "audit_history": c.audit_history or [],
        "comments": comments,
        "related_findings": related_findings_details,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None
    }

@router.post("/", status_code=201)
def create_case(
    item: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    count = db.query(SecurityCase).count() + 1
    ref = f"INC-{count:04d}"

    related_finding_ids = []
    if item.related_finding_ref:
        f = db.query(Finding).filter(Finding.finding_ref == item.related_finding_ref).first()
        if f:
            related_finding_ids.append(f.id)

    case = SecurityCase(
        case_ref=ref,
        title=item.title,
        severity=item.severity,
        risk_score=item.risk_score or 75,
        description=item.description,
        assigned_analyst=item.assigned_analyst or current_user.full_name,
        assigned_analyst_id=current_user.id,
        status="Open",
        related_finding_ids=related_finding_ids,
        audit_history=[
            {"timestamp": datetime.utcnow().isoformat(), "action": f"Case created by {current_user.email}", "user": current_user.email}
        ]
    )
    db.add(case)
    db.commit()
    db.refresh(case)

    log_audit(db, user=current_user.email, action="CASE_CREATE", object_name=f"Case: {case.case_ref}")
    return case

@router.patch("/{case_id}/status")
def update_case_status(
    case_id: str,
    req: CaseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    c = db.query(SecurityCase).filter((SecurityCase.id == case_id) | (SecurityCase.case_ref == case_id)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    prev = c.status
    c.status = req.status
    if req.resolution:
        c.resolution = req.resolution
    if req.analyst_notes:
        c.analyst_notes = req.analyst_notes

    # Append to audit history
    audit_hist = list(c.audit_history or [])
    audit_hist.append({
        "timestamp": datetime.utcnow().isoformat(),
        "action": f"Status changed from {prev} to {req.status}",
        "user": current_user.email,
        "notes": req.analyst_notes or req.resolution
    })
    c.audit_history = audit_hist
    c.updated_at = datetime.utcnow()
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="CASE_STATUS_CHANGE",
        object_name=f"Case: {c.case_ref}",
        previous_value=prev,
        new_value=req.status
    )
    return {"status": "Updated", "case_ref": c.case_ref, "new_status": c.status}

@router.post("/{case_id}/comments", status_code=201)
def add_case_comment(
    case_id: str,
    req: CaseCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(SecurityCase).filter((SecurityCase.id == case_id) | (SecurityCase.case_ref == case_id)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")

    comment = CaseComment(
        case_id=c.id,
        user_id=current_user.id,
        user_name=current_user.full_name or current_user.email,
        comment=req.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return {
        "id": comment.id,
        "user_name": comment.user_name,
        "comment": comment.comment,
        "created_at": comment.created_at.strftime("%Y-%m-%d %H:%M")
    }

