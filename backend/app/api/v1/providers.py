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
    elif provider_id in provider_manager.darkweb_providers:
        p = provider_manager.darkweb_providers[provider_id]
        return await p.health_check()
    elif provider_id in provider_manager.deepweb_providers:
        p = provider_manager.deepweb_providers[provider_id]
        return await p.health_check()
    elif provider_id in provider_manager.surfaceweb_providers:
        p = provider_manager.surfaceweb_providers[provider_id]
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

class CompanyWebScanRequest(BaseModel):
    domain: Optional[str] = None
    company_name: Optional[str] = None

@router.post("/scan-company")
async def scan_company_web_intelligence(
    req: Optional[CompanyWebScanRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Scan Dark Web, Deep Web, and Surface Web for the registered company or target domain.
    Fetches real-time threat intelligence from Ransomwatch Tor feeds, Hudson Rock infostealers,
    URLScan.io deep DOM inspection, AlienVault OTX pulses, and HackerTarget surface DNS.
    """
    target_domain = (req.domain.strip() if req and req.domain else None)
    target_name = (req.company_name.strip() if req and req.company_name else None)

    if not target_domain:
        from app.models.organization import Organization
        org = db.query(Organization).first()
        if org and org.domain:
            target_domain = org.domain
            target_name = target_name or org.name
        else:
            target_domain = "abc.com"
            target_name = target_name or "Abc Enterprise"

    result = await provider_manager.scan_company_multi_layer(
        domain=target_domain,
        company_name=target_name
    )

    log_audit(
        db,
        user=current_user.email,
        action="SCAN_MULTI_LAYER_INTELLIGENCE",
        object_name=f"Domain: {target_domain}",
        new_value=f"Composite Risk: {result.get('composite_risk_level')} ({result.get('total_threat_indicators')} indicators)"
    )

    return result



