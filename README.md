# ExposureX — Continuous Exposure Management & Risk Intelligence Platform

> **SEE EXPOSURE. REDUCE RISK. STAY AHEAD.**

---

## 1. Product Definition & Purpose

**ExposureX** is an on-premises, standalone **Continuous Exposure Management and Risk Intelligence platform**.

Its purpose is to:
1. Discover an organization's approved external assets with passive-first techniques.
2. Monitor credential exposure using authorized credential-intelligence providers with strict metadata minimization (zero plaintext passwords).
3. Ingest vulnerability intelligence from authorized security sources (CISA KEV, NVD, vendor advisories).
4. Correlate identities, assets, credential exposure, vulnerabilities, and business criticality into explainable relationship graphs.
5. Calculate transparent, explainable, and configurable risk scores across 4 core weighted pillars.
6. Generate actionable findings with clear remediation steps.
7. Manage incident lifecycles through security cases with analyst collaboration and immutable audit trails.
8. Deliver real-time notifications via WebSockets with **Security Pulse**.
9. Segregate internal organizational posture from third-party vendor supply chain risk.

---

## 2. Scope Restrictions & Compliance

ExposureX is an **exposure intelligence, correlation, and risk-prioritization platform** designed with strict safeguards:

* 🚫 **NO Plaintext Password Storage**: Never stores plaintext passwords, session cookies, auth tokens, or raw dumps.
* 🚫 **NO Offensive Automation**: No credential stuffing, password spraying, or automated exploitation.
* 🚫 **NO Live Authentication**: Never attempts authentication against exposed accounts or endpoints.
* 🚫 **Strict Scope Boundaries**: Prohibits scans against unapproved targets (e.g. `example-other-company.com`).
* 🚫 **Adapter Integrity**: Displays `"Not configured"` when API keys are absent; never fabricates fake integration results.

---

## 3. Core Architecture & Workflow

```text
Approved Organization Scope (*.company.com)
        ↓
External Asset Discovery (Certificate Transparency & DNS)
        ↓
Credential Intelligence (Minimized Breach Telemetry)
        ↓
Vulnerability Intelligence (CISA KEV & NVD Feeds)
        ↓
Identity Context (Privileged DevOps & Staff Roles)
        ↓
Business Criticality (Critical, High, Medium, Low)
        ↓
Correlation Engine (Identity ↔ Asset ↔ CVE ↔ Breach)
        ↓
Explainable Risk Engine (Exposure 30% + Vuln 25% + Cred 25% + Impact 20%)
        ↓
Findings (EXP-00042)
        ↓
Security Cases (INC-0001)
        ↓
Security Pulse (Live WebSocket Broadcast)
        ↓
Remediation & Resolution History
```

---

## 4. Tech Stack

* **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons, Cybersecurity Dark Theme.
* **Backend**: Python 3.10+, FastAPI, SQLAlchemy, Direct Bcrypt, Python-JOSE JWT, Pydantic v2.
* **Database**: PostgreSQL 16 (or SQLite for instantaneous standalone development).
* **Real-Time**: WebSockets (`/ws/pulse`) for Security Pulse notifications.
* **Reverse Proxy**: Nginx with strict security headers.
* **Deployment**: Docker Compose.

---

## 5. Quickstart & Local Execution

### Option A: Local Standalone (Quickest)

#### Backend:
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* API Documentation: `http://localhost:8000/docs`
* Health Check: `http://localhost:8000/health`

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
* Web Application: `http://localhost:3000`

---

### Option B: Docker Compose

```bash
docker-compose up --build
```
* Platform Access: `http://localhost` (Nginx port 80)
* REST API: `http://localhost/api/v1`
* Live Security Pulse WebSocket: `ws://localhost/ws/pulse`

---

## 6. Demo Mode & Pre-Loaded Personas

The platform includes a built-in synthetic enterprise dataset for `company.com`:

* **Administrator**: `admin@company.com` (Full privileges, scope management)
* **Security Analyst**: `security@company.com` (Finding triage, case management)
* **Risk Manager**: `risk@company.com` (Weight adjustments, third-party risk)
* **Auditor**: `auditor@company.com` (Compliance audit log oversight)
* **Viewer**: `viewer@company.com` (Executive read-only dashboards)

**Default Demo Password**: `ExposureX@2026!`

*(A one-click demo persona switcher is conveniently located in the top-right header).*

---

## 7. Verification & Automated Test Suite

To run the backend integration test suite verifying scope validation, auth, dashboard aggregation, risk calculation, findings, and cases:

```bash
cd backend
.\venv\Scripts\python -m pytest tests/ -v
```
All 7 integration test suites run against the test client and pass cleanly.

