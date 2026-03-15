"""InvoiceAI Backend Tests - Auth, Invoice CRUD, Analytics, Vendors"""
import pytest
import requests
import os
import uuid

def _get_base_url() -> str:
    base_url = (
        os.environ.get("TEST_BACKEND_URL")
        or os.environ.get("BACKEND_URL")
        or "http://localhost:8000"
    )
    return base_url.rstrip("/")


BASE_URL = _get_base_url()

TEST_EMAIL = f"TEST_{uuid.uuid4().hex[:8]}@invoiceai.com"
TEST_PASSWORD = "TestPass123"
TEST_USER = {
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
    "name": "TEST User",
    "business_name": "TEST Business",
    "gstin": None,
    "business_type": "retail"
}

_token = None
_invoice_id = None


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(session):
    """Register and return auth session"""
    global _token
    res = session.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
    if res.status_code == 400:  # already registered
        res = session.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert res.status_code == 200
    _token = res.json()["token"]
    session.headers.update({"Authorization": f"Bearer {_token}"})
    return session


# ── Health ──────────────────────────────────────────────────────────────────

class TestHealth:
    def test_health(self, session):
        res = session.get(f"{BASE_URL}/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        print("✅ Health check passed")


# ── Auth ────────────────────────────────────────────────────────────────────

class TestAuth:
    def test_register(self, session):
        email = f"TEST_{uuid.uuid4().hex[:8]}@test.com"
        res = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "Pass123!", "name": "TEST Reg", "business_name": "TEST Biz"
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert "user" in data
        print(f"✅ Register passed: {email}")

    def test_register_duplicate(self, auth_session):
        res = auth_session.post(f"{BASE_URL}/api/auth/register", json=TEST_USER)
        assert res.status_code == 400
        print("✅ Duplicate registration rejected")

    def test_login_success(self, session):
        res = session.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert data["user"]["email"] == TEST_EMAIL.lower()  # backend lowercases emails
        print("✅ Login passed")

    def test_login_wrong_password(self, session):
        res = session.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": "wrongpass"})
        assert res.status_code == 401
        print("✅ Wrong password rejected")

    def test_me(self, auth_session):
        res = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == TEST_EMAIL.lower()  # backend lowercases
        assert "id" in data
        print("✅ /me returned user info")

    def test_me_unauthenticated(self, session):
        s = requests.Session()
        res = s.get(f"{BASE_URL}/api/auth/me")
        assert res.status_code == 403
        print("✅ Unauthenticated /me blocked")


# ── Invoices ────────────────────────────────────────────────────────────────

class TestInvoices:
    def test_create_invoice(self, auth_session):
        global _invoice_id
        res = auth_session.post(f"{BASE_URL}/api/invoices", json={
            "invoice_number": "TEST-INV-001",
            "vendor_name": "TEST Vendor Ltd",
            "invoice_date": "2026-01-15",
            "grand_total": 11800.0,
            "subtotal": 10000.0,
            "cgst": 900.0,
            "sgst": 900.0,
            "total_tax": 1800.0,
            "status": "pending"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["grand_total"] == 11800.0
        assert data["vendor_name"] == "TEST Vendor Ltd"
        _invoice_id = data["id"]
        print(f"✅ Invoice created: {_invoice_id}")

    def test_list_invoices(self, auth_session):
        res = auth_session.get(f"{BASE_URL}/api/invoices")
        assert res.status_code == 200
        data = res.json()
        assert "invoices" in data
        assert "total" in data
        assert isinstance(data["invoices"], list)
        # Verify created invoice is in list
        ids = [inv["id"] for inv in data["invoices"]]
        assert _invoice_id in ids
        print(f"✅ List invoices: {data['total']} invoices")

    def test_get_invoice(self, auth_session):
        res = auth_session.get(f"{BASE_URL}/api/invoices/{_invoice_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == _invoice_id
        assert "_id" not in data
        print("✅ Get invoice passed")

    def test_update_invoice_status(self, auth_session):
        res = auth_session.patch(f"{BASE_URL}/api/invoices/{_invoice_id}/status", json={"status": "paid"})
        assert res.status_code == 200
        # Verify
        get_res = auth_session.get(f"{BASE_URL}/api/invoices/{_invoice_id}")
        assert get_res.json()["status"] == "paid"
        print("✅ Status update passed")

    def test_delete_invoice(self, auth_session):
        res = auth_session.delete(f"{BASE_URL}/api/invoices/{_invoice_id}")
        assert res.status_code == 200
        # Verify 404
        get_res = auth_session.get(f"{BASE_URL}/api/invoices/{_invoice_id}")
        assert get_res.status_code == 404
        print("✅ Delete invoice passed")


# ── Analytics & Vendors ─────────────────────────────────────────────────────

class TestAnalyticsVendors:
    def test_analytics_summary(self, auth_session):
        res = auth_session.get(f"{BASE_URL}/api/analytics/summary")
        assert res.status_code == 200
        data = res.json()
        assert "overall" in data
        assert "this_month" in data
        assert "top_vendors" in data
        assert "monthly_trend" in data
        print("✅ Analytics summary passed")

    def test_vendors(self, auth_session):
        res = auth_session.get(f"{BASE_URL}/api/vendors")
        assert res.status_code == 200
        assert isinstance(res.json(), list)
        print("✅ Vendors endpoint passed")
