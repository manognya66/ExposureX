"""Audit Logging API Endpoints"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/")
def list_audit_logs(
    user: Optional[str] = None,
    action: Optional[str] = None,
    result: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.AUDITOR.value, RoleEnum.SECURITY_ANALYST.value]))
) -> List[Dict[str, Any]]:
    query = db.query(AuditLog)
    if user:
        query = query.filter(AuditLog.user.ilike(f"%{user}%"))
    if action:
        query = query.filter(AuditLog.action == action)
    if result:
        query = query.filter(AuditLog.result == result)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((AuditLog.object.ilike(s)) | (AuditLog.user.ilike(s)) | (AuditLog.action.ilike(s)))

    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    results = []
    for l in logs:
        results.append({
            "id": l.id,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S") if l.timestamp else None,
            "user": l.user,
            "action": l.action,
            "object": l.object,
            "previous_value": l.previous_value,
            "new_value": l.new_value,
            "ip_address": l.ip_address,
            "result": l.result,
            "metadata_info": l.metadata_info or {}
        })
    return results

