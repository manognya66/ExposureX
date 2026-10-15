import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from app.database import Base

class RiskScoreRecord(Base):
    __tablename__ = "risk_scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False) # "overall", "internal", "third_party", "asset", "identity"
    entity_id = Column(String(36), nullable=True) # None for global/overall or org level
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    
    overall_score = Column(Integer, nullable=False) # 0 - 100
    risk_band = Column(String(50), nullable=False) # Low, Moderate, High, Critical
    
    # 4 Core Configurable Pillars (0 - 100)
    exposure_score = Column(Float, default=0.0)
    vulnerability_score = Column(Float, default=0.0)
    credential_score = Column(Float, default=0.0)
    business_impact_score = Column(Float, default=0.0)
    
    # Weights applied
    weights_json = Column(JSON, default=lambda: {
        "exposure": 0.30,
        "vulnerability": 0.25,
        "credential_exposure": 0.25,
        "business_impact": 0.20
    })
    
    # Detailed transparent explainability
    calculation_formula = Column(String(255), default="Risk = Exposure×30% + Vulnerability×25% + Credential×25% + BusinessImpact×20%")
    contributing_factors = Column(JSON, default=list) # List of factor strings & weights
    evidence_summary = Column(JSON, default=dict)
    recommended_action = Column(Text, nullable=True)
    
    recorded_at = Column(DateTime, default=datetime.utcnow)

