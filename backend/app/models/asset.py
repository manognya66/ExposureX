import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(50), nullable=False) # Domain, Subdomain, IP Address, Host, Web Application, API Endpoint, Certificate, Network Service
    domain = Column(String(255), nullable=True)
    ip = Column(String(100), nullable=True)
    port = Column(Integer, nullable=True)
    protocol = Column(String(50), nullable=True)
    technology = Column(String(255), nullable=True)
    discovery_source = Column(String(100), default="Passive DNS")
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="Active") # Active, Inactive, Unknown, Under Review
    business_criticality = Column(String(50), default="High") # Critical, High, Medium, Low
    owner = Column(String(255), nullable=True)
    tags = Column(JSON, default=list)
    risk_score = Column(Integer, default=50) # 0-100
    risk_band = Column(String(50), default="Moderate") # Low, Moderate, High, Critical
    
    # Metadata and extra evidence
    metadata_info = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    vulnerabilities = relationship("Vulnerability", back_populates="asset", cascade="all, delete-orphan")
    credential_exposures = relationship("CredentialExposure", back_populates="asset")
    findings = relationship("Finding", back_populates="asset")


class AssetRelationship(Base):
    __tablename__ = "asset_relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_asset_id = Column(String(36), ForeignKey("assets.id"), nullable=False)
    target_asset_id = Column(String(36), ForeignKey("assets.id"), nullable=False)
    relationship_type = Column(String(100), nullable=False) # resolves_to, hosts, serves_api, secures_cert, depends_on
    created_at = Column(DateTime, default=datetime.utcnow)

