import os
import uuid
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")

def test_health_and_plans():
    r = requests.get(f"{BASE_URL}/api/", timeout=20)
    assert r.status_code == 200 and r.json()["status"] == "online"
    plans = requests.get(f"{BASE_URL}/api/plans", timeout=20).json()
    assert {p["id"] for p in plans} == {"weekly_100", "quarterly_300", "yearly_500"}

def get_or_create_test_hall():
    halls = requests.get(f"{BASE_URL}/api/halls", timeout=20).json()
    if halls:
        return halls[0]
    payload = {
        "name": "TEST Convention Hall",
        "tagline": "Grand Heritage Ballroom",
        "pincode": "560001",
        "area": "MG Road",
        "city": "Bangalore",
        "full_address": "42, MG Road, Bangalore - 560001",
        "description": "A luxury convention center",
        "price_per_day": 200000,
        "seating_capacity": 1000,
        "food_capacity": 500,
        "contact_phone": "+91 98450 12345",
        "contact_email": "owner@example.com",
        "amenities": ["Central AC", "Valet Parking"],
        "photos": ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"],
        "event_types": ["Wedding", "Reception"]
    }
    created = requests.post(f"{BASE_URL}/api/halls", json=payload, timeout=20).json()
    return created

def test_discovery_filters_and_details():
    hall = get_or_create_test_hall()
    r = requests.get(f"{BASE_URL}/api/halls", params={"pincode": "560001", "event_type": "Wedding", "min_capacity": 1000}, timeout=20)
    assert r.status_code == 200 and len(r.json()) >= 1
    found = r.json()[0]
    assert found["pincode"] == "560001" and found["seating_capacity"] >= 1000 and "pricing_breakdown" in found
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
    hall = get_or_create_test_hall()
    reviews = requests.get(f"{BASE_URL}/api/halls/{hall['id']}/reviews", timeout=20)
    assert reviews.status_code == 200 and isinstance(reviews.json()["reviews"], list)

def test_enquiry_create_cancel_and_availability():
    hall = get_or_create_test_hall()
    import random
    date = f"2027-{random.randint(1,12):02d}-{random.randint(10,28):02d}"
    payload = {"hall_id": hall["id"], "customer_name": "TEST Customer", "customer_phone": "+919999999999", "customer_email": "test@example.com", "event_type": "Wedding", "event_date": date, "guest_count": 100}
    created = requests.post(f"{BASE_URL}/api/enquiries", json=payload, timeout=20)
    assert created.status_code == 201 and created.json()["status"] == "Pending"
    ref = created.json()["reference_id"]
    availability = requests.get(f"{BASE_URL}/api/halls/{hall['id']}/availability", timeout=20).json()
    assert date in availability["booked_dates"]
    cancelled = requests.patch(f"{BASE_URL}/api/enquiries/{ref}/cancel", timeout=20)
    assert cancelled.status_code == 200 and cancelled.json()["status"] == "Cancelled"