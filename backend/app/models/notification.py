import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON
from app.database import Base

class SecurityPulseNotification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="High") # Critical, High, Moderate, Low, Info
    event_type = Column(String(100), nullable=False) # critical_exposure, new_credential_exposure, new_critical_vulnerability, risk_score_increase, third_party_risk_increase, case_assignment, case_escalation
    
    related_entity_type = Column(String(50), nullable=True) # asset, identity, finding, case, vendor
    related_entity_id = Column(String(36), nullable=True)
    
    reasons = Column(JSON, default=list) # bullet points e.g. ["Critical vulnerability", "Credential exposure", "Critical business asset"]
    action_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow)

