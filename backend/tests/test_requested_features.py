import os
import uuid
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
CUSTOMER = {"email": "arjun.sharma@example.com", "password": "Password@123"}
OWNER = {"email": "owner.srikrishna@example.com", "password": "Password@123"}


def test_auth_payload_contract_all_flows():
    login = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER, timeout=20)
    assert login.status_code == 200
    assert login.json()["token"] == login.json()["session_token"]
    demo = requests.post(f"{BASE_URL}/api/auth/demo-login", json={"email": CUSTOMER["email"]}, timeout=20)
    assert demo.status_code == 200
    assert demo.json()["token"] == demo.json()["session_token"]
    email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    register = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": "Password@123", "name": "TEST User"}, timeout=20)
    assert register.status_code == 200
    assert register.json()["token"] == register.json()["session_token"]


def get_or_create_test_hall():
    halls = requests.get(f"{BASE_URL}/api/halls", timeout=20).json()
    if halls:
        return halls[0]
    payload = {
        "name": "TEST Bengaluru Hall",
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

def test_pincode_discovery_and_vip_unlock():
    _ = get_or_create_test_hall()
    halls = requests.get(f"{BASE_URL}/api/halls", params={"pincode": "560001"}, timeout=20)
    assert halls.status_code == 200 and halls.json() and all(h["pincode"].startswith("560001") for h in halls.json())
    customer_id = f"TEST_{uuid.uuid4().hex[:8]}"
    unlock = requests.post(f"{BASE_URL}/api/user/membership/secret-unlock", json={"customer_id": customer_id, "code": "GT011103"}, timeout=20)
    assert unlock.status_code == 200 and unlock.json()["membership"]["is_pro"] is True
    assert requests.get(f"{BASE_URL}/api/user/membership", params={"customer_id": customer_id}, timeout=20).json()["is_pro"] is True


def test_reviews_free_read_pro_write_and_owner_reply():
    hall = get_or_create_test_hall()
    free = requests.post(f"{BASE_URL}/api/auth/demo-login", json={"email": f"free_{uuid.uuid4().hex[:8]}@example.com"}, timeout=20).json()
    denied = requests.post(f"{BASE_URL}/api/halls/{hall['id']}/reviews", headers={"Authorization": f"Bearer {free['token']}"}, json={"rating": 5, "title": "TEST", "comment": "TEST"}, timeout=20)
    assert denied.status_code == 403
    pro = requests.post(f"{BASE_URL}/api/auth/login", json=CUSTOMER, timeout=20).json()
    created = requests.post(f"{BASE_URL}/api/halls/{hall['id']}/reviews", headers={"Authorization": f"Bearer {pro['token']}"}, json={"rating": 5, "title": "TEST review", "comment": "TEST verified review"}, timeout=20)
    assert created.status_code == 201 and created.json()["verified_booking"] is True
    reply = requests.post(f"{BASE_URL}/api/reviews/{created.json()['id']}/reply", json={"reply": "TEST owner response"}, timeout=20)
    assert reply.status_code == 200 and reply.json()["owner_reply"]["reply"] == "TEST owner response"


def test_bookmyevents_list_on_hall_finder_immediate_live():
    unique_name = f"BookMyEvents Venue {uuid.uuid4().hex[:6]}"
    payload = {
        "venue_name": unique_name,
        "pincode": "560001",
        "area": "MG Road",
        "city": "Bangalore",
        "tariff": 210000,
        "seating": 1100,
        "status": "pending_approval",
        "is_approved": False
    }
    submit = requests.post(f"{BASE_URL}/api/external/list-on-hall-finder", json=payload, timeout=20)
    assert submit.status_code == 201
    assert submit.json()["is_live"] is True
    assert submit.json()["name"] == unique_name

    # Confirm it is immediately listed in public halls search
    listed = requests.get(f"{BASE_URL}/api/halls", params={"search": unique_name}, timeout=20)
    assert listed.status_code == 200
    assert any(h["name"] == unique_name for h in listed.json())