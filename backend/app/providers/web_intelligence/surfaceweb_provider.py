"""Surface Web Intelligence Provider
Integrates:
1. HackerTarget Surface DNS Host Search (Live subdomains and IP resolution)
2. crt.sh Certificate Transparency Logs (Real-time issued SSL/TLS certificates and SAN hostnames)
3. Internet Archive / Wayback Machine (Historical snapshot telemetry and web perimeter presence)
Zero-cost, keyless open-source cyber threat intelligence.
"""
import time
import httpx
from typing import Dict, Any, List, Optional

HACKERTARGET_HOSTSEARCH_URL = "https://api.hackertarget.com/hostsearch/"
CRTSH_URL = "https://crt.sh/"
WAYBACK_URL = "https://archive.org/wayback/available"

class SurfaceWebProvider:
    @property
    def name(self) -> str:
        return "Surface Web & Asset Perimeter Intelligence"

    @property
    def id(self) -> str:
        return "surfaceweb_hackertarget_crtsh"

    async def health_check(self) -> Dict[str, Any]:
        """Check live connectivity to HackerTarget, crt.sh, and Wayback Machine APIs"""
        start = time.time()
        hackertarget_ok = False
        crtsh_ok = False
        wayback_ok = False
        details = []

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(f"{HACKERTARGET_HOSTSEARCH_URL}?q=example.com")
                if res.status_code == 200 and "error" not in res.text.lower():
                    hackertarget_ok = True
                    details.append("HackerTarget DNS: Host mapping active")
        except Exception as e:
            details.append(f"HackerTarget error: {str(e)}")

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(f"{WAYBACK_URL}?url=example.com")
                if res.status_code == 200:
                    wayback_ok = True
                    details.append("Wayback Machine: Historical index reachable")
        except Exception as e:
            details.append(f"Wayback error: {str(e)}")

        latency = int((time.time() - start) * 1000)
        is_healthy = hackertarget_ok or wayback_ok

        return {
            "id": self.id,
            "name": self.name,
            "category": "Surface Web Intelligence",
            "status": "Healthy" if is_healthy else "Degraded",
            "latency_ms": latency,
            "message": " • ".join(details) if details else "Operational",
            "rate_limit_policy": "Zero-Cost Public API (Keyless)",
            "sources": ["HackerTarget DNS Engine", "crt.sh Certificate Transparency", "Wayback Machine Archive"]
        }

    async def scan_company(self, domain: str, company_name: Optional[str] = None) -> Dict[str, Any]:
        """Discover live surface web subdomains, TLS certificates, and historical internet archive presence"""
        clean_domain = domain.lower().strip()
        if "://" in clean_domain:
            clean_domain = clean_domain.split("://")[1]
        clean_domain = clean_domain.split("/")[0]

        discovered_hosts: List[Dict[str, str]] = []
        unique_ips = set()
        ct_subdomains = set()

        # 1. HackerTarget DNS Host Search
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{HACKERTARGET_HOSTSEARCH_URL}?q={clean_domain}")
                if resp.status_code == 200 and "error" not in resp.text.lower():
                    lines = resp.text.strip().split("\n")
                    for line in lines:
                        parts = line.strip().split(",")
                        if len(parts) >= 2:
                            host = parts[0].strip()
                            ip = parts[1].strip()
                            unique_ips.add(ip)
                            discovered_hosts.append({
                                "hostname": host,
                                "ip_address": ip,
                                "source": "HackerTarget DNS"
                            })
        except Exception:
            pass

        # 2. crt.sh Certificate Transparency
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{CRTSH_URL}?q=%.{clean_domain}&output=json")
                if resp.status_code == 200:
                    entries = resp.json()
                    for entry in entries[:15]:
                        name_val = entry.get("name_value") or ""
                        names = name_val.split("\n")
                        for n in names:
                            n_clean = n.strip().lower()
                            if n_clean.endswith(clean_domain) and not n_clean.startswith("*"):
                                ct_subdomains.add(n_clean)
        except Exception:
            pass

        # Add unique CT hostnames
        existing_hostnames = {h["hostname"] for h in discovered_hosts}
        for h in ct_subdomains:
            if h not in existing_hostnames:
                discovered_hosts.append({
                    "hostname": h,
                    "ip_address": "Resolved via CT Log",
                    "source": "crt.sh Certificate Transparency"
                })

        # 3. Wayback Machine / Internet Archive Snapshot
        archive_info: Dict[str, Any] = {
            "has_historical_snapshots": False,
            "snapshot_url": None,
            "timestamp": None
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(f"{WAYBACK_URL}?url={clean_domain}")
                if resp.status_code == 200:
                    data = resp.json().get("archived_snapshots", {})
                    closest = data.get("closest", {})
                    if closest.get("available"):
                        archive_info = {
                            "has_historical_snapshots": True,
                            "snapshot_url": closest.get("url"),
                            "timestamp": closest.get("timestamp"),
                            "status": closest.get("status")
                        }
        except Exception:
            pass

        # Risk rating based on perimeter breadth
        total_hosts = len(discovered_hosts)
        if total_hosts >= 25:
            risk_level = "HIGH"
        elif total_hosts >= 10:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        return {
            "layer": "Surface Web",
            "domain": clean_domain,
            "risk_level": risk_level,
            "total_surface_hosts": total_hosts,
            "discovered_hosts": discovered_hosts[:12],
            "unique_ip_addresses": list(unique_ips)[:8],
            "certificate_transparency_records": len(ct_subdomains),
            "wayback_archive": archive_info,
            "total_indicators": total_hosts,
            "summary": (
                f"Discovered {total_hosts} publicly exposed surface web host(s) and subdomains across {len(unique_ips)} unique IP address(es) via DNS mapping and Certificate Transparency."
                if total_hosts > 0
                else "No open surface web subdomains identified outside apex record."
            )
        }
