"""Abstract Base Classes for Discovery, Credential Intelligence, and Vulnerability Providers"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class DiscoveryProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def provider_type(self) -> str:
        pass

    @abstractmethod
    async def discover(self, target_scope: str, approved_scopes: List[Any]) -> List[Dict[str, Any]]:
        """Run passive discovery within approved scope boundaries"""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check provider connectivity, API limits, or status"""
        pass


class CredentialIntelligenceProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def code(self) -> str:
        pass

    @abstractmethod
    async def search_by_email(self, email: str) -> List[Dict[str, Any]]:
        """
        Search exposure metadata by email.
        NOTE: Must return metadata only; never plaintext credentials or session cookies.
        """
        pass

    @abstractmethod
    async def search_by_domain(self, domain: str) -> List[Dict[str, Any]]:
        """Search exposure metadata count/events for an organization domain"""
        pass

    @abstractmethod
    async def get_exposure_details(self, exposure_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve sanitized exposure details by breach reference"""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Verify API key, license validity, and rate limits"""
        pass


class VulnerabilityIntelligenceProvider(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def lookup_cve(self, cve_id: str) -> Optional[Dict[str, Any]]:
        """Lookup CVE details, CVSS scores, and EPSS/KEV metadata"""
        pass

    @abstractmethod
    async def sync_known_exploited(self) -> List[Dict[str, Any]]:
        """Fetch latest CISA KEV or high-risk active exploits"""
        pass

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check provider connectivity"""
        pass

