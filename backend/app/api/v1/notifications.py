"""Security Pulse Notification Endpoints & Real-time Alerting"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.notification import SecurityPulseNotification
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.websocket.manager import pulse_manager

router = APIRouter(prefix="/notifications", tags=["Security Pulse Notifications"])

class NotificationCreate(BaseModel):
    title: str
    message: str
    severity: str = "High" # Critical, High, Moderate, Low
    event_type: str = "critical_exposure"
    reasons: Optional[List[str]] = []
    action_url: Optional[str] = "/operations/findings"

@router.get("/")
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(SecurityPulseNotification)
    if unread_only:
        query = query.filter(SecurityPulseNotification.is_read == False)

    notes = query.order_by(SecurityPulseNotification.timestamp.desc()).limit(50).all()
    results = []
    for n in notes:
        results.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "severity": n.severity,
            "event_type": n.event_type,
            "reasons": n.reasons or [],
            "action_url": n.action_url,
            "is_read": n.is_read,
            "timestamp": n.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        })
    return results

@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    n = db.query(SecurityPulseNotification).filter(SecurityPulseNotification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"status": "Marked read"}

@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(SecurityPulseNotification).filter(SecurityPulseNotification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "All marked read"}

@router.post("/trigger", status_code=201)
async def trigger_security_pulse(
    item: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    """Trigger a Security Pulse event (persists and broadcasts to WebSockets)"""
    n = SecurityPulseNotification(
        title=item.title,
        message=item.message,
        severity=item.severity,
        event_type=item.event_type,
        reasons=item.reasons or [],
        action_url=item.action_url,
        is_read=False,
        timestamp=datetime.utcnow()
    )
    db.add(n)
    db.commit()
    db.refresh(n)

    # Live WebSocket push
    await pulse_manager.broadcast_pulse({
        "type": "SECURITY_PULSE_ALERT",
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "severity": n.severity,
        "reasons": n.reasons,
        "action_url": n.action_url,
        "timestamp": n.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    })

    return n

