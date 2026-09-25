import os
import uuid
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")

def test_health_and_plans():
    r = requests.get(f"{BASE_URL}/api/", timeout=20)
    assert r.status_code == 200 and r.json()["status"] == "online"
    plans = requests.get(f"{BASE_URL}/api/plans", timeout=20).json()
    assert {p["id"] for p in plans} == {"quarterly_300", "yearly_500"}

def test_discovery_filters_and_details():
    r = requests.get(f"{BASE_URL}/api/halls", params={"pincode": "560001", "event_type": "Wedding", "min_capacity": 1000}, timeout=20)
    assert r.status_code == 200 and len(r.json()) >= 1
    hall = r.json()[0]
    assert hall["pincode"] == "560001" and hall["seating_capacity"] >= 1000 and "pricing_breakdown" in hall
    detail = requests.get(f"{BASE_URL}/api/halls/{hall['id']}", timeout=20)
    assert detail.status_code == 200 and detail.json()["name"] == hall["name"]

def test_vip_unlock_and_membership():
    customer = f"test_{uuid.uuid4().hex[:8]}"
    bad = requests.post(f"{BASE_URL}/api/user/membership/secret-unlock", json={"customer_id": customer, "code": "wrong"}, timeout=20)
    assert bad.status_code == 400
    good = requests.post(f"{BASE_URL}/api/user/membership/secret-unlock", json={"customer_id": customer, "code": "GT011103"}, timeout=20)
    assert good.status_code == 200 and good.json()["membership"]["is_pro"] is True
    membership = requests.get(f"{BASE_URL}/api/user/membership", params={"customer_id": customer}, timeout=20)
    assert membership.status_code == 200 and membership.json()["is_pro"] is True

def test_demo_login_and_reviews_read():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "arjun.sharma@example.com", "password": "Password@123"}, timeout=20)
    assert r.status_code == 200 and "token" in r.json()
    hall = requests.get(f"{BASE_URL}/api/halls", params={"pincode": "560001"}, timeout=20).json()[0]
    reviews = requests.get(f"{BASE_URL}/api/halls/{hall['id']}/reviews", timeout=20)
    assert reviews.status_code == 200 and isinstance(reviews.json()["reviews"], list)

def test_enquiry_create_cancel_and_availability():
    hall = requests.get(f"{BASE_URL}/api/halls", params={"pincode": "560001"}, timeout=20).json()[0]
    date = "2027-01-15"
    payload = {"hall_id": hall["id"], "customer_name": "TEST Customer", "customer_phone": "+919999999999", "customer_email": "test@example.com", "event_type": "Wedding", "event_date": date, "guest_count": 100}
    created = requests.post(f"{BASE_URL}/api/enquiries", json=payload, timeout=20)
    assert created.status_code == 201 and created.json()["status"] == "Pending"
    ref = created.json()["reference_id"]
    availability = requests.get(f"{BASE_URL}/api/halls/{hall['id']}/availability", timeout=20).json()
    assert date in availability["booked_dates"]
    cancelled = requests.patch(f"{BASE_URL}/api/enquiries/{ref}/cancel", timeout=20)
    assert cancelled.status_code == 200 and cancelled.json()["status"] == "Cancelled"