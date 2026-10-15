"""Asset Inventory and Scoped External Asset Discovery Endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.asset import Asset, AssetRelationship
from app.models.organization import ApprovedScope, Organization
from app.models.vulnerability import Vulnerability
from app.models.credential import CredentialExposure
from app.models.identity import Identity
from app.models.user import User, RoleEnum
from app.core.dependencies import get_current_user, require_roles
from app.core.audit_logger import log_audit
from app.engine.correlation_engine import CorrelationEngine
from app.engine.risk_engine import RiskEngine
from app.engine.scope_validator import ScopeValidator
from app.providers.discovery.ct_provider import CertificateTransparencyProvider
from app.providers.discovery.dns_provider import DNSProvider

router = APIRouter(prefix="/assets", tags=["Asset Inventory & Discovery"])

class AssetCreate(BaseModel):
    name: str
    asset_type: str # Domain, Subdomain, IP Address, Host, Web Application, API Endpoint, Certificate, Network Service
    domain: Optional[str] = None
    ip: Optional[str] = None
    port: Optional[int] = None
    protocol: Optional[str] = "HTTPS"
    technology: Optional[str] = None
    discovery_source: Optional[str] = "Manual Entry"
    status: Optional[str] = "Active"
    business_criticality: Optional[str] = "High"
    owner: Optional[str] = None
    tags: Optional[List[str]] = []

class DiscoverRequest(BaseModel):
    target_scope: str # e.g. "company.com" or "*.company.com"
    provider: Optional[str] = "ct_dns"

@router.get("/")
def list_assets(
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    business_criticality: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    query = db.query(Asset)
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    if status:
        query = query.filter(Asset.status == status)
    if business_criticality:
        query = query.filter(Asset.business_criticality == business_criticality)
    if search:
        s = f"%{search.lower()}%"
        query = query.filter((Asset.name.ilike(s)) | (Asset.domain.ilike(s)) | (Asset.ip.ilike(s)) | (Asset.technology.ilike(s)))

    assets = query.order_by(Asset.risk_score.desc()).all()
    
    # Enrich with count summary
    results = []
    for a in assets:
        results.append({
            "id": a.id,
            "name": a.name,
            "asset_type": a.asset_type,
            "domain": a.domain,
            "ip": a.ip,
            "port": a.port,
            "protocol": a.protocol,
            "technology": a.technology,
            "discovery_source": a.discovery_source,
            "first_seen": a.first_seen.isoformat() if a.first_seen else None,
            "last_seen": a.last_seen.isoformat() if a.last_seen else None,
            "status": a.status,
            "business_criticality": a.business_criticality,
            "owner": a.owner,
            "tags": a.tags or [],
            "risk_score": a.risk_score,
            "risk_band": a.risk_band,
            "vulnerabilities_count": len(a.vulnerabilities),
            "credential_exposures_count": len(a.credential_exposures)
        })
    return results

@router.get("/{asset_id}")
def get_asset_detail(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Run correlation engine and risk explainability
    correlation_data = CorrelationEngine.correlate_for_asset(db, asset)
    risk_breakdown = RiskEngine.calculate_asset_risk(asset, correlation_data)

    # Correlated Vulnerabilities
    vulns = [
        {
            "id": v.id,
            "cve_id": v.cve_id,
            "title": v.title,
            "cvss_score": v.cvss_score,
            "severity": v.severity,
            "cisa_kev_status": v.cisa_kev_status,
            "affected_technology": v.affected_technology,
            "references": v.references or []
        }
        for v in asset.vulnerabilities
    ]

    # Correlated Credential Exposures (Sanitized minimized metadata)
    exposures = [
        {
            "id": e.id,
            "email": e.email,
            "domain": e.domain,
            "provider": e.provider,
            "exposure_type": e.exposure_type,
            "breach_title": e.breach_title,
            "confidence": e.confidence,
            "severity": e.severity,
            "exposed_data_classes": e.exposed_data_classes or [],
            "investigation_status": e.investigation_status
        }
        for e in asset.credential_exposures
    ]

    # Associated Identities
    identities_list = []
    all_identities = db.query(Identity).all()
    for ident in all_identities:
        if asset.id in (ident.associated_asset_ids or []) or (asset.domain and asset.domain in (ident.associated_asset_ids or [])):
            identities_list.append({
                "id": ident.id,
                "email": ident.email,
                "username": ident.username,
                "role": ident.role,
                "is_privileged": ident.is_privileged,
                "business_criticality": ident.business_criticality
            })

    # Relationship Graph Nodes and Links for Visualization
    graph_nodes = [{"id": asset.id, "label": asset.name, "type": "asset", "criticality": asset.business_criticality}]
    graph_links = []

    for v in asset.vulnerabilities:
        v_node_id = f"vuln-{v.id}"
        graph_nodes.append({"id": v_node_id, "label": v.cve_id, "type": "vulnerability", "severity": v.severity})
        graph_links.append({"source": asset.id, "target": v_node_id, "relation": "vulnerable_to"})

    for i in identities_list:
        i_node_id = f"ident-{i['id']}"
        graph_nodes.append({"id": i_node_id, "label": i["email"], "type": "identity", "privileged": i["is_privileged"]})
        graph_links.append({"source": i_node_id, "target": asset.id, "relation": "accesses"})

    for exp in asset.credential_exposures:
        exp_node_id = f"exp-{exp.id}"
        graph_nodes.append({"id": exp_node_id, "label": exp.breach_title, "type": "credential", "severity": exp.severity})
        graph_links.append({"source": exp_node_id, "target": asset.id, "relation": "exposure_correlates"})

    return {
        "id": asset.id,
        "name": asset.name,
        "asset_type": asset.asset_type,
        "domain": asset.domain,
        "ip": asset.ip,
        "port": asset.port,
        "protocol": asset.protocol,
        "technology": asset.technology,
        "discovery_source": asset.discovery_source,
        "first_seen": asset.first_seen.isoformat() if asset.first_seen else None,
        "last_seen": asset.last_seen.isoformat() if asset.last_seen else None,
        "status": asset.status,
        "business_criticality": asset.business_criticality,
        "owner": asset.owner,
        "tags": asset.tags or [],
        "risk_score": asset.risk_score,
        "risk_band": asset.risk_band,
        "metadata_info": asset.metadata_info or {},
        "vulnerabilities": vulns,
        "credential_exposures": exposures,
        "associated_identities": identities_list,
        "correlation": correlation_data,
        "risk_breakdown": risk_breakdown,
        "relationship_graph": {
            "nodes": graph_nodes,
            "links": graph_links
        }
    }

@router.post("/", status_code=201)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    # Validate against approved scope if domain provided
    approved_scopes = db.query(ApprovedScope).filter(ApprovedScope.is_active == True).all()
    if asset_in.domain and not ScopeValidator.is_target_in_scope(asset_in.domain, approved_scopes):
        raise HTTPException(
            status_code=400,
            detail=f"Domain '{asset_in.domain}' is outside approved organizational scope boundaries."
        )

    asset = Asset(
        name=asset_in.name,
        asset_type=asset_in.asset_type,
        domain=asset_in.domain,
        ip=asset_in.ip,
        port=asset_in.port,
        protocol=asset_in.protocol,
        technology=asset_in.technology,
        discovery_source=asset_in.discovery_source,
        status=asset_in.status,
        business_criticality=asset_in.business_criticality,
        owner=asset_in.owner,
        tags=asset_in.tags or [],
        risk_score=50,
        risk_band="Moderate"
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    # Calculate initial risk
    correlation_data = CorrelationEngine.correlate_for_asset(db, asset)
    risk_info = RiskEngine.calculate_asset_risk(asset, correlation_data)
    asset.risk_score = risk_info["score"]
    asset.risk_band = risk_info["band"]
    db.commit()

    log_audit(db, user=current_user.email, action="ASSET_CREATE", object_name=f"Asset: {asset.name}")
    return asset

@router.post("/discover")
async def run_scoped_discovery(
    req: DiscoverRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value, RoleEnum.SECURITY_ANALYST.value]))
):
    """Run passive discovery strictly inside approved organization scope"""
    approved_scopes = db.query(ApprovedScope).filter(ApprovedScope.is_active == True).all()
    
    # 1. Scope boundary verification
    if not ScopeValidator.is_target_in_scope(req.target_scope, approved_scopes):
        log_audit(
            db,
            user=current_user.email,
            action="DISCOVERY_BLOCKED_OUT_OF_SCOPE",
            object_name=f"Scope Target: {req.target_scope}",
            result="DENIED"
        )
        raise HTTPException(
            status_code=403,
            detail=f"Target scope '{req.target_scope}' is NOT within approved organization boundaries. Discovery blocked."
        )

    # 2. Run passive providers
    ct_provider = CertificateTransparencyProvider()
    dns_provider = DNSProvider()

    ct_assets = await ct_provider.discover(req.target_scope, approved_scopes)
    dns_assets = await dns_provider.discover(req.target_scope, approved_scopes)
    all_discovered = ct_assets + dns_assets

    added_count = 0
    for item in all_discovered:
        existing = db.query(Asset).filter(Asset.name == item["name"]).first()
        if not existing:
            new_a = Asset(
                name=item["name"],
                asset_type=item["asset_type"],
                domain=item.get("domain"),
                ip=item.get("ip"),
                port=item.get("port", 443),
                protocol=item.get("protocol", "HTTPS"),
                technology=item.get("technology"),
                discovery_source=item.get("discovery_source", "Passive CT/DNS"),
                business_criticality=item.get("business_criticality", "High"),
                status=item.get("status", "Active"),
                risk_score=55,
                risk_band="High"
            )
            db.add(new_a)
            added_count += 1

    db.commit()
    log_audit(
        db,
        user=current_user.email,
        action="DISCOVERY_COMPLETED",
        object_name=f"Scope: {req.target_scope}",
        new_value=f"Discovered {len(all_discovered)} assets ({added_count} new)"
    )

    return {
        "status": "Success",
        "target_scope": req.target_scope,
        "total_discovered": len(all_discovered),
        "new_assets_added": added_count,
        "items": all_discovered
    }

@router.delete("/{asset_id}")
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMINISTRATOR.value]))
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    name = asset.name
    db.delete(asset)
    db.commit()
    log_audit(db, user=current_user.email, action="ASSET_DELETE", object_name=f"Asset: {name}")
    return {"status": "Asset deleted"}

