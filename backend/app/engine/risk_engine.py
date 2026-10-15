"""Risk Engine & Explainability: Computes explainable, configurable risk scores and transparent factor breakdowns"""
from typing import Dict, Any, List
from app.models.asset import Asset

class RiskEngine:
    # Standard proposed ExposureX weights
    WEIGHT_EXPOSURE = 0.30
    WEIGHT_VULNERABILITY = 0.25
    WEIGHT_CREDENTIAL = 0.25
    WEIGHT_BUSINESS_IMPACT = 0.20

    @classmethod
    def calculate_band(cls, score: int) -> str:
        if score >= 75:
            return "Critical"
        elif score >= 50:
            return "High"
        elif score >= 25:
            return "Moderate"
        else:
            return "Low"

    @classmethod
    def calculate_asset_risk(cls, asset: Asset, correlation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates an explainable risk score for an asset based on the 4 pillars:
        - Exposure (0-100)
        - Vulnerability (0-100)
        - Credential Exposure (0-100)
        - Business Impact (0-100)
        """
        # 1. Exposure Score (Internet-facing, port accessibility, public status)
        if asset.status == "Active":
            if asset.port in (443, 80, 8443) or "http" in (asset.protocol or "").lower() or asset.asset_type in ("Domain", "Web Application"):
                exposure_score = 80.0
            else:
                exposure_score = 60.0
        else:
            exposure_score = 20.0

        # 2. Vulnerability Score
        max_cvss = correlation_data.get("max_cvss", 0.0)
        has_cisa_kev = correlation_data.get("has_cisa_kev", False)
        if has_cisa_kev:
            vulnerability_score = 95.0
        elif max_cvss >= 9.0:
            vulnerability_score = 90.0
        elif max_cvss >= 7.0:
            vulnerability_score = 75.0
        elif max_cvss >= 4.0:
            vulnerability_score = 45.0
        elif correlation_data.get("vulnerabilities_count", 0) > 0:
            vulnerability_score = 30.0
        else:
            vulnerability_score = 10.0

        # 3. Credential Exposure Score
        exposures_count = correlation_data.get("exposures_count", 0)
        has_privileged = correlation_data.get("has_privileged_identity", False)
        if exposures_count > 0 and has_privileged:
            credential_score = 85.0
        elif exposures_count > 0:
            credential_score = 65.0
        else:
            credential_score = 15.0

        # 4. Business Impact Score
        crit_map = {
            "Critical": 90.0,
            "High": 75.0,
            "Medium": 50.0,
            "Low": 25.0
        }
        business_impact_score = crit_map.get(asset.business_criticality, 50.0)

        # Composite Calculation
        raw_score = (
            (exposure_score * cls.WEIGHT_EXPOSURE) +
            (vulnerability_score * cls.WEIGHT_VULNERABILITY) +
            (credential_score * cls.WEIGHT_CREDENTIAL) +
            (business_impact_score * cls.WEIGHT_BUSINESS_IMPACT)
        )
        final_score = int(round(raw_score))
        final_score = max(0, min(100, final_score))
        band = cls.calculate_band(final_score)

        # Contributing factors list
        contributing_factors = []
        if exposure_score >= 70:
            contributing_factors.append(f"Direct Internet Exposure ({int(exposure_score)}/100) — Accessible from public network")
        if vulnerability_score >= 80:
            contributing_factors.append(f"Severe Vulnerability Posture ({int(vulnerability_score)}/100) — Exploitable CVE or CISA KEV detected")
        elif vulnerability_score >= 50:
            contributing_factors.append(f"Moderate Vulnerabilities Present ({int(vulnerability_score)}/100)")
        if credential_score >= 80:
            contributing_factors.append(f"Privileged Credential Exposure ({int(credential_score)}/100) — Account leak correlates with access perimeter")
        elif credential_score >= 50:
            contributing_factors.append(f"Associated Credential Exposure ({int(credential_score)}/100)")
        if business_impact_score >= 70:
            contributing_factors.append(f"Critical Business Context ({int(business_impact_score)}/100) — Asset marked as {asset.business_criticality}")

        # Recommended Action
        if final_score >= 75:
            recommended_action = (
                "1. Immediately restrict or apply WAF/firewall protection to the affected endpoint.\n"
                "2. Expedite patching for identified CISA KEV / Critical CVEs.\n"
                "3. Enforce MFA validation and credential rotation on correlated exposed identity accounts.\n"
                "4. Open an immediate Security Case (Incident response) and notify duty analysts."
            )
        elif final_score >= 50:
            recommended_action = (
                "1. Schedule patch deployment within 7 days for affected service.\n"
                "2. Audit access logs for unauthorized access attempts.\n"
                "3. Monitor correlated credentials for new breach appearances."
            )
        else:
            recommended_action = "Maintain continuous monitoring and routine quarterly patch cycles."

        return {
            "score": final_score,
            "band": band,
            "pillars": {
                "exposure": round(exposure_score, 1),
                "vulnerability": round(vulnerability_score, 1),
                "credential_exposure": round(credential_score, 1),
                "business_impact": round(business_impact_score, 1)
            },
            "weights": {
                "exposure": cls.WEIGHT_EXPOSURE,
                "vulnerability": cls.WEIGHT_VULNERABILITY,
                "credential_exposure": cls.WEIGHT_CREDENTIAL,
                "business_impact": cls.WEIGHT_BUSINESS_IMPACT
            },
            "formula": f"Risk ({final_score}) = ({exposure_score:.0f} × 30%) + ({vulnerability_score:.0f} × 25%) + ({credential_score:.0f} × 25%) + ({business_impact_score:.0f} × 20%)",
            "contributing_factors": contributing_factors,
            "correlation_flags": correlation_data.get("correlation_flags", []),
            "recommended_action": recommended_action
        }

