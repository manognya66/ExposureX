import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    domain_primary = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scopes = relationship("ApprovedScope", back_populates="organization", cascade="all, delete-orphan")
    invites = relationship("UserInvite", back_populates="organization", cascade="all, delete-orphan")


class ApprovedScope(Base):
    __tablename__ = "approved_scopes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    scope_type = Column(String(50), default="Domain", nullable=False) # Domain, Wildcard, CIDR, IP
    pattern = Column(String(255), nullable=False) # e.g. "company.com", "*.company.com"
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    approved_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="scopes")


class UserInvite(Base):
    __tablename__ = "user_invites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    token = Column(String(64), unique=True, index=True, nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    invited_by_email = Column(String(255), nullable=False)
    invited_email = Column(String(255), nullable=True)
    allowed_domain = Column(String(255), nullable=False)  # Must be from the same company domain
    role = Column(String(50), default="Security Analyst", nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="invites")

