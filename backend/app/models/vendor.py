import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from app.database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False, unique=True)
    domain = Column(String(255), nullable=False)
    category = Column(String(100), default="SaaS Provider") # Cloud Hosting, SaaS, Supply Chain, Payment Gateway, IT Services
    contact_email = Column(String(255), nullable=True)
    business_criticality = Column(String(50), default="High") # Critical, High, Medium, Low
    data_sensitivity = Column(String(50), default="Confidential") # Restricted, Confidential, Internal, Public
    
    # Pillar sub-scores (0 - 100)
    external_exposure_score = Column(Float, default=50.0)
    vulnerability_score = Column(Float, default=40.0)
    credential_score = Column(Float, default=30.0)
    email_security_score = Column(Float, default=65.0) # SPF/DKIM/DMARC posture
    hygiene_score = Column(Float, default=60.0) # TLS, HTTP headers, DNSSEC
    
    overall_risk_score = Column(Integer, default=52) # 0-100
    risk_band = Column(String(50), default="High") # Low, Moderate, High, Critical
    
    assessment_status = Column(String(50), default="Active") # Active, Under Review, Pending Assessment, Archived
    last_assessed_at = Column(DateTime, default=datetime.utcnow)
    
    evidence = Column(JSON, default=dict)
    notes = Column(Text, nullable=True)
    questionnaire_responses = Column(JSON, default=dict) # For manual/automated assessment questionnaires
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

