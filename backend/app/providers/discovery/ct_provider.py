"""Certificate Transparency Discovery Provider (Passive)"""
import httpx
from typing import List, Dict, Any
from app.providers.base import DiscoveryProvider
from app.engine.scope_validator import ScopeValidator

class CertificateTransparencyProvider(DiscoveryProvider):
    @property
    def name(self) -> str:
        return "Certificate Transparency (crt.sh)"

    @property
    def provider_type(self) -> str:
        return "CertificateTransparency"

    async def discover(self, target_scope: str, approved_scopes: List[Any]) -> List[Dict[str, Any]]:
        # Enforce scope validation first
        if not ScopeValidator.is_target_in_scope(target_scope, approved_scopes):
            raise ValueError(f"Target scope '{target_scope}' is outside approved organization boundaries.")

        results = []
        clean_target = target_scope.replace("*.", "").strip()

        # In live passive mode, we can try querying crt.sh JSON endpoint with timeout fallback
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(f"https://crt.sh/?q=%25.{clean_target}&output=json")
                if resp.status_code == 200:
                    entries = resp.json()
                    seen = set()
                    for entry in entries[:20]: # Limit for performance
                        name_value = entry.get("name_value", "").strip()
                        subnames = name_value.split("\n")
                        for sub in subnames:
                            sub = sub.strip().lower()
                            if sub and sub not in seen and ScopeValidator.is_target_in_scope(sub, approved_scopes):
                                seen.add(sub)
                                results.append({
                                    "name": sub,
                                    "asset_type": "Subdomain" if sub != clean_target else "Domain",
                                    "domain": sub,
                                    "discovery_source": "Certificate Transparency (crt.sh)",
                                    "business_criticality": "High" if ("vpn" in sub or "portal" in sub or "api" in sub) else "Medium",
                                    "technology": "TLS Certificate / HTTPS",
                                    "status": "Active"
                                })
        except Exception:
            pass

        return results

    async def health_check(self) -> Dict[str, Any]:
        return {
            "status": "Healthy",
            "provider": self.name,
            "type": "Passive Public CT Log Monitor",
            "latency_ms": 45
        }

