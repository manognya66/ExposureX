"""Demo Mode dataset reset and inspection endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from app.seed_data import seed_database
from app.models.user import User
from app.core.security import create_access_token

router = APIRouter(prefix="/demo", tags=["Demo Mode Management"])

@router.post("/reset-demo-data")
def reset_demo_data(db: Session = Depends(get_db)):
    """Reset and re-seed the full synthetic enterprise dataset for demo evaluation"""
    # Drop and recreate tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database(db)

    admin_user = db.query(User).filter(User.email == "admin@company.com").first()
    token = create_access_token(subject=admin_user.id, email=admin_user.email)

    return {
        "status": "Success",
        "access_token": token,
        "token_type": "bearer",
        "message": "ExposureX synthetic enterprise dataset reset and seeded successfully.",
        "primary_domain": "company.com",
        "demo_accounts": [
            {"email": "admin@company.com", "role": "Administrator"},
            {"email": "security@company.com", "role": "Security Analyst"},
            {"email": "risk@company.com", "role": "Risk Manager"},
            {"email": "auditor@company.com", "role": "Auditor"},
            {"email": "viewer@company.com", "role": "Viewer"}
        ],
        "default_password": "ExposureX@2026!"
    }

