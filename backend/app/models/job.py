import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from app.database import Base

class ScanJob(Base):
    __tablename__ = "scan_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    provider_name = Column(String(100), nullable=False)
    job_type = Column(String(100), nullable=False) # AssetDiscovery, CredentialSync, VulnSync, ScopeVerification
    target_scope = Column(String(255), nullable=False)
    status = Column(String(50), default="Pending") # Pending, Running, Completed, Failed, RejectedScope
    items_discovered = Column(Integer, default=0)
    summary = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)


class CorrelationRule(Base):
    __tablename__ = "correlation_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(String(10), default="true")
    priority = Column(Integer, default=1)
    condition_expression = Column(Text, nullable=False) # Human readable / parsed condition
    action_type = Column(String(100), default="ESCALATE_RISK_AND_FINDING")
    created_at = Column(DateTime, default=datetime.utcnow)

