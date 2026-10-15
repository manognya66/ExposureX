import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Identity(Base):
    __tablename__ = "identities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    account_type = Column(String(50), default="Employee") # Employee, Service account, Privileged account, Contractor, Third-party identity
    is_privileged = Column(Boolean, default=False)
    business_criticality = Column(String(50), default="Medium") # Critical, High, Medium, Low
    status = Column(String(50), default="Active") # Active, Suspended, Flagged
    associated_asset_ids = Column(JSON, default=list) # List of asset IDs or domains
    credential_exposure_count = Column(Integer, default=0)
    risk_score = Column(Integer, default=40)
    risk_band = Column(String(50), default="Moderate")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    credential_exposures = relationship("CredentialExposure", back_populates="identity")
    findings = relationship("Finding", back_populates="identity")

