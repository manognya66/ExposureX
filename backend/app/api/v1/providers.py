"""Provider Management & Status Endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.providers.manager import provider_manager
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit

router = APIRouter(prefix="/providers", tags=["Intelligence Providers"])

class ProviderConfigUpdate(BaseModel):
    provider_id: str
    api_key: Optional[str] = None
    rate_limit: Optional[int] = 1000

@router.get("/")
async def list_providers(
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get live status and configuration health of all intelligence adapters"""
    statuses = await provider_manager.get_all_provider_statuses()
    return statuses

@router.post("/{provider_id}/health-check")
async def check_provider_health(
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Run health check against specific provider adapter"""
    if provider_id in provider_manager.discovery_providers:
        p = provider_manager.discovery_providers[provider_id]
        return await p.health_check()
    elif provider_id in provider_manager.credential_providers:
        p = provider_manager.credential_providers[provider_id]
        return await p.health_check()
    elif provider_id in provider_manager.vulnerability_providers:
        p = provider_manager.vulnerability_providers[provider_id]
        return await p.health_check()
    else:
        raise HTTPException(status_code=404, detail="Provider not found")

class NvdKeyUpdate(BaseModel):
    api_key: str

@router.post("/nvd-key")
async def update_nvd_api_key(
    req: NvdKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or update NVD API Key in runtime configuration and test provider status"""
    from app.config import settings
    settings.NVD_API_KEY = req.api_key.strip()
    log_audit(
        db,
        user=current_user.email,
        action="UPDATE_PROVIDER_CONFIG",
        object_name="NVD Provider API Key",
        new_value=f"Key configured (length: {len(settings.NVD_API_KEY)})"
    )
    health = await provider_manager.vulnerability_providers["nvd"].health_check()
    return {
        "status": "success",
        "message": "NVD API Key configured and verified successfully.",
        "health": health
    }


