"""Scope Validator: Ensures passive discovery and scans are strictly confined to approved organization boundaries."""
import re
from typing import List
from app.models.organization import ApprovedScope

class ScopeValidator:
    @staticmethod
    def is_target_in_scope(target: str, approved_scopes: List[ApprovedScope]) -> bool:
        """
        Validates whether a domain, subdomain, or IP matches any approved organizational scope.
        Examples:
          Approved: "company.com" or "*.company.com"
          Matches: "company.com", "vpn.company.com", "api.internal.company.com"
          Rejects: "example-other-company.com", "google.com"
        """
        target = target.strip().lower()
        if not approved_scopes:
            return False

        for scope in approved_scopes:
            if not scope.is_active:
                continue

            pattern = scope.pattern.strip().lower()

            # Exact match (e.g. "company.com" == "company.com")
            if target == pattern:
                return True

            # Wildcard domain match (e.g. "*.company.com" or "company.com" covering subdomains)
            if pattern.startswith("*."):
                root_domain = pattern[2:]
                if target.endswith("." + root_domain) or target == root_domain:
                    return True
            else:
                # If approved scope is "company.com", subdomains like "vpn.company.com" are allowed
                if target.endswith("." + pattern):
                    return True

            # CIDR / IP prefix match
            if scope.scope_type in ("IP", "CIDR") and target == pattern:
                return True

        return False

