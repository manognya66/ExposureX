"""Free Community and OSINT Credential Intelligence Adapters
Integrates real, working, zero-cost credential intelligence APIs:
1. XposedOrNot (Free open-source community breach intelligence)
2. LeakCheck (Free public breach intelligence)
3. Hudson Rock Cavalier (Free cybercrime & infostealer malware intelligence)
All adapters operate keyless out-of-the-box and support optional API keys from .env.
"""
import os
import time
import httpx
from typing import List, Dict, Any, Optional
from app.providers.base import CredentialIntelligenceProvider


class XposedOrNotAdapter(CredentialIntelligenceProvider):
    """
    XposedOrNot: Free open-source breach search engine & community database.
    Keyless community tier by default; optional API key from XPOSEDORNOT_API_KEY.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("XPOSEDORNOT_API_KEY", "").strip()
        self.base_url = "https://api.xposedornot.com/v1"

    @property
    def name(self) -> str:
        return "XposedOrNot Community"

    @property
    def code(self) -> str:
        return "XposedOrNot"

    async def health_check(self) -> Dict[str, Any]:
        start = time.time()
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/breaches", headers=headers)
                latency = int((time.time() - start) * 1000)
                if res.status_code in (200, 304):
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Healthy",
                        "message": "Connected to XposedOrNot community breach registry",
                        "is_configured": True,
                        "has_api_key": bool(self.api_key),
                        "latency_ms": latency,
                        "rate_limit_policy": "Verified API Key (High Throughput)" if self.api_key else "Community Keyless Tier (2 req/s, 100/day)"
                    }
                else:
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Degraded",
                        "message": f"HTTP {res.status_code} response from XposedOrNot",
                        "is_configured": True,
                        "has_api_key": bool(self.api_key),
                        "latency_ms": latency
                    }
        except Exception as e:
            return {
                "code": self.code,
                "name": self.name,
                "status": "Offline",
                "message": f"Connection check failed: {str(e)}",
                "is_configured": True,
                "has_api_key": bool(self.api_key),
                "latency_ms": int((time.time() - start) * 1000)
            }

    async def search_by_email(self, email: str) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["x-api-key"] = self.api_key

        email_clean = email.strip().lower()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/check-email/{email_clean}", headers=headers)
                if res.status_code == 404:
                    return [] # No breach found
                if res.status_code != 200:
                    return []
                
                data = res.json()
                breaches_raw = data.get("breaches", [])
                # XposedOrNot returns [["Breach1", "Breach2", ...]] or ["Breach1", ...]
                breach_names = []
                for item in breaches_raw:
                    if isinstance(item, list):
                        breach_names.extend(item)
                    elif isinstance(item, str):
                        breach_names.append(item)

                results = []
                for name in breach_names:
                    results.append({
                        "email": email_clean,
                        "domain": email_clean.split("@")[-1],
                        "provider": self.name,
                        "breach_title": name,
                        "confidence": "Verified",
                        "severity": "High",
                        "source_category": "Community Breach Registry",
                        "exposed_data_classes": ["Email", "Authentication Credential"],
                        "description": f"Identity observed in {name} leak indexed by XposedOrNot community registry."
                    })
                return results
        except Exception:
            return []

    async def search_by_domain(self, domain: str) -> List[Dict[str, Any]]:
        return []

    async def get_exposure_details(self, exposure_id: str) -> Optional[Dict[str, Any]]:
        return None


class LeakCheckAdapter(CredentialIntelligenceProvider):
    """
    LeakCheck: Free Public Breach Intelligence API.
    Keyless public tier by default; optional developer key from LEAKCHECK_API_KEY.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("LEAKCHECK_API_KEY", "").strip()
        self.base_url = "https://leakcheck.io/api"

    @property
    def name(self) -> str:
        return "LeakCheck Public API"

    @property
    def code(self) -> str:
        return "LeakCheck"

    async def health_check(self) -> Dict[str, Any]:
        start = time.time()
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/public?check=test@example.com", headers=headers)
                latency = int((time.time() - start) * 1000)
                if res.status_code == 200:
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Healthy",
                        "message": "Connected to LeakCheck public breach intelligence",
                        "is_configured": True,
                        "has_api_key": bool(self.api_key),
                        "latency_ms": latency,
                        "rate_limit_policy": "Developer Pro Tier" if self.api_key else "Free Public Tier (1 req/s, attribution required)"
                    }
                else:
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Degraded",
                        "message": f"HTTP {res.status_code} response from LeakCheck",
                        "is_configured": True,
                        "has_api_key": bool(self.api_key),
                        "latency_ms": latency
                    }
        except Exception as e:
            return {
                "code": self.code,
                "name": self.name,
                "status": "Offline",
                "message": f"Connection check failed: {str(e)}",
                "is_configured": True,
                "has_api_key": bool(self.api_key),
                "latency_ms": int((time.time() - start) * 1000)
            }

    async def search_by_email(self, email: str) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key

        email_clean = email.strip().lower()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/public?check={email_clean}", headers=headers)
                if res.status_code != 200:
                    return []
                
                data = res.json()
                if not data.get("success"):
                    return []
                
                fields = data.get("fields", ["Email", "Password"])
                sources = data.get("sources", [])
                results = []
                for s in sources:
                    s_name = s.get("name", "Unknown Leak")
                    s_date = s.get("date", "")
                    results.append({
                        "email": email_clean,
                        "domain": email_clean.split("@")[-1],
                        "provider": self.name,
                        "breach_title": s_name,
                        "breach_date": s_date,
                        "confidence": "High",
                        "severity": "Critical" if "password" in [f.lower() for f in fields] else "High",
                        "source_category": "Breach Dump Analysis",
                        "exposed_data_classes": [f.title() for f in fields[:6]],
                        "description": f"Exposed in {s_name} ({s_date or 'Historical'}). Exposed attributes: {', '.join(fields[:5])}."
                    })
                return results
        except Exception:
            return []

    async def search_by_domain(self, domain: str) -> List[Dict[str, Any]]:
        return []

    async def get_exposure_details(self, exposure_id: str) -> Optional[Dict[str, Any]]:
        return None


class HudsonRockAdapter(CredentialIntelligenceProvider):
    """
    Hudson Rock Cavalier: Cybercrime Intelligence tracking infostealer infections
    (RedLine, Vidar, Raccoon, Lumma, etc.).
    Free OSINT tools API by default; optional developer key from HUDSON_ROCK_API_KEY.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("HUDSON_ROCK_API_KEY", "").strip()
        self.base_url = "https://cavalier.hudsonrock.com/api/json/v2/osint-tools"

    @property
    def name(self) -> str:
        return "Hudson Rock Cavalier"

    @property
    def code(self) -> str:
        return "HudsonRock"

    async def health_check(self) -> Dict[str, Any]:
        start = time.time()
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/search-by-email?email=healthcheck-probe@domain.com", headers=headers)
                latency = int((time.time() - start) * 1000)
                if res.status_code in (200, 404):
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Healthy",
                        "message": "Connected to Hudson Rock cybercrime & infostealer registry",
                        "is_configured": True,
                        "has_api_key": bool(self.api_key),
                        "latency_ms": latency,
                        "rate_limit_policy": "Developer API Key Tier" if self.api_key else "Free OSINT Tier (Keyless)"
                    }
                else:
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Degraded",
                        "message": f"HTTP {res.status_code} response from Hudson Rock",
                        "is_configured": True,
                        "has_api_key": bool(self.api_key),
                        "latency_ms": latency
                    }
        except Exception as e:
            return {
                "code": self.code,
                "name": self.name,
                "status": "Offline",
                "message": f"Connection check failed: {str(e)}",
                "is_configured": True,
                "has_api_key": bool(self.api_key),
                "latency_ms": int((time.time() - start) * 1000)
            }

    async def search_by_email(self, email: str) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        email_clean = email.strip().lower()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/search-by-email?email={email_clean}", headers=headers)
                if res.status_code != 200:
                    return []
                
                data = res.json()
                # If infected, returns message or stealer details
                msg = data.get("message", "")
                stealers = data.get("stealers", [])
                
                results = []
                if "infected" in msg.lower() or stealers:
                    results.append({
                        "email": email_clean,
                        "domain": email_clean.split("@")[-1],
                        "provider": self.name,
                        "breach_title": "Infostealer Malware Infection Compromise",
                        "confidence": "High",
                        "severity": "Critical",
                        "source_category": "Infostealer Cybercrime Telemetry",
                        "exposed_data_classes": ["Session Cookies", "Browser Passwords", "System Telemetry"],
                        "description": msg or "Device associated with identity infected by infostealer malware (RedLine / Vidar / Lumma). Active credential exfiltration detected."
                    })
                return results
        except Exception:
            return []

    async def search_by_domain(self, domain: str) -> List[Dict[str, Any]]:
        headers = {"User-Agent": "ExposureX-CTEM/2.0"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        domain_clean = domain.strip().lower()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(f"{self.base_url}/search-by-domain?domain={domain_clean}", headers=headers)
                if res.status_code != 200:
                    return []
                data = res.json()
                total_stealers = data.get("total_stealers", 0)
                if total_stealers > 0:
                    return [{
                        "domain": domain_clean,
                        "provider": self.name,
                        "breach_title": f"Domain Stealer Telemetry: {total_stealers} Infostealer Infections",
                        "confidence": "High",
                        "severity": "Critical" if total_stealers > 5 else "High",
                        "source_category": "Infostealer Cybercrime Telemetry",
                        "exposed_data_classes": ["Corporate Credentials", "Session Tokens"],
                        "description": f"Hudson Rock indexed {total_stealers} infected employee devices for domain {domain_clean}."
                    }]
                return []
        except Exception:
            return []

    async def get_exposure_details(self, exposure_id: str) -> Optional[Dict[str, Any]]:
        return None


# Backward-compatibility aliases if any legacy code imports them
SpyCloudAdapter = XposedOrNotAdapter
ConstellaAdapter = LeakCheckAdapter
IntelXAdapter = HudsonRockAdapter
