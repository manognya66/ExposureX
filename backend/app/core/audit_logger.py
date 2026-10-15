"""Audit logging helper for ExposureX compliance and forensics"""
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit(
    db: Session,
    user: str,
    action: str,
    object_name: str,
    previous_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: str = "127.0.0.1",
    result: str = "SUCCESS",
    metadata_info: Optional[dict] = None
) -> AuditLog:
    """Record an audit log entry in the database."""
    entry = AuditLog(
        timestamp=datetime.utcnow(),
        user=user,
        action=action,
        object=object_name,
        previous_value=previous_value,
        new_value=new_value,
        ip_address=ip_address,
        result=result,
        metadata_info=metadata_info or {}
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

