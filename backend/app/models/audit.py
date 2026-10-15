import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user = Column(String(255), nullable=False) # Email or username
    action = Column(String(100), nullable=False) # LOGIN, LOGOUT, ASSET_CREATE, SCOPE_CHANGE, FINDING_UPDATE, RISK_ACCEPTANCE, etc.
    object = Column(String(255), nullable=False) # e.g. "Asset: vpn.company.com", "Finding: EXP-00042"
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(100), default="127.0.0.1")
    result = Column(String(50), default="SUCCESS") # SUCCESS, FAILURE, DENIED
    metadata_info = Column(JSON, default=dict)

