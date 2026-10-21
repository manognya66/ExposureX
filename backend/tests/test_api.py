"""End-to-End API and Engine Unit & Integration Tests"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database
from app.engine.scope_validator import ScopeValidator
from app.models.organization import ApprovedScope, Organization
from app.models.user import User, RoleEnum
from app.core.security import hash_password

client = TestClient(app)

def setup_module(module):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db, seed_users=True)
    admin = db.query(User).filter(User.email == "admin@company.com").first()
    if not admin:
        org = db.query(Organization).first()
        admin = User(
            id="00000000-0000-0000-0000-000000000001",
            email="admin@company.com",
            hashed_password=hash_password("ExposureX@2026!"),
            full_name="Alex Vance",
            role=RoleEnum.ADMINISTRATOR.value,
            organization_id=org.id if org else None,
            mfa_enabled=False
        )
        db.add(admin)
        db.commit()
    db.close()



def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "ExposureX"
    assert data["status"] == "healthy"

def test_scope_validation():
    scopes = [
        ApprovedScope(pattern="company.com", scope_type="Domain", is_active=True),
        ApprovedScope(pattern="*.company.com", scope_type="Wildcard", is_active=True),
    ]
    # Allowed
    assert ScopeValidator.is_target_in_scope("company.com", scopes) is True
    assert ScopeValidator.is_target_in_scope("vpn.company.com", scopes) is True
    assert ScopeValidator.is_target_in_scope("portal.company.com", scopes) is True
    assert ScopeValidator.is_target_in_scope("sub.internal.company.com", scopes) is True
    
    # Blocked out-of-scope targets (per Section 6)
    assert ScopeValidator.is_target_in_scope("example-other-company.com", scopes) is False
    assert ScopeValidator.is_target_in_scope("google.com", scopes) is False

def test_auth_login():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@company.com", "password": "ExposureX@2026!"}
    )
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" == "access_token" in token_data or "access_token" in token_data
    assert token_data["email"] == "admin@company.com"
    assert token_data["role"] == "Administrator"

def test_dashboard_metrics():
    # Login to get token
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/dashboard/metrics", headers=headers)
    assert response.status_code == 200
    metrics = response.json()
    assert metrics["overall_risk_score"] > 0
    assert metrics["critical_findings"] >= 1
    assert metrics["external_assets"] >= 5
    assert metrics["credential_events"] >= 2
    assert len(metrics["trend_history"]) > 0

def test_asset_inventory_and_explainability():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/assets/", headers=headers)
    assert response.status_code == 200
    assets = response.json()
    assert len(assets) >= 5

    vpn_asset = next(a for a in assets if "vpn" in a["name"])
    assert vpn_asset["business_criticality"] == "Critical"

    # Detail view with risk breakdown
    detail_resp = client.get(f"/api/v1/assets/{vpn_asset['id']}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert "risk_breakdown" in detail
    assert "pillars" in detail["risk_breakdown"]
    assert "relationship_graph" in detail
    assert len(detail["relationship_graph"]["nodes"]) >= 2

def test_findings_and_case_lifecycle():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List findings
    f_resp = client.get("/api/v1/findings/", headers=headers)
    assert f_resp.status_code == 200
    findings = f_resp.json()
    assert len(findings) >= 2

    exp42 = next(f for f in findings if f["finding_ref"] == "EXP-00042")
    assert exp42["severity"] == "Critical"

    # Finding detail
    exp42_detail = client.get(f"/api/v1/findings/{exp42['finding_ref']}", headers=headers).json()
    assert "why_explanation" in exp42_detail

    # Cases
    case_resp = client.get("/api/v1/cases/", headers=headers)
    assert case_resp.status_code == 200
    cases = case_resp.json()
    assert len(cases) >= 1

    # Add comment to case
    case_id = cases[0]["id"]
    comm_resp = client.post(
        f"/api/v1/cases/{case_id}/comments",
        json={"comment": "Automated integration test verification note."},
        headers=headers
    )
    assert comm_resp.status_code == 201

def test_internal_and_third_party_risk_segregation():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Internal assessment
    internal_resp = client.get("/api/v1/risk/internal-assessment", headers=headers)
    assert internal_resp.status_code == 200
    int_data = internal_resp.json()
    assert "pillars" in int_data
    assert "key_drivers" in int_data

    # Third party assessment (separate)
    vendors_resp = client.get("/api/v1/vendors/", headers=headers)
    assert vendors_resp.status_code == 200
    vendors = vendors_resp.json()
    assert len(vendors) >= 3

def test_user_provisioning_and_role_assignment():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a custom user with assigned role
    new_email = "test.specialist@company.com"
    create_resp = client.post(
        "/api/v1/auth/users",
        json={
            "email": new_email,
            "full_name": "Test Security Specialist",
            "password": "InitialPass123!",
            "role": "Security Analyst"
        },
        headers=admin_headers
    )
    assert create_resp.status_code == 200
    created_user = create_resp.json()
    user_id = created_user["id"]
    assert created_user["email"] == new_email
    assert created_user["role"] == "Security Analyst"
    assert created_user["is_active"] is True

    # 2. Reassign role to Risk Manager
    reassign_resp = client.patch(
        f"/api/v1/auth/users/{user_id}",
        json={"role": "Risk Manager", "full_name": "Lead Risk Manager"},
        headers=admin_headers
    )
    assert reassign_resp.status_code == 200
    updated_user = reassign_resp.json()
    assert updated_user["role"] == "Risk Manager"
    assert updated_user["full_name"] == "Lead Risk Manager"

    # 3. Reset password
    reset_resp = client.post(
        f"/api/v1/auth/users/{user_id}/reset-password",
        json={"new_password": "PromotedPass456!"},
        headers=admin_headers
    )
    assert reset_resp.status_code == 200

    # 4. Authenticate as the newly provisioned and updated user
    new_user_login = client.post(
        "/api/v1/auth/login",
        data={"username": new_email, "password": "PromotedPass456!"}
    )
    assert new_user_login.status_code == 200
    new_user_data = new_user_login.json()
    assert new_user_data["role"] == "Risk Manager"

    # 5. Delete the test user
    del_resp = client.delete(f"/api/v1/auth/users/{user_id}", headers=admin_headers)
    assert del_resp.status_code == 200

def test_signup_mfa_and_account_not_found():
    # 1. Unregistered user login returns 404 ACCOUNT_NOT_FOUND
    unregistered_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "unregistered.analyst@company.com", "password": "AnyPassword123!"}
    )
    assert unregistered_resp.status_code == 404
    assert "ACCOUNT_NOT_FOUND" in unregistered_resp.json()["detail"]

    # 2. Sign up new account
    import uuid
    signup_email = f"officer.{uuid.uuid4().hex[:8]}@company.com"
    signup_resp = client.post(
        "/api/v1/auth/signup",
        json={
            "full_name": "New Secure Officer",
            "email": signup_email,
            "password": "SecureOfficerPass2026!",
            "organization_name": "Acme Global Enterprise"
        }
    )
    assert signup_resp.status_code == 200
    signup_data = signup_resp.json()
    assert signup_data["mfa_required"] is True
    assert "mfa_temp_code" in signup_data
    assert len(signup_data["mfa_temp_code"]) == 6
    user_id = signup_data["user_id"]
    mfa_code = signup_data["mfa_temp_code"]

    # 3. Invalid MFA code rejected
    bad_mfa_resp = client.post(
        "/api/v1/auth/mfa/verify",
        json={"user_id": user_id, "code": "000000"}
    )
    assert bad_mfa_resp.status_code == 400

    # 4. Valid MFA verification activates account and issues JWT token
    good_mfa_resp = client.post(
        "/api/v1/auth/mfa/verify",
        json={"user_id": user_id, "code": mfa_code}
    )
    assert good_mfa_resp.status_code == 200
    token_data = good_mfa_resp.json()
    assert "access_token" in token_data
    assert token_data["email"] == signup_email
    assert token_data["mfa_required"] is False
    client.app = None

def test_forgot_and_reset_password_and_sso():
    import uuid
    test_email = f"reset.user.{uuid.uuid4().hex[:6]}@company.com"

    # 1. Sign up user
    signup_resp = client.post(
        "/api/v1/auth/signup",
        json={"full_name": "Reset Test User", "email": test_email, "password": "OriginalPass123!"}
    )
    assert signup_resp.status_code == 200

    # 2. Forgot password request
    forgot_resp = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
    assert forgot_resp.status_code == 200
    forgot_data = forgot_resp.json()
    assert "reset_code_simulated" in forgot_data
    code = forgot_data["reset_code_simulated"]

    # 3. Reset password with code
    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={"email": test_email, "reset_code": code, "new_password": "NewBrandPassword2026!"}
    )
    assert reset_resp.status_code == 200

    # 4. Login with new password
    login_resp = client.post("/api/v1/auth/login", data={"username": test_email, "password": "NewBrandPassword2026!"})
    assert login_resp.status_code == 200

    # 5. Check SSO registered domains endpoint
    domains_resp = client.get("/api/v1/auth/sso/domains")
    assert domains_resp.status_code == 200
    reg_domains = domains_resp.json()["registered_domains"]
    assert "company.com" in reg_domains

    # 6. SSO authentication with company.com domain succeeds (200)
    sso_resp = client.post("/api/v1/auth/sso", json={"provider": "google", "email": f"sso.{uuid.uuid4().hex[:6]}@company.com", "full_name": "SSO Google Analyst"})
    assert sso_resp.status_code == 200
    assert "access_token" in sso_resp.json()

    # 7. SSO authentication with any corporate company domain (e.g. sam@abc.com) succeeds and dynamically provisions company (200)
    abc_email = f"sam.{uuid.uuid4().hex[:4]}@abc.com"
    sso_abc_resp = client.post("/api/v1/auth/sso", json={"provider": "google", "email": abc_email, "full_name": "Sam Abc"})
    assert sso_abc_resp.status_code == 200
    assert "access_token" in sso_abc_resp.json()
    assert sso_abc_resp.json()["email"] == abc_email

    # 8. SSO authentication with personal/consumer webmail domain is strictly rejected (403 Forbidden)
    sso_gmail_resp = client.post("/api/v1/auth/sso", json={"provider": "google", "email": "unregistered.user@gmail.com", "full_name": "Unregistered User"})
    assert sso_gmail_resp.status_code == 403

    # 9. Test User Invite URL generation and same-company enforcement
    # Login as admin to get auth headers
    login_adm = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    adm_token = login_adm.json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # Generate invite URL
    invite_resp = client.post("/api/v1/auth/invites", json={}, headers=adm_headers)
    assert invite_resp.status_code == 200
    invite_data = invite_resp.json()
    assert invite_data["status"] == "success"
    assert "invite_token" in invite_data
    assert invite_data["allowed_domain"] == "company.com"
    invite_token = invite_data["invite_token"]

    # Verify public invite details
    details_resp = client.get(f"/api/v1/auth/invites/{invite_token}")
    assert details_resp.status_code == 200
    assert details_resp.json()["allowed_domain"] == "company.com"

    # Reject accepting invite with different company domain (403)
    bad_invitee = client.post(
        "/api/v1/auth/sso",
        json={"provider": "google", "email": "impostor@notcompany.com", "invite_token": invite_token}
    )
    assert bad_invitee.status_code == 403

    # Accept invite with same company domain succeeds (200)
    good_invitee = client.post(
        "/api/v1/auth/sso",
        json={"provider": "google", "email": f"invited.{uuid.uuid4().hex[:6]}@company.com", "invite_token": invite_token}
    )
    assert good_invitee.status_code == 200
    assert "access_token" in good_invitee.json()

def test_nvd_provider_key_configuration():
    # Login as admin to get auth headers
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update NVD API key
    update_resp = client.post("/api/v1/providers/nvd-key", json={"api_key": "test-nist-nvd-api-key-12345"}, headers=headers)
    assert update_resp.status_code == 200
    res_json = update_resp.json()
    assert res_json["status"] == "success"
    assert res_json["health"]["has_api_key"] is True


def test_free_credential_providers():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/providers/", headers=headers)
    assert resp.status_code == 200
    providers = resp.json()
    provider_ids = [p["id"] for p in providers]
    assert "XposedOrNot" in provider_ids
    assert "LeakCheck" in provider_ids
    assert "HudsonRock" in provider_ids
    # Multi-layer web intelligence providers
    assert "darkweb_ransomwatch" in provider_ids
    assert "deepweb_urlscan_otx" in provider_ids
    assert "surfaceweb_hackertarget" in provider_ids


def test_company_benchmarks_and_filters():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Total peers expanded
    resp = client.get("/api/v1/risk/company-benchmarks", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_peers_compared"] >= 20
    assert len(data["peers"]) >= 20

    # 2. Sector filtering
    sector_resp = client.get("/api/v1/risk/company-benchmarks?sector=Energy%20%26%20Critical%20Infrastructure", headers=headers)
    assert sector_resp.status_code == 200
    sec_data = sector_resp.json()
    assert len(sec_data["peers"]) >= 2
    assert all("Energy" in p["sector"] for p in sec_data["peers"])

    # 3. Search filtering
    search_resp = client.get("/api/v1/risk/company-benchmarks?search=Horizon", headers=headers)
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert len(search_data["peers"]) >= 1
    assert any("Horizon" in p["name"] for p in search_data["peers"])


def test_multi_layer_web_intelligence_scan():
    login_resp = client.post("/api/v1/auth/login", data={"username": "admin@company.com", "password": "ExposureX@2026!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/providers/scan-company",
        json={"domain": "abc.com", "company_name": "Abc Enterprise"},
        headers=headers
    )
    assert resp.status_code == 200
    result = resp.json()
    assert result["target_domain"] == "abc.com"
    assert "composite_risk_level" in result
    assert "layers" in result
    assert "dark_web" in result["layers"]
    assert "deep_web" in result["layers"]
    assert "surface_web" in result["layers"]



def teardown_module(module):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)



