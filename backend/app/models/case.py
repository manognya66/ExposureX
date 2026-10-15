import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class SecurityCase(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. INC-0001
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="High") # Critical, High, Moderate, Low
    risk_score = Column(Integer, default=75) # 0-100
    description = Column(Text, nullable=True)
    evidence = Column(JSON, default=dict)
    
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    assigned_analyst = Column(String(255), nullable=True)
    assigned_analyst_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    status = Column(String(50), default="Open") # Open, Investigating, Pending, Resolved, Closed
    resolution = Column(Text, nullable=True)
    analyst_notes = Column(Text, nullable=True)
    
    related_finding_ids = Column(JSON, default=list)
    related_asset_ids = Column(JSON, default=list)
    related_identity_ids = Column(JSON, default=list)
    
    audit_history = Column(JSON, default=list) # List of audit events for this case
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = relationship("CaseComment", back_populates="case", cascade="all, delete-orphan")


class CaseComment(Base):
    __tablename__ = "case_comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_name = Column(String(255), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("SecurityCase", back_populates="comments")

