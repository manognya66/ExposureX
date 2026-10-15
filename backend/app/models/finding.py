import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    finding_ref = Column(String(50), unique=True, index=True, nullable=False) # e.g. EXP-00042
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="High") # Critical, High, Moderate, Low
    risk_score = Column(Integer, default=70) # 0-100
    risk_band = Column(String(50), default="High")
    
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    asset_id = Column(String(36), ForeignKey("assets.id"), nullable=True)
    identity_id = Column(String(36), ForeignKey("identities.id"), nullable=True)
    credential_exposure_id = Column(String(36), ForeignKey("credential_exposures.id"), nullable=True)
    vulnerability_id = Column(String(36), ForeignKey("vulnerabilities.id"), nullable=True)
    
    source = Column(String(100), default="ExposureX Correlation Engine")
    evidence = Column(JSON, default=dict) # Structured evidence, contributing factor signals
    
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="New") # New, Investigating, Confirmed, False Positive, Remediating, Resolved, Accepted Risk
    owner = Column(String(255), nullable=True) # Assigned analyst name/email
    recommended_action = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    asset = relationship("Asset", back_populates="findings")
    identity = relationship("Identity", back_populates="findings")
    credential_exposure = relationship("CredentialExposure", back_populates="findings")
    vulnerability = relationship("Vulnerability", back_populates="findings")

