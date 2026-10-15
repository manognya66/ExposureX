"""Correlation Engine: Connects Identities, Credential Exposures, Assets, Vulnerabilities, and Business Criticality"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.asset import Asset
from app.models.identity import Identity
from app.models.credential import CredentialExposure
from app.models.vulnerability import Vulnerability
from app.models.finding import Finding

class CorrelationEngine:
    @staticmethod
    def correlate_for_asset(db: Session, asset: Asset) -> Dict[str, Any]:
        """
        Calculates correlation context for a given asset:
        1. Identifies vulnerabilities affecting this asset (e.g. CISA KEV or high CVSS)
        2. Identifies identities associated with this asset domain or role
        3. Identifies credential exposures linked to those identities or this asset
        4. Evaluates business criticality amplification
        """
        # Fetch vulnerabilities
        vulns = db.query(Vulnerability).filter(Vulnerability.associated_asset_id == asset.id).all()
        has_cisa_kev = any(v.cisa_kev_status for v in vulns)
        max_cvss = max([v.cvss_score for v in vulns], default=0.0)

        # Fetch associated identities
        identities = db.query(Identity).all()
        matched_identities = []
        matched_exposures = []

        asset_name_lower = asset.name.lower()
        asset_domain_lower = (asset.domain or "").lower()

        for ident in identities:
            is_matched = False
            # Check explicit associated_asset_ids
            if asset.id in (ident.associated_asset_ids or []) or asset_domain_lower in (ident.associated_asset_ids or []):
                is_matched = True
            elif "vpn" in asset_name_lower and ident.is_privileged:
                # Privileged identities correlate strongly with perimeter VPN assets
                is_matched = True
            elif asset_domain_lower and ident.email.endswith(asset_domain_lower.split(".")[-2] + "." + asset_domain_lower.split(".")[-1]):
                if ident.is_privileged:
                    is_matched = True

            if is_matched:
                matched_identities.append(ident)
                exposures = db.query(CredentialExposure).filter(CredentialExposure.identity_id == ident.id).all()
                matched_exposures.extend(exposures)

        # Direct exposures
        direct_exposures = db.query(CredentialExposure).filter(CredentialExposure.related_asset_id == asset.id).all()
        all_exposures = list({e.id: e for e in (matched_exposures + direct_exposures)}.values())

        # Correlation rules evaluation
        has_credential_exposure = len(all_exposures) > 0
        has_privileged_identity = any(i.is_privileged for i in matched_identities)
        is_critical_business_asset = asset.business_criticality in ("Critical", "High")
        is_internet_exposed = asset.status == "Active" and (asset.port in (443, 80, 8443) or "http" in (asset.protocol or "").lower() or asset.asset_type in ("Domain", "Subdomain", "Web Application"))

        correlation_flags = []
        if is_internet_exposed:
            correlation_flags.append("Internet-facing perimeter asset")
        if has_cisa_kev:
            correlation_flags.append("Actively exploited vulnerability in CISA KEV catalog")
        elif max_cvss >= 9.0:
            correlation_flags.append(f"Critical severity vulnerability (CVSS {max_cvss})")
        if has_credential_exposure:
            correlation_flags.append(f"Correlated credential exposure ({len(all_exposures)} events)")
        if has_privileged_identity and has_credential_exposure:
            correlation_flags.append("🚨 HIGH IMPACT: Privileged account credentials exposed for access point")
        if is_critical_business_asset:
            correlation_flags.append(f"High business criticality asset ({asset.business_criticality})")

        return {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "vulnerabilities_count": len(vulns),
            "max_cvss": max_cvss,
            "has_cisa_kev": has_cisa_kev,
            "identities_count": len(matched_identities),
            "has_privileged_identity": has_privileged_identity,
            "exposures_count": len(all_exposures),
            "correlation_flags": correlation_flags,
            "matched_identities": [i.email for i in matched_identities],
            "matched_vulnerabilities": [v.cve_id for v in vulns],
            "matched_exposure_titles": [e.breach_title for e in all_exposures]
        }

