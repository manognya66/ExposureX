"""Have I Been Pwned (HIBP) Credential Intelligence Adapter"""
import os
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.providers.base import CredentialIntelligenceProvider

class HIBPAdapter(CredentialIntelligenceProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("HIBP_API_KEY", "")
        self.base_url = "https://haveibeenpwned.com/api/v3"

    @property
    def name(self) -> str:
        return "Have I Been Pwned (HIBP)"

    @property
    def code(self) -> str:
        return "HIBP"

    async def health_check(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "code": self.code,
                "name": self.name,
                "status": "Not configured",
                "message": "API key missing. Enter licensed HIBP API key in Provider Settings.",
                "is_configured": False,
                "rate_limit_remaining": 0
            }
        try:
            headers = {"hibp-api-key": self.api_key, "user-agent": "ExposureX-Platform/1.0"}
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(f"{self.base_url}/subscription/status", headers=headers)
                if res.status_code == 200:
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Active",
                        "message": "Connected to commercial API subscription",
                        "is_configured": True,
                        "rate_limit_remaining": 1500
                    }
                else:
                    return {
                        "code": self.code,
                        "name": self.name,
                        "status": "Degraded",
                        "message": f"API returned status code {res.status_code}",
                        "is_configured": True
                    }
        except Exception as e:
            return {
                "code": self.code,
                "name": self.name,
                "status": "Degraded",
                "message": f"Connection error: {str(e)}",
                "is_configured": True
            }

    async def search_by_email(self, email: str) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []
        
        headers = {"hibp-api-key": self.api_key, "user-agent": "ExposureX-Platform/1.0"}
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(f"{self.base_url}/breachedaccount/{email}?truncateResponse=false", headers=headers)
            if res.status_code == 200:
                breaches = res.json()
                results = []
                for b in breaches:
                    results.append({
                        "email": email,
                        "domain": email.split("@")[-1],
                        "provider": self.code,
                        "exposure_type": "Data Breach",
                        "breach_title": b.get("Title", b.get("Name", "Breach")),
                        "breach_date": b.get("BreachDate"),
                        "confidence": "Verified",
                        "severity": "Critical" if b.get("IsSensitive") else "High",
                        "exposed_data_classes": b.get("DataClasses", ["Email"]),
                        "description": b.get("Description", "")
                    })
                return results
            return []

    async def search_by_domain(self, domain: str) -> List[Dict[str, Any]]:
        # Domain search requires enterprise HIBP subscription
        return []

    async def get_exposure_details(self, exposure_id: str) -> Optional[Dict[str, Any]]:
        return None

