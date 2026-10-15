import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class CredentialProvider(Base):
    __tablename__ = "credential_providers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True) # HIBP, SpyCloud, Constella, Intelligence X
    code = Column(String(50), nullable=False, unique=True)
    provider_type = Column(String(50), default="CredentialIntelligence")
    is_configured = Column(Boolean, default=False)
    api_status = Column(String(50), default="Not configured") # Active, Degraded, Not configured, Rate-Limited
    rate_limit_remaining = Column(Integer, default=1000)
    config_metadata = Column(JSON, default=dict)
    last_health_check = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CredentialExposure(Base):
    """
    CRITICAL SECURITY DESIGN:
    ExposureX stores ONLY minimized exposure metadata.
    NEVER stores plaintext passwords, session cookies, hashes or auth tokens.
    """
    __tablename__ = "credential_exposures"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    identity_id = Column(String(36), ForeignKey("identities.id"), nullable=True)
    
    # Tokenized/hashed or minimized email reference
    email = Column(String(255), index=True, nullable=False)
    email_hash_sha256 = Column(String(64), index=True, nullable=True)
    domain = Column(String(255), index=True, nullable=False)
    
    provider = Column(String(100), nullable=False) # e.g., HIBP, SpyCloud, Constella, Intelligence X
    exposure_type = Column(String(100), default="Data Breach") # Data Breach, Stealer Log Metadata, Pastebin Metadata, Comb Compilation
    breach_title = Column(String(255), nullable=False)
    breach_date = Column(DateTime, nullable=True)
    first_observed = Column(DateTime, default=datetime.utcnow)
    last_observed = Column(DateTime, default=datetime.utcnow)
    
    confidence = Column(String(50), default="High") # Verified, High, Medium, Low
    severity = Column(String(50), default="High") # Critical, High, Moderate, Low
    source_category = Column(String(100), default="Commercial Intelligence") # Commercial Intelligence, Threat Actor Forum Metadata, Public Leak
    
    related_asset_id = Column(String(36), ForeignKey("assets.id"), nullable=True)
    risk_contribution = Column(Integer, default=70) # 0-100 contribution to risk score
    investigation_status = Column(String(50), default="New") # New, Under Investigation, Confirmed, Remediated, False Positive
    
    # Minimized non-sensitive metadata only (e.g. classes of data exposed like ['Email', 'Username', 'Job Title'], breach size)
    exposed_data_classes = Column(JSON, default=list) # e.g. ["Email", "Job Title", "Name"]
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    identity = relationship("Identity", back_populates="credential_exposures")
    asset = relationship("Asset", back_populates="credential_exposures")
    findings = relationship("Finding", back_populates="credential_exposure")

