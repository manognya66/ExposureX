"""ProviderManager: Central registry and dispatcher for all intelligence adapters"""
from typing import Dict, List, Any
from app.providers.discovery.ct_provider import CertificateTransparencyProvider
from app.providers.discovery.dns_provider import DNSProvider
from app.providers.credential.enterprise_adapters import XposedOrNotAdapter, LeakCheckAdapter, HudsonRockAdapter
from app.providers.vulnerability.cisa_nvd_provider import CisaKevProvider, NvdProvider

class ProviderManager:
    def __init__(self):
        # Discovery providers
        self.discovery_providers = {
            "crtsh": CertificateTransparencyProvider(),
            "dns": DNSProvider(),
        }

        # Free Credential & Infostealer intelligence adapters (Zero-cost, keyless active)
        self.credential_providers = {
            "XposedOrNot": XposedOrNotAdapter(),
            "LeakCheck": LeakCheckAdapter(),
            "HudsonRock": HudsonRockAdapter(),
        }

        # Vulnerability intelligence adapters
        self.vulnerability_providers = {
            "nvd": NvdProvider(),
            "cisa_kev": CisaKevProvider(),
        }

    async def get_all_provider_statuses(self) -> List[Dict[str, Any]]:
        """Return real health check and configuration status for all providers"""
        statuses = []

        # Discovery
        for key, p in self.discovery_providers.items():
            health = await p.health_check()
            statuses.append({
                "id": key,
                "name": p.name,
                "category": "External Asset Discovery",
                "status": health.get("status", "Healthy"),
                "is_configured": True,
                "details": health
            })

        # Credential
        for key, p in self.credential_providers.items():
            health = await p.health_check()
            statuses.append({
                "id": key,
                "name": p.name,
                "category": "Credential Intelligence",
                "status": health.get("status", "Not configured"),
                "is_configured": health.get("is_configured", False),
                "details": health
            })

        # Vulnerability
        for key, p in self.vulnerability_providers.items():
            health = await p.health_check()
            statuses.append({
                "id": key,
                "name": p.name,
                "category": "Vulnerability Intelligence",
                "status": health.get("status", "Healthy"),
                "is_configured": True,
                "details": health
            })

        return statuses

provider_manager = ProviderManager()

