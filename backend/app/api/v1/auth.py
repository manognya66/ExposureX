"""Authentication and User Management Endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, RoleEnum
from app.models.organization import Organization, ApprovedScope, UserInvite
from app.core.security import verify_password, hash_password, create_access_token
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit

import random
import secrets

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: str
    role: str
    mfa_required: bool = False
    mfa_temp_code: Optional[str] = None

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    organization_name: Optional[str] = None
    invite_token: Optional[str] = None

class SignUpResponse(BaseModel):
    mfa_required: bool = True
    user_id: str
    email: str
    full_name: str
    mfa_temp_code: str
    message: str

class MfaVerifyRequest(BaseModel):
    user_id: str
    code: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = RoleEnum.SECURITY_ANALYST.value

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ForgotPasswordResponse(BaseModel):
    message: str
    email: str
    reset_code_simulated: Optional[str] = None

class ResetPasswordConfirmRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class SsoAuthRequest(BaseModel):
    provider: str  # "google" | "microsoft"
    email: EmailStr
    full_name: Optional[str] = None
    invite_token: Optional[str] = None

class CreateInviteRequest(BaseModel):
    invited_email: Optional[EmailStr] = None
    role: str = RoleEnum.SECURITY_ANALYST.value

class InviteResponse(BaseModel):
    status: str
    invite_token: str
    invite_url: str
    company_name: str
    allowed_domain: str
    role: str
    expires_at: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    organization_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    clean_email = form_data.username.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        log_audit(db, user=clean_email, action="LOGIN_NOT_FOUND", object_name="User Authentication", result="DENIED")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ACCOUNT_NOT_FOUND: No account registered with this email. Please sign up.",
        )

    if not verify_password(form_data.password, user.hashed_password):
        log_audit(db, user=clean_email, action="LOGIN_FAILED", object_name="User Authentication", result="DENIED")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    # If MFA is enabled for this user, challenge with 6-digit verification code
    if user.mfa_enabled:
        temp_code = f"{random.randint(100000, 999999)}"
        user.mfa_temp_code = temp_code
        db.commit()
        log_audit(db, user=user.email, action="MFA_CHALLENGE", object_name="MFA Authentication", result="PENDING")
        return {
            "access_token": "",
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "mfa_required": True,
            "mfa_temp_code": temp_code
        }

    access_token = create_access_token(subject=user.id, email=user.email)
    log_audit(db, user=user.email, action="LOGIN", object_name="User Authentication", result="SUCCESS")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "mfa_required": False
    }

@router.post("/signup", response_model=SignUpResponse)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please sign in."
        )

    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # First user to sign up or first member of an organization gets Administrator role
    total_users = db.query(User).count()
    assigned_role = RoleEnum.ADMINISTRATOR.value if total_users == 0 else RoleEnum.SECURITY_ANALYST.value

    # Generate 6-digit MFA verification code
    mfa_code = f"{random.randint(100000, 999999)}"

    # Ensure a tenant organization exists or match by domain
    email_domain = clean_email.split("@")[1] if "@" in clean_email else ""
    org = None

    if req.invite_token:
        invite = db.query(UserInvite).filter(UserInvite.token == req.invite_token.strip()).first()
        if not invite or invite.is_used or invite.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The invite link is invalid or has expired."
            )
        if email_domain != invite.allowed_domain and not email_domain.endswith(f".{invite.allowed_domain}"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This invite is strictly reserved for colleagues from @{invite.allowed_domain}."
            )
        org = db.query(Organization).filter(Organization.id == invite.organization_id).first()
        assigned_role = invite.role

    if not org and email_domain:
        org = db.query(Organization).filter(Organization.domain_primary == email_domain).first()

    if not org:
        org_name = req.organization_name.strip() if req.organization_name else (email_domain.split(".")[0].capitalize() + " Enterprise" if email_domain else "Enterprise")
        existing_named = db.query(Organization).filter(Organization.name == org_name).first()
        if existing_named:
            org = existing_named
        else:
            org = Organization(name=org_name, domain_primary=email_domain or "enterprise.local")
            db.add(org)
            db.commit()
            db.refresh(org)

            if email_domain and "." in email_domain:
                scope = ApprovedScope(
                    organization_id=org.id,
                    scope_type="Domain",
                    pattern=email_domain,
                    description=f"Primary perimeter scope for {org.name}",
                    is_active=True,
                    approved_by=clean_email
                )
                db.add(scope)
                db.commit()

    if not req.invite_token:
        org_user_count = db.query(User).filter(User.organization_id == org.id).count() if org else 0
        if org_user_count == 0 or total_users == 0:
            assigned_role = RoleEnum.ADMINISTRATOR.value

    user_full_name = req.full_name.strip() if req.full_name and req.full_name.strip() else (clean_email.split("@")[0].replace(".", " ").title() if "@" in clean_email else "Enterprise User")
    new_user = User(
        email=clean_email,
        hashed_password=hash_password(req.password),
        full_name=user_full_name,
        role=assigned_role,
        is_active=True,
        mfa_enabled=False, # Set to True after MFA code is entered
        mfa_temp_code=mfa_code,
        organization_id=org.id if org else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db,
        user=new_user.email,
        action="USER_SIGNUP",
        object_name=f"User: {new_user.email}",
        new_value=f"Role: {assigned_role} | MFA Pending"
    )

    return {
        "mfa_required": True,
        "user_id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "mfa_temp_code": mfa_code,
        "message": "Sign up successful! Please complete Multi-Factor Authentication (MFA) verification."
    }

@router.post("/mfa/verify", response_model=TokenResponse)
def verify_mfa(req: MfaVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.mfa_temp_code or user.mfa_temp_code.strip() != req.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired MFA verification code. Please enter the correct 6-digit code."
        )

    # Activate MFA and clear temporary code
    user.mfa_enabled = True
    user.mfa_temp_code = None
    db.commit()

    access_token = create_access_token(subject=user.id, email=user.email)
    log_audit(db, user=user.email, action="MFA_VERIFIED", object_name="User Authentication", result="SUCCESS")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "mfa_required": False
    }

# In-memory reset code cache with 15-minute validity window
_reset_codes: Dict[str, Dict[str, Any]] = {}

@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ACCOUNT_NOT_FOUND: No registered account found with this email. Please check the address or sign up."
        )

    # Generate 6-digit reset code
    code = f"{random.randint(100000, 999999)}"
    _reset_codes[clean_email] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=15)
    }
    user.mfa_temp_code = code
    db.commit()

    log_audit(db, user=clean_email, action="FORGOT_PASSWORD_REQUEST", object_name="User Authentication", result="CODE_ISSUED")

    return {
        "message": f"Verification code generated for {clean_email}. Use this code to reset your password.",
        "email": clean_email,
        "reset_code_simulated": code
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordConfirmRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")

    # Validate code against cache or stored temp code
    cached = _reset_codes.get(clean_email)
    valid = False
    if cached and cached.get("code") == req.reset_code.strip():
        if datetime.utcnow() <= cached.get("expires_at", datetime.utcnow()):
            valid = True
    elif user.mfa_temp_code and user.mfa_temp_code.strip() == req.reset_code.strip():
        valid = True

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code. Please request a new code.")

    user.hashed_password = hash_password(req.new_password)
    user.mfa_temp_code = None
    if clean_email in _reset_codes:
        del _reset_codes[clean_email]
    db.commit()

    log_audit(db, user=clean_email, action="PASSWORD_RESET", object_name="User Authentication", result="SUCCESS")

    return {"status": "success", "message": "Password updated successfully. You may now sign in."}

DISALLOWED_CONSUMER_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "ymail.com", "hotmail.com",
    "outlook.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
    "aol.com", "proton.me", "protonmail.com", "zoho.com", "yandex.com",
    "mail.com", "gmx.com", "gmx.net", "tutanota.com", "fastmail.com",
    "163.com", "qq.com"
}

def is_valid_corporate_domain(email_domain: str) -> bool:
    """Validate that the domain is a legitimate corporate domain, blocking public consumer webmail providers."""
    email_domain = email_domain.strip().lower()
    if not email_domain or "." not in email_domain or len(email_domain) < 3:
        return False
    if email_domain in DISALLOWED_CONSUMER_DOMAINS:
        return False
    return True

def get_registered_enterprise_domains(db: Session) -> List[str]:
    """Retrieve all authorized enterprise domains from organizations, config, and active scopes."""
    domains = set()
    from app.config import settings
    if settings.REGISTERED_DOMAINS:
        for d in settings.REGISTERED_DOMAINS.split(","):
            cleaned = d.strip().lower().lstrip("*.")
            if cleaned:
                domains.add(cleaned)
    for org in db.query(Organization).all():
        if org.domain_primary:
            cleaned = org.domain_primary.strip().lower().lstrip("*.")
            if cleaned:
                domains.add(cleaned)
    from app.models.organization import ApprovedScope
    for s in db.query(ApprovedScope).filter(ApprovedScope.is_active == True).all():
        pat = s.pattern.strip().lower()
        if s.scope_type in ("Domain", "Wildcard") or ("." in pat and "/" not in pat):
            cleaned = pat.lstrip("*.")
            if cleaned:
                domains.add(cleaned)
    return sorted(list(domains))

@router.get("/sso/domains")
def get_sso_registered_domains(db: Session = Depends(get_db)):
    """Returns list of enterprise domains currently active for SSO authentication."""
    return {"registered_domains": get_registered_enterprise_domains(db)}

@router.post("/sso", response_model=TokenResponse)
def sso_authenticate(req: SsoAuthRequest, db: Session = Depends(get_db)):
    provider_name = req.provider.capitalize()
    clean_email = req.email.strip().lower()
    name = req.full_name.strip() if req.full_name else clean_email.split("@")[0].capitalize()

    if "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format."
        )

    email_domain = clean_email.split("@")[1].strip().lower()

    # 1. If an invitation token is provided, verify against the company invite
    invite = None
    if req.invite_token:
        invite = db.query(UserInvite).filter(UserInvite.token == req.invite_token.strip()).first()
        if not invite or invite.is_used or invite.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The invite link is invalid or has expired."
            )
        if email_domain != invite.allowed_domain and not email_domain.endswith(f".{invite.allowed_domain}"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This invite is strictly reserved for colleagues from @{invite.allowed_domain}. Your domain @{email_domain} does not match."
            )

    # 2. Block public consumer webmails (gmail, yahoo, etc.)
    if not is_valid_corporate_domain(email_domain):
        log_audit(
            db,
            user=clean_email,
            action=f"{provider_name.upper()}_SSO_DENIED",
            object_name="SSO Authentication",
            result=f"DENIED_CONSUMER_DOMAIN: {email_domain}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Single Sign-On is strictly reserved for company enterprise domains. Public webmail addresses (@{email_domain}) are not permitted. Please sign in with your corporate email (e.g., @abc.com) or ask an admin for a company invite URL."
        )

    # 3. Match or auto-provision company organization
    org = None
    if invite and invite.organization_id:
        org = db.query(Organization).filter(Organization.id == invite.organization_id).first()
    if not org:
        org = db.query(Organization).filter(Organization.domain_primary == email_domain).first()
    if not org:
        # Check active scopes for this domain
        scope_match = db.query(ApprovedScope).filter(
            ApprovedScope.pattern.in_([email_domain, f"*.{email_domain}"]),
            ApprovedScope.is_active == True
        ).first()
        if scope_match:
            org = db.query(Organization).filter(Organization.id == scope_match.organization_id).first()

    if not org:
        # Auto-provision organization for this company domain (e.g. abc.com -> Abc Enterprise)
        company_label = email_domain.split('.')[0].capitalize()
        org_name = f"{company_label} Enterprise"
        existing_named = db.query(Organization).filter(Organization.name == org_name).first()
        if existing_named:
            org = existing_named
        else:
            org = Organization(name=org_name, domain_primary=email_domain)
            db.add(org)
            db.commit()
            db.refresh(org)

            domain_scope = ApprovedScope(
                organization_id=org.id,
                scope_type="Domain",
                pattern=email_domain,
                description=f"Primary perimeter scope for {org.name}",
                is_active=True,
                approved_by=clean_email
            )
            db.add(domain_scope)
            db.commit()

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        total_users = db.query(User).count()
        org_user_count = db.query(User).filter(User.organization_id == org.id).count() if org else 0
        if not invite and (total_users == 0 or org_user_count == 0):
            role = RoleEnum.ADMINISTRATOR.value
        else:
            role = invite.role if invite else RoleEnum.SECURITY_ANALYST.value
        user = User(
            email=clean_email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            full_name=name,
            role=role,
            is_active=True,
            mfa_enabled=False,
            organization_id=org.id if org else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        log_audit(db, user=user.email, action=f"{provider_name.upper()}_SSO_SIGNUP", object_name=f"SSO Provider: {provider_name}", result="SUCCESS")
    else:
        if not user.organization_id and org:
            user.organization_id = org.id
            db.commit()
        log_audit(db, user=user.email, action=f"{provider_name.upper()}_SSO_LOGIN", object_name=f"SSO Provider: {provider_name}", result="SUCCESS")

    if invite:
        invite.is_used = True
        db.commit()

    access_token = create_access_token(subject=user.id, email=user.email)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "mfa_required": False
    }

@router.post("/invites", response_model=InviteResponse)
def create_user_invite(
    req: CreateInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate an enterprise user invite URL to invite colleagues from the same company."""
    user_domain = current_user.email.split("@")[1].strip().lower() if "@" in current_user.email else "company.com"
    org = None
    if current_user.organization_id:
        org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        org = db.query(Organization).filter(Organization.domain_primary == user_domain).first()
    if not org:
        org = db.query(Organization).first()

    allowed_domain = (org.domain_primary if org and org.domain_primary else user_domain).strip().lower()

    if req.invited_email:
        target_domain = req.invited_email.split("@")[1].strip().lower()
        if target_domain != allowed_domain and not target_domain.endswith(f".{allowed_domain}"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invited user must belong to the same company domain (@{allowed_domain}). Domain @{target_domain} is not permitted."
            )

    token = secrets.token_urlsafe(24)
    expires_at = datetime.utcnow() + timedelta(days=7)

    invite = UserInvite(
        token=token,
        organization_id=org.id if org else "",
        invited_by_email=current_user.email,
        invited_email=req.invited_email.strip().lower() if req.invited_email else None,
        allowed_domain=allowed_domain,
        role=req.role or RoleEnum.SECURITY_ANALYST.value,
        is_used=False,
        expires_at=expires_at
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    log_audit(
        db,
        user=current_user.email,
        action="USER_INVITE_CREATED",
        object_name="User Invitation",
        result=f"TOKEN_GENERATED: allowed_domain={allowed_domain}"
    )

    company_name = org.name if org else f"{allowed_domain.split('.')[0].capitalize()} Enterprise"
    return {
        "status": "success",
        "invite_token": token,
        "invite_url": f"/?invite={token}",
        "company_name": company_name,
        "allowed_domain": allowed_domain,
        "role": invite.role,
        "expires_at": expires_at.isoformat()
    }

@router.get("/invites/{token}")
def get_user_invite_details(token: str, db: Session = Depends(get_db)):
    """Fetch details of an active company invite token."""
    invite = db.query(UserInvite).filter(UserInvite.token == token.strip()).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation link not found or has been revoked.")
    if invite.is_used:
        raise HTTPException(status_code=410, detail="This invitation link has already been used.")
    if invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="This invitation link has expired. Please request a new invite from your administrator.")

    org = db.query(Organization).filter(Organization.id == invite.organization_id).first()
    company_name = org.name if org else f"{invite.allowed_domain.split('.')[0].capitalize()} Enterprise"
    return {
        "valid": True,
        "invite_token": invite.token,
        "company_name": company_name,
        "allowed_domain": invite.allowed_domain,
        "invited_email": invite.invited_email,
        "invited_by": invite.invited_by_email,
        "role": invite.role,
        "expires_at": invite.expires_at.isoformat()
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List provisioned user accounts belonging to the caller's enterprise organization (or all users for super-administrators)."""
    if current_user.role == RoleEnum.ADMINISTRATOR.value and not current_user.organization_id:
        return db.query(User).all()
    if current_user.organization_id:
        org_users = db.query(User).filter(User.organization_id == current_user.organization_id).all()
        if org_users:
            return org_users
    return db.query(User).all()

@router.post("/users", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value]))
):
    valid_roles = [r.value for r in RoleEnum]
    if user_in.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{user_in.role}'. Allowed roles: {', '.join(valid_roles)}"
        )

    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(db, user=current_user.email, action="USER_CREATE", object_name=f"User: {new_user.email}", new_value=new_user.role)
    return new_user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = []
    if user_update.role is not None:
        valid_roles = [r.value for r in RoleEnum]
        if user_update.role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role '{user_update.role}'. Allowed roles: {', '.join(valid_roles)}"
            )
        old_role = user.role
        user.role = user_update.role
        changes.append(f"Role: {old_role} -> {user.role}")

    if user_update.full_name is not None:
        user.full_name = user_update.full_name.strip()
        changes.append(f"Name: {user.full_name}")

    if user_update.is_active is not None:
        user.is_active = user_update.is_active
        changes.append(f"Active: {user.is_active}")

    db.commit()
    db.refresh(user)

    log_audit(
        db,
        user=current_user.email,
        action="USER_UPDATE",
        object_name=f"User: {user.email}",
        new_value=" | ".join(changes) if changes else "No changes"
    )
    return user

@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    req: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.hashed_password = hash_password(req.new_password)
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="USER_PASSWORD_RESET",
        object_name=f"User: {user.email}",
        result="SUCCESS"
    )
    return {"status": "Password reset successful", "email": user.email}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id or user.email == current_user.email:
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own active account")

    deleted_email = user.email
    db.delete(user)
    db.commit()

    log_audit(
        db,
        user=current_user.email,
        action="USER_DELETE",
        object_name=f"User: {deleted_email}",
        result="DELETED"
    )
    return {"status": "User deleted successfully", "email": deleted_email}

