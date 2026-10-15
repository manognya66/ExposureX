"""Security utilities: Password hashing, verification, and JWT creation"""
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import jwt
from app.config import settings

def hash_password(password: str) -> str:
    """Hash password using bcrypt with salt. Truncates to 72 bytes if needed."""
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(
    subject: Any,
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Generate JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode = {"exp": expire, "sub": str(subject)}
    if email:
        to_encode["email"] = email
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

