"""Deep Web Intelligence Provider
Integrates:
1. URLScan.io Deep Inspection API (DOM hashes, ASN, TLS certificates, IP relations, tech stack)
2. AlienVault Open Threat Exchange (OTX) (Crowd-sourced threat pulses, adversary malware campaigns)
Zero-cost, keyless open-source cyber threat intelligence.
"""
import time
import httpx
from typing import Dict, Any, List, Optional

URLSCAN_SEARCH_URL = "https://urlscan.io/api/v1/search/"
ALIENVAULT_OTX_URL = "https://otx.alienvault.com/api/v1/indicators/domain"

class DeepWebProvider:
    @property
    def name(self) -> str:
        return "Deep Web & Threat Pulse Intelligence"

    @property
    def id(self) -> str:
        return "deepweb_urlscan_otx"

    async def health_check(self) -> Dict[str, Any]:
        """Check live connectivity to URLScan.io and AlienVault OTX endpoints"""
        start = time.time()
        urlscan_ok = False
        otx_ok = False
        details = []

        try:
            async with httpx.AsyncClient(timeout=7.0) as client:
                res = await client.get(f"{URLSCAN_SEARCH_URL}?q=page.domain:example.com&size=1")
                if res.status_code == 200:
                    urlscan_ok = True
                    details.append("URLScan.io API: Connected & responsive")
        except Exception as e:
            details.append(f"URLScan.io error: {str(e)}")

        try:
            async with httpx.AsyncClient(timeout=7.0) as client:
                res = await client.get(f"{ALIENVAULT_OTX_URL}/example.com/general")
                if res.status_code == 200:
                    otx_ok = True
                    details.append("AlienVault OTX: Threat indicator pulses active")
        except Exception as e:
            details.append(f"AlienVault OTX error: {str(e)}")

        latency = int((time.time() - start) * 1000)
        is_healthy = urlscan_ok or otx_ok

        return {
            "id": self.id,
            "name": self.name,
            "category": "Deep Web Intelligence",
            "status": "Healthy" if is_healthy else "Degraded",
            "latency_ms": latency,
            "message": " • ".join(details) if details else "Operational",
            "rate_limit_policy": "Zero-Cost Public API (Keyless)",
            "sources": ["URLScan.io DOM Crawler", "AlienVault Open Threat Exchange (OTX)"]
        }

    async def scan_company(self, domain: str, company_name: Optional[str] = None) -> Dict[str, Any]:
        """Deep scan web applications, DOM structures, ASN, and AlienVault OTX threat pulses"""
        clean_domain = domain.lower().strip()
        if "://" in clean_domain:
            clean_domain = clean_domain.split("://")[1]
        clean_domain = clean_domain.split("/")[0]

        crawls: List[Dict[str, Any]] = []
        asn_list = set()
        ip_list = set()
        server_technologies = set()

        # 1. URLScan.io Deep Inspection
        try:
            async with httpx.AsyncClient(timeout=9.0) as client:
                resp = await client.get(
                    f"{URLSCAN_SEARCH_URL}?q=page.domain:{clean_domain}&size=8",
                    headers={"User-Agent": "ExposureX-DeepScanner/2.0"}
                )
                if resp.status_code == 200:
                    results = resp.json().get("results", [])
                    for r in results:
                        page = r.get("page", {})
                        stats = r.get("stats", {})
                        task = r.get("task", {})

                        asn = page.get("asnname") or page.get("asn")
                        if asn:
                            asn_list.add(str(asn))
                        ip = page.get("ip")
                        if ip:
                            ip_list.add(str(ip))
                        server = page.get("server")
                        if server:
                            server_technologies.add(str(server))

                        crawls.append({
                            "url": page.get("url"),
                            "status": page.get("status"),
                            "ip": page.get("ip"),
                            "country": page.get("country"),
                            "server": page.get("server", "N/A"),
                            "asn": page.get("asnname", "N/A"),
                            "tls_issuer": page.get("tlsIssuer", "N/A"),
                            "scan_date": task.get("time"),
                            "screenshot": task.get("screenshotURL"),
                            "verdict_score": r.get("verdicts", {}).get("overall", {}).get("score", 0),
                            "malicious": r.get("verdicts", {}).get("overall", {}).get("malicious", False)
                        })
        except Exception:
            pass

        # 2. AlienVault OTX Threat Pulses
        pulse_info: Dict[str, Any] = {
            "pulse_count": 0,
            "pulses": [],
            "adversary_tags": [],
            "malware_families": [],
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{ALIENVAULT_OTX_URL}/{clean_domain}/general")
                if resp.status_code == 200:
                    data = resp.json()
                    pulse_info_data = data.get("pulse_info", {})
                    pulse_count = pulse_info_data.get("count", 0)
                    pulses_raw = pulse_info_data.get("pulses", [])

                    tags = set()
                    malware = set()
                    parsed_pulses = []

                    for p in pulses_raw[:6]:
                        p_name = p.get("name")
                        p_tags = p.get("tags", [])
                        for t in p_tags:
                            tags.add(t)
                        adversary = p.get("adversary")
                        if adversary:
                            tags.add(adversary)

                        parsed_pulses.append({
                            "id": p.get("id"),
                            "name": p_name,
                            "created": p.get("created"),
                            "author": p.get("author_name"),
                            "tags": p_tags[:4]
                        })

                    pulse_info = {
                        "pulse_count": pulse_count,
                        "pulses": parsed_pulses,
                        "adversary_tags": list(tags)[:8],
                        "malware_families": list(malware),
                    }
        except Exception:
            pass

        # Determine risk rating
        total_pulses = pulse_info.get("pulse_count", 0)
        malicious_scans = sum(1 for c in crawls if c.get("malicious"))

        if malicious_scans > 0 or total_pulses >= 5:
            risk_level = "CRITICAL"
        elif total_pulses > 0 or len(crawls) > 5:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return {
            "layer": "Deep Web",
            "domain": clean_domain,
            "risk_level": risk_level,
            "deep_web_crawls_count": len(crawls),
            "crawls": crawls[:6],
            "asn_footprint": list(asn_list)[:5],
            "discovered_ip_pool": list(ip_list)[:8],
            "server_technologies": list(server_technologies)[:6],
            "alienvault_otx": pulse_info,
            "total_indicators": len(crawls) + total_pulses,
            "summary": (
                f"Discovered {len(crawls)} deep web crawled application endpoint(s) across {len(asn_list)} ASN networks, correlating {total_pulses} AlienVault OTX community threat pulse(s)."
                if (crawls or total_pulses > 0)
                else "No suspicious deep web applications or active AlienVault OTX threat pulses identified for domain."
            )
        }

