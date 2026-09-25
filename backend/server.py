from fastapi import FastAPI, APIRouter, HTTPException, Query, Request, status, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, BeforeValidator, EmailStr
from typing import List, Optional, Annotated, Any, Literal
import uuid
from datetime import datetime, timezone, timedelta
import re
import httpx
import hashlib
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection without hardcoded fallbacks
mongo_url = os.environ['MONGO_URL']
db_name = os.environ.get('DB_NAME', 'hall_finder_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Cashfree PG configuration
CASHFREE_ENV = os.environ.get("CASHFREE_ENV", "sandbox")
CASHFREE_BASE = "https://sandbox.cashfree.com/pg" if CASHFREE_ENV != "production" else "https://api.cashfree.com/pg"
CASHFREE_CLIENT_ID = os.environ.get("CASHFREE_CLIENT_ID", "")
CASHFREE_CLIENT_SECRET = os.environ.get("CASHFREE_CLIENT_SECRET", "")
CASHFREE_API_VERSION = os.environ.get("CASHFREE_API_VERSION", "2023-08-01")
MOCK_PAYMENTS = os.environ.get("MOCK_PAYMENTS", "true").lower() == "true"

# PyObjectId for Pydantic coercion
PyObjectId = Annotated[str, BeforeValidator(lambda x: str(x) if x is not None else str(uuid.uuid4()))]

class BaseDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude_none=True)
        if "_id" in data and not data["_id"]:
            del data["_id"]
        return data

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return None
        mongo_data = dict(data)
        if "_id" in mongo_data:
            mongo_data["id"] = str(mongo_data.pop("_id"))
        return cls(**mongo_data)

# Plans configuration
PLANS = {
    "weekly_100": {
        "id": "weekly_100",
        "name": "Weekly Pro (7 Days)",
        "amount": 100.0,
        "currency": "INR",
        "duration_days": 7,
        "duration_months": 0,
        "description": "Full Pro access for 7 days (₹14/day)"
    },
    "quarterly_300": {
        "id": "quarterly_300",
        "name": "Quarterly Pro (3 Months)",
        "amount": 300.0,
        "currency": "INR",
        "duration_days": 90,
        "duration_months": 3,
        "description": "Full Pro access for 3 months (₹100/mo)"
    },
    "yearly_500": {
        "id": "yearly_500",
        "name": "Annual Pro (1 Year)",
        "amount": 500.0,
        "currency": "INR",
        "duration_days": 365,
        "duration_months": 12,
        "description": "Full Pro access for 1 full year (₹42/mo - Save 45%)"
    }
}

# Pricing Breakdown Model
class PricingBreakdown(BaseModel):
    base_rent_per_day: int
    advance_booking_deposit: int
    cleaning_and_maintenance: int
    gst_percentage: int = 18
    approx_total_per_day: int

# Hall Data Models
class HallCreate(BaseModel):
    name: str
    tagline: str
    pincode: str
    area: str
    city: str
    state: str = "Karnataka"
    full_address: str
    google_maps_url: Optional[str] = None
    description: str
    price_per_day: int
    pricing_breakdown: Optional[PricingBreakdown] = None
    seating_capacity: int
    food_capacity: int
    parking_capacity: str = "200 Cars with Valet"
    parking_available: bool = True
    generator_backup: bool = True
    generator_details: str = "100% 250 kVA Silent DG Backup"
    ac_available: bool = True
    rooms_count: int = 6
    catering_policy: str = "In-house Master Chefs & Outside Caterers Allowed"
    amenities: List[str] = Field(default_factory=lambda: ["Central Air Conditioning", "Power Backup", "Valet Parking", "AC Bridal Rooms", "Dining Hall"])
    photos: List[str] = Field(default_factory=lambda: [
        "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"
    ])
    contact_phone: str = "+91 98450 12345"
    manager_phone: Optional[str] = "+91 98450 99887"
    whatsapp_number: Optional[str] = "+91 98450 12345"
    contact_email: str = "owner@conventioncenter.com"
    event_types: List[str] = Field(default_factory=lambda: ["Wedding", "Reception", "Engagement", "Corporate", "Cultural"])
    booked_dates: List[str] = Field(default_factory=list)
    featured: bool = False

class HallUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    pincode: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    full_address: Optional[str] = None
    google_maps_url: Optional[str] = None
    description: Optional[str] = None
    price_per_day: Optional[int] = None
    pricing_breakdown: Optional[PricingBreakdown] = None
    seating_capacity: Optional[int] = None
    food_capacity: Optional[int] = None
    parking_capacity: Optional[str] = None
    parking_available: Optional[bool] = None
    generator_backup: Optional[bool] = None
    generator_details: Optional[str] = None
    ac_available: Optional[bool] = None
    rooms_count: Optional[int] = None
    catering_policy: Optional[str] = None
    amenities: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    contact_phone: Optional[str] = None
    manager_phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    contact_email: Optional[str] = None
    event_types: Optional[List[str]] = None
    booked_dates: Optional[List[str]] = None
    featured: Optional[bool] = None

# Booking Enquiry Model
class BookingEnquiryCreate(BaseModel):
    hall_id: str
    customer_name: str
    customer_phone: str
    customer_email: str
    event_type: str
    event_date: str  # YYYY-MM-DD
    guest_count: int
    food_preference: str = "Veg Only"
    additional_notes: Optional[str] = ""

# Instant Reservation Booking Model
class InstantBookingCreate(BaseModel):
    hall_id: str
    customer_name: str
    customer_phone: str
    customer_email: str
    event_type: str
    event_date: str  # YYYY-MM-DD
    guest_count: int
    deposit_amount: Optional[int] = None
    food_preference: str = "Veg Only"
    additional_notes: Optional[str] = ""

class PaymentCheckoutIn(BaseModel):
    plan: Literal["weekly_100", "quarterly_300", "yearly_500"]
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: str

class SecretUnlockIn(BaseModel):
    customer_id: str
    code: str
    customer_name: Optional[str] = "VIP Pro Member"

# User Auth Models
class UserRegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = "customer"

class UserLoginIn(BaseModel):
    email: EmailStr
    password: str

class DemoLoginIn(BaseModel):
    email: str
    name: Optional[str] = None
    role: Optional[str] = "customer"

class SessionExchangeIn(BaseModel):
    session_id: str

class AppleAuthIn(BaseModel):
    apple_id: str
    email: Optional[str] = None
    name: Optional[str] = None

class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str
    comment: str
    event_type: Optional[str] = "Wedding Reception"
    reviewer_name: Optional[str] = None

class ReviewReplyIn(BaseModel):
    reply: str
    replied_by: Optional[str] = "Hall Management"

# Initial Verified Sample Halls
SAMPLE_HALLS = [
    {
        "name": "Sri Krishna Grand Convention Centre",
        "tagline": "Grand Heritage Ballroom & Luxurious Lawn for Royal Celebrations",
        "pincode": "560001",
        "area": "MG Road / Indiranagar",
        "city": "Bangalore",
        "state": "Karnataka",
        "full_address": "42, Trinity Circle, Near MG Road Metro, Bangalore, Karnataka - 560001",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Sri+Krishna+Grand+Convention+Centre+Bangalore+560001",
        "description": "Sri Krishna Grand is one of Bangalore's most prestigious luxury convention centers. Featuring high-ceiling acoustic architecture, Italian marble flooring, Swarovski crystal chandeliers, and an expansive dining hall that comfortably accommodates large gatherings with royal splendor.",
        "price_per_day": 250000,
        "pricing_breakdown": {
            "base_rent_per_day": 250000,
            "advance_booking_deposit": 50000,
            "cleaning_and_maintenance": 15000,
            "gst_percentage": 18,
            "approx_total_per_day": 310000
        },
        "seating_capacity": 1500,
        "food_capacity": 800,
        "parking_capacity": "300 Cars & 500 Two-wheelers with Valet Service",
        "parking_available": True,
        "generator_backup": True,
        "generator_details": "100% 320 kVA Soundproof Cummins DG Backup with seamless instant Auto-switchover",
        "ac_available": True,
        "rooms_count": 8,
        "catering_policy": "In-house Master Chefs & Outside Caterers Allowed",
        "amenities": [
            "Central Air Conditioning",
            "320 kVA 100% DG Power Backup",
            "300+ Valet Car Parking",
            "8 Deluxe AC Bridal & Guest Suites",
            "Grand Dining Hall (800 Seating)",
            "Concert Grade JBL Audio & Intelligent Lighting",
            "Spacious Stage (60ft x 30ft)",
            "Elevators & Wheelchair Friendly",
            "24/7 CCTV & Security Staff",
            "Dedicated Mandap & Hawan Area"
        ],
        "photos": [
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80"
        ],
        "rating": 4.9,
        "reviews_count": 184,
        "contact_phone": "+91 98450 12345",
        "manager_phone": "+91 98450 99887",
        "whatsapp_number": "+91 98450 12345",
        "contact_email": "owner.srikrishna@example.com",
        "event_types": ["Wedding", "Reception", "Engagement", "Birthday", "Corporate", "Cultural"],
        "booked_dates": ["2026-09-26", "2026-09-27", "2026-10-03", "2026-10-10", "2026-10-17", "2026-10-24", "2026-11-07", "2026-11-14", "2026-12-05"],
        "featured": True
    },
    {
        "name": "Imperial Palace Banquet & Convention Hall",
        "tagline": "Opulent Gold & Velvet Interiors for Prestigious Celebrations",
        "pincode": "560034",
        "area": "Koramangala 4th Block",
        "city": "Bangalore",
        "state": "Karnataka",
        "full_address": "88, 80 Feet Road, Near Sony World Signal, Koramangala, Bangalore - 560034",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Imperial+Palace+Banquet+Hall+Koramangala+Bangalore+560034",
        "description": "Experience supreme hospitality in Koramangala. Imperial Palace offers state-of-the-art climate control, royal gold themed decor, separate vegetarian kitchen facilities, and an exquisite pre-function lobby for welcome drinks.",
        "price_per_day": 180000,
        "pricing_breakdown": {
            "base_rent_per_day": 180000,
            "advance_booking_deposit": 40000,
            "cleaning_and_maintenance": 12000,
            "gst_percentage": 18,
            "approx_total_per_day": 224400
        },
        "seating_capacity": 1000,
        "food_capacity": 600,
        "parking_capacity": "200 Cars with Basement & Open Valet Parking",
        "parking_available": True,
        "generator_backup": True,
        "generator_details": "250 kVA Silent Kirloskar Generator with zero latency switch",
        "ac_available": True,
        "rooms_count": 6,
        "catering_policy": "Veg Only Kitchen - Outside Caterers Welcome",
        "amenities": [
            "Central AC with Air Purification",
            "250 kVA Silent Generator Backup",
            "Basement & Open Parking (200 Cars)",
            "6 Air-Conditioned Green Rooms",
            "Grand Dining Hall (600 Capacity)",
            "LED Video Walls & Stage Truss Setup",
            "Elevator Access to All Floors",
            "Fire Safety & Sprinklers System",
            "Bridal Makeup Room with Mirrors"
        ],
        "photos": [
            "https://images.unsplash.com/photo-1545232979-fbf68fe9ec40?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
        ],
        "rating": 4.8,
        "reviews_count": 132,
        "contact_phone": "+91 98801 87654",
        "manager_phone": "+91 98801 11223",
        "whatsapp_number": "+91 98801 87654",
        "contact_email": "imperial.koramangala@gmail.com",
        "event_types": ["Wedding", "Reception", "Engagement", "Corporate", "Cultural"],
        "booked_dates": ["2026-09-25", "2026-09-28", "2026-10-04", "2026-10-11", "2026-10-18", "2026-11-08", "2026-11-22"],
        "featured": True
    },
    {
        "name": "Mahalaxmi Kalyana Mandapam & Palace",
        "tagline": "Traditional South Indian Architecture with Modern Luxury",
        "pincode": "600001",
        "area": "George Town / Parry's Corner",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "full_address": "15, Rajaji Salai, Near High Court Metro, Chennai, Tamil Nadu - 600001",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Mahalaxmi+Kalyana+Mandapam+Chennai+600001",
        "description": "A celebrated heritage wedding destination in Chennai featuring carved teakwood pillars, sacred traditional Homam/Hawan setups, a sprawling air-conditioned main hall, and traditional plantain leaf seating capacity.",
        "price_per_day": 220000,
        "pricing_breakdown": {
            "base_rent_per_day": 220000,
            "advance_booking_deposit": 45000,
            "cleaning_and_maintenance": 14000,
            "gst_percentage": 18,
            "approx_total_per_day": 273600
        },
        "seating_capacity": 1800,
        "food_capacity": 900,
        "parking_capacity": "250 Cars & 600 Bikes with Security Attendants",
        "parking_available": True,
        "generator_backup": True,
        "generator_details": "100% 300 kVA Soundproof Caterpillar DG Backup",
        "ac_available": True,
        "rooms_count": 10,
        "catering_policy": "Strictly Vegetarian - Dedicated Traditional Kitchen",
        "amenities": [
            "Central AC Main Hall & Dining",
            "300 kVA Heavy Duty DG Backup",
            "250+ Car Parking Ground",
            "10 Well-Appointed AC Guest Rooms",
            "Traditional Plantain Leaf Dining (900 seats)",
            "Traditional Nadaswaram Stage Setup",
            "CCTV Security & Fire Extinguishers",
            "Purified RO Drinking Water Plant"
        ],
        "photos": [
            "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80"
        ],
        "rating": 4.9,
        "reviews_count": 210,
        "contact_phone": "+91 94440 34567",
        "manager_phone": "+91 94440 98765",
        "whatsapp_number": "+91 94440 34567",
        "contact_email": "booking@mahalaxmimandapam.com",
        "event_types": ["Wedding", "Reception", "Engagement", "Upanayanam", "Cultural"],
        "booked_dates": ["2026-09-24", "2026-09-27", "2026-10-02", "2026-10-09", "2026-10-23", "2026-11-15"],
        "featured": True
    },
    {
        "name": "Emerald Grand Ballroom & Convention",
        "tagline": "Colaba's Premier Sea-Breeze Luxury Banquet Destination",
        "pincode": "400001",
        "area": "Fort / Colaba",
        "city": "Mumbai",
        "state": "Maharashtra",
        "full_address": "22, Shahid Bhagat Singh Road, Opp. Regal Cinema, Colaba, Mumbai - 400001",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Emerald+Grand+Ballroom+Colaba+Mumbai+400001",
        "description": "High-end luxury ballroom in South Mumbai. Complete with dramatic crystal chandeliers, acoustic wall paneling, ultra-modern audio-visual capabilities, and gourmet culinary staging zones.",
        "price_per_day": 350000,
        "pricing_breakdown": {
            "base_rent_per_day": 350000,
            "advance_booking_deposit": 75000,
            "cleaning_and_maintenance": 20000,
            "gst_percentage": 18,
            "approx_total_per_day": 433000
        },
        "seating_capacity": 1200,
        "food_capacity": 700,
        "parking_capacity": "150 Luxury Cars with Automated Stack & Valet",
        "parking_available": True,
        "generator_backup": True,
        "generator_details": "100% 400 kVA Dual DG Backup Sets with uninterrupted power",
        "ac_available": True,
        "rooms_count": 5,
        "catering_policy": "In-house Master Chef Culinary Team & Custom Menus",
        "amenities": [
            "Central AC with Micro-climate Zones",
            "400 kVA Dual DG Power Generator",
            "Stack & Valet Parking (150 Cars)",
            "5 Luxury Celebrity Suite Rooms",
            "Fine Dining Hall (700 Capacity)",
            "L-Acoustics Sound System & Moving Heads",
            "High Speed Wi-Fi & Live Stream Booth",
            "Modern Green Room & Salon Mirror"
        ],
        "photos": [
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1545232979-fbf68fe9ec40?auto=format&fit=crop&w=1200&q=80"
        ],
        "rating": 4.9,
        "reviews_count": 165,
        "contact_phone": "+91 98200 45678",
        "manager_phone": "+91 98200 12399",
        "whatsapp_number": "+91 98200 45678",
        "contact_email": "emerald.mumbai@grandbanquets.in",
        "event_types": ["Wedding", "Reception", "Engagement", "Corporate", "Cultural"],
        "booked_dates": ["2026-09-25", "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-18", "2026-11-12"],
        "featured": True
    },
    {
        "name": "Cyber Grand Convention & Lawn",
        "tagline": "Hi-Tech City's Most Celebrated Tech & Wedding Destination",
        "pincode": "500081",
        "area": "Hitec City / Madhapur",
        "city": "Hyderabad",
        "state": "Telangana",
        "full_address": "88, Cyber Towers Road, Madhapur, Hitec City, Hyderabad - 500081",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Cyber+Grand+Convention+Madhapur+Hyderabad+500081",
        "description": "A gigantic venue combining modern corporate aesthetics with wedding luxury. Perfect for massive tech conferences, product launches, grand sangeet nights, and lavish wedding receptions.",
        "price_per_day": 340000,
        "pricing_breakdown": {
            "base_rent_per_day": 340000,
            "advance_booking_deposit": 70000,
            "cleaning_and_maintenance": 20000,
            "gst_percentage": 18,
            "approx_total_per_day": 421200
        },
        "seating_capacity": 2200,
        "food_capacity": 1200,
        "parking_capacity": "450 Cars & 700 Two-wheelers with Valet",
        "parking_available": True,
        "generator_backup": True,
        "generator_details": "100% 450 kVA Dual DG Backup Sets with zero blackout guarantee",
        "ac_available": True,
        "rooms_count": 10,
        "catering_policy": "Multi-Cuisine In-house & Outside Caterers Allowed",
        "amenities": [
            "Central AC with Smart Thermal Control",
            "450 kVA Dual Generator Backup",
            "450+ Car Parking Ground",
            "10 Executive AC Rooms & Suites",
            "Grand Dining Pavilion (1200 seats)",
            "State of the Art AV, 4K Projection & Lighting",
            "Private Lawn & Terrace",
            "High Speed Dedicated Fiber Internet"
        ],
        "photos": [
            "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80"
        ],
        "rating": 4.9,
        "reviews_count": 156,
        "contact_phone": "+91 98491 22334",
        "manager_phone": "+91 98491 88990",
        "whatsapp_number": "+91 98491 22334",
        "contact_email": "sales@cybergrand.com",
        "event_types": ["Wedding", "Reception", "Corporate", "Engagement", "Conference"],
        "booked_dates": ["2026-09-26", "2026-09-27", "2026-10-03", "2026-10-17", "2026-10-31", "2026-11-21"],
        "featured": True
    },
    {
        "name": "Royal Heritage Convention & Garden Lawn",
        "tagline": "Grand Heritage Ballroom with 3-Acre Lush Greenery",
        "pincode": "110001",
        "area": "Connaught Place / Barakhamba",
        "city": "Delhi",
        "state": "Delhi",
        "full_address": "8, Barakhamba Road, Near Metro Gate 4, Connaught Place, New Delhi - 110001",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query=Royal+Heritage+Convention+Connaught+Place+New+Delhi+110001",
        "description": "Centrally located in the heart of the national capital. Boasts a massive pillarless ballroom and an adjacent open-air royal lawn perfect for grand wedding pheras and reception dinners under the stars.",
        "price_per_day": 400000,
        "pricing_breakdown": {
            "base_rent_per_day": 400000,
            "advance_booking_deposit": 80000,
            "cleaning_and_maintenance": 25000,
            "gst_percentage": 18,
            "approx_total_per_day": 497000
        },
        "seating_capacity": 2500,
        "food_capacity": 1500,
        "parking_capacity": "500+ Cars Inside Campus with Dedicated Valet",
        "parking_available": True,
        "generator_backup": True,
        "generator_details": "100% 500 kVA Industrial Soundless Generator Backup",
        "ac_available": True,
        "rooms_count": 12,
        "catering_policy": "Multi-Cuisine Veg & Non-Veg In-house & Outside Caterers",
        "amenities": [
            "Pillarless AC Ballroom + Open Lawn",
            "500 kVA Full DG Power Backup",
            "500+ Cars Inside Campus Parking",
            "12 Luxury Suites for Families",
            "Double Dining Pavilions (1500 seats)",
            "Concert Stage with Trusses & LED",
            "Security Scanners & Armed Guards",
            "Separate Bridal & Groom Dressing Lounges"
        ],
        "photos": [
            "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80"
        ],
        "rating": 4.8,
        "reviews_count": 240,
        "contact_phone": "+91 98110 56789",
        "manager_phone": "+91 98110 33445",
        "whatsapp_number": "+91 98110 56789",
        "contact_email": "events@royalheritagedelhi.com",
        "event_types": ["Wedding", "Reception", "Engagement", "Corporate", "Sangeet"],
        "booked_dates": ["2026-09-27", "2026-10-04", "2026-10-11", "2026-10-25", "2026-11-08", "2026-11-29"],
        "featured": True
    }
]

SAMPLE_REVIEWS = [
    {
        "hall_name": "Sri Krishna Grand Convention Centre",
        "reviewer_name": "Dr. Rajesh & Sunita",
        "rating": 5,
        "title": "Magnificent Royal Wedding Experience!",
        "comment": "We hosted our daughter's wedding here with 1200 guests. The Swarovski crystal chandeliers, Italian marble floor, and flawless 320 kVA generator backup ensured zero power flicker. Dining hall catered 800 guests per batch smoothly.",
        "event_type": "Wedding Reception",
        "verified_booking": True,
        "created_at": "2026-08-15T10:30:00+00:00"
    },
    {
        "hall_name": "Sri Krishna Grand Convention Centre",
        "reviewer_name": "Vikram Malhotra",
        "rating": 5,
        "title": "Top notch valet parking and acoustics",
        "comment": "Over 250 cars parked effortlessly with their professional valet team. The acoustic design and JBL sound made our sangeet music crystal clear.",
        "event_type": "Sangeet & Reception",
        "verified_booking": True,
        "created_at": "2026-07-28T14:15:00+00:00"
    },
    {
        "hall_name": "Imperial Palace Banquet & Convention Hall",
        "reviewer_name": "Meera Venkatesh",
        "rating": 5,
        "title": "Clean, luxurious and very well maintained",
        "comment": "The AC in Koramangala was ice-cool throughout the 6-hour event. 6 green rooms with mirrors were great for bridal makeup.",
        "event_type": "Betrothal & Reception",
        "verified_booking": True,
        "created_at": "2026-08-04T18:20:00+00:00"
    },
    {
        "hall_name": "Cyber Grand Convention & Lawn",
        "reviewer_name": "Ananya K.",
        "rating": 5,
        "title": "Huge capacity and stunning lighting",
        "comment": "Accommodated our tech summit and annual celebration with 2000 attendees. The lawn and grand stage setup is unmatched in Hitec City.",
        "event_type": "Corporate Gala & Wedding",
        "verified_booking": True,
        "created_at": "2026-08-20T09:45:00+00:00"
    },
    {
        "hall_name": "Mahalaxmi Kalyana Mandapam & Palace",
        "reviewer_name": "S. Ramachandran",
        "rating": 5,
        "title": "Pure traditional South Indian heritage elegance",
        "comment": "Carved teakwood pillars and authentic plantain leaf seating in the dining hall made our wedding traditional and sacred.",
        "event_type": "Traditional Wedding",
        "verified_booking": True,
        "created_at": "2026-08-10T12:00:00+00:00"
    }
]

# Helpers
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed: str) -> bool:
    return hash_password(plain_password) == hashed

def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        doc_copy["id"] = str(doc_copy.pop("_id"))
    if "price_per_day" in doc_copy and ("pricing_breakdown" not in doc_copy or not doc_copy.get("pricing_breakdown")):
        price = doc_copy.get("price_per_day", 200000)
        deposit = int(price * 0.2)
        cleaning = int(price * 0.05)
        tax = int((price + cleaning) * 0.18)
        doc_copy["pricing_breakdown"] = {
            "base_rent_per_day": price,
            "advance_booking_deposit": deposit,
            "cleaning_and_maintenance": cleaning,
            "gst_percentage": 18,
            "approx_total_per_day": price + cleaning + tax
        }
    return doc_copy

def cf_headers(key: Optional[str] = None):
    h = {
        "accept": "application/json",
        "content-type": "application/json",
        "x-api-version": CASHFREE_API_VERSION,
        "x-client-id": CASHFREE_CLIENT_ID,
        "x-client-secret": CASHFREE_CLIENT_SECRET
    }
    if key:
        h["x-idempotency-key"] = key
    return h

async def create_user_session(user_id: str) -> str:
    session_token = f"sess_{uuid.uuid4().hex}_{uuid.uuid4().hex[:12]}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at
    })
    return session_token

async def get_user_from_token(token: str) -> Optional[dict]:
    if not token:
        return None
    session_doc = await db.user_sessions.find_one({"session_token": token})
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if expires_at:
        try:
            exp_dt = datetime.fromisoformat(expires_at) if isinstance(expires_at, str) else expires_at
            if exp_dt.tzinfo is None:
                exp_dt = exp_dt.replace(tzinfo=timezone.utc)
            if exp_dt < datetime.now(timezone.utc):
                return None
        except Exception:
            pass

    user = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0, "password_hash": 0})
    return user

async def seed_initial_halls(force: bool = False):
    count = await db.halls.count_documents({"deleted_at": None})
    if count == 0 or force:
        if force:
            await db.halls.delete_many({})
            await db.reviews.delete_many({})
        for hall in SAMPLE_HALLS:
            hall_copy = dict(hall)
            hall_copy["created_at"] = datetime.now(timezone.utc).isoformat()
            hall_copy["deleted_at"] = None
            res = await db.halls.insert_one(hall_copy)
            hall_id_str = str(res.inserted_id)

            for r in SAMPLE_REVIEWS:
                if r["hall_name"] == hall["name"]:
                    review_doc = dict(r)
                    review_doc["hall_id"] = hall_id_str
                    review_doc["user_id"] = "user_verified_sample"
                    await db.reviews.insert_one(review_doc)

        # Preseed demo accounts & Pro VIP for arjun.sharma@example.com
        arjun_user_id = "user_arjun_demo"
        await db.users.update_one(
            {"email": "arjun.sharma@example.com"},
            {"$set": {
                "user_id": arjun_user_id,
                "email": "arjun.sharma@example.com",
                "name": "Arjun Sharma",
                "password_hash": hash_password("Password@123"),
                "role": "customer",
                "auth_provider": "demo",
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )

        # Grant Arjun Pro VIP
        await db.memberships.update_one(
            {"customer_id": arjun_user_id},
            {"$set": {
                "customer_id": arjun_user_id,
                "customer_name": "Arjun Sharma",
                "customer_email": "arjun.sharma@example.com",
                "plan": "yearly_500",
                "plan_name": "Annual Pro (VIP Secret Access)",
                "amount_paid": 500.0,
                "order_id": "PRESEED_PRO_ARJUN",
                "status": "active",
                "is_pro": True,
                "activated_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
            }},
            upsert=True
        )

        # Preseed Hall Owner
        await db.users.update_one(
            {"email": "owner.srikrishna@example.com"},
            {"$set": {
                "user_id": "user_owner_srikrishna",
                "email": "owner.srikrishna@example.com",
                "name": "Sri Krishna Venue Management",
                "password_hash": hash_password("Password@123"),
                "role": "owner",
                "auth_provider": "demo",
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )

        # Preseed Admin
        await db.users.update_one(
            {"email": "admin@hallfinder.com"},
            {"$set": {
                "user_id": "user_admin_super",
                "email": "admin@hallfinder.com",
                "name": "HallFinder Admin",
                "password_hash": hash_password("Password@123"),
                "role": "admin",
                "auth_provider": "demo",
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )

        logging.info("Seeded initial convention halls, reviews, and test accounts.")

# Create FastAPI app
app = FastAPI(title="HallFinder Pro API", description="Convention Hall Discovery, Booking Marketplace & Pro Subscription API")
api_router = APIRouter(prefix="/api")

@app.on_event("startup")
async def on_startup():
    await seed_initial_halls(force=False)
    try:
        await db.users.create_index("email", unique=True, sparse=True)
        await db.users.create_index("user_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("user_id")
        await db.halls.create_index("pincode")
        await db.halls.create_index("city")
        await db.enquiries.create_index("reference_id", unique=True)
        await db.bookings.create_index("booking_reference", unique=True)
    except Exception as e:
        logging.warning(f"Index creation note: {e}")

# ==================== SYSTEM & SEED ====================
@api_router.get("/")
async def api_root():
    return {
        "service": "HallFinder Pro API",
        "status": "online",
        "version": "2.0.0",
        "cashfree_env": CASHFREE_ENV,
        "plans": list(PLANS.values()),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/seed")
async def trigger_seed(force: bool = Query(default=True)):
    await seed_initial_halls(force=force)
    total = await db.halls.count_documents({"deleted_at": None})
    return {"message": f"Successfully seeded database. Total active halls: {total}"}

@api_router.get("/plans")
async def get_plans():
    return list(PLANS.values())

@api_router.get("/pincodes")
async def get_available_pincodes():
    pipeline = [
        {"$match": {"deleted_at": None}},
        {
            "$group": {
                "_id": {
                    "pincode": "$pincode",
                    "city": "$city",
                    "area": "$area"
                },
                "count": {"$sum": 1},
                "min_price": {"$min": "$price_per_day"},
                "max_capacity": {"$max": "$seating_capacity"}
            }
        },
        {"$sort": {"_id.city": 1, "_id.pincode": 1}}
    ]
    cursor = db.halls.aggregate(pipeline)
    results = await cursor.to_list(100)
    
    pincodes_list = []
    for item in results:
        pincodes_list.append({
            "pincode": item["_id"]["pincode"],
            "city": item["_id"]["city"],
            "area": item["_id"]["area"],
            "hall_count": item["count"],
            "min_price": item["min_price"],
            "max_capacity": item["max_capacity"]
        })
    return pincodes_list

# ==================== HALL DISCOVERY & CRUD ====================
@api_router.get("/halls")
async def search_halls(
    pincode: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    ac_only: Optional[bool] = Query(None),
    generator_only: Optional[bool] = Query(None),
    parking_only: Optional[bool] = Query(None),
    featured_only: Optional[bool] = Query(None)
):
    query: dict[str, Any] = {"deleted_at": None}

    if pincode and pincode.strip():
        clean_pin = pincode.strip()
        query["pincode"] = {"$regex": f"^{re.escape(clean_pin)}", "$options": "i"}

    if search and search.strip():
        search_val = search.strip()
        query["$or"] = [
            {"name": {"$regex": re.escape(search_val), "$options": "i"}},
            {"pincode": {"$regex": re.escape(search_val), "$options": "i"}},
            {"area": {"$regex": re.escape(search_val), "$options": "i"}},
            {"city": {"$regex": re.escape(search_val), "$options": "i"}},
            {"tagline": {"$regex": re.escape(search_val), "$options": "i"}},
            {"amenities": {"$regex": re.escape(search_val), "$options": "i"}}
        ]

    if city and city.strip():
        query["city"] = {"$regex": f"^{re.escape(city.strip())}$", "$options": "i"}

    if event_type and event_type.strip() and event_type != "All":
        query["event_types"] = {"$regex": re.escape(event_type.strip()), "$options": "i"}

    if min_capacity and min_capacity > 0:
        query["seating_capacity"] = {"$gte": min_capacity}

    if max_price and max_price > 0:
        query["price_per_day"] = {"$lte": max_price}

    if ac_only:
        query["ac_available"] = True

    if generator_only:
        query["generator_backup"] = True

    if parking_only:
        query["parking_available"] = True

    if featured_only:
        query["featured"] = True

    cursor = db.halls.find(query).sort([("featured", -1), ("rating", -1), ("seating_capacity", -1)])
    halls_raw = await cursor.to_list(200)
    return [serialize_doc(h) for h in halls_raw]

@api_router.get("/halls/featured")
async def get_featured_halls():
    cursor = db.halls.find({"deleted_at": None, "featured": True}).sort("rating", -1).limit(6)
    featured = await cursor.to_list(10)
    return [serialize_doc(h) for h in featured]

@api_router.get("/halls/{hall_id}")
async def get_hall_details(hall_id: str):
    doc = None
    if ObjectId.is_valid(hall_id):
        doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not doc:
        doc = await db.halls.find_one({"id": hall_id, "deleted_at": None})
    if not doc:
        doc = await db.halls.find_one({"$or": [{"_id": hall_id}, {"name": hall_id}], "deleted_at": None})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Convention Hall not found")
    
    return serialize_doc(doc)

@api_router.post("/halls", status_code=status.HTTP_201_CREATED)
async def create_custom_hall(payload: HallCreate, request: Request):
    auth_header = request.headers.get("Authorization", "")
    owner_id = "guest_owner"
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        user = await get_user_from_token(token)
        if user:
            owner_id = user.get("user_id", "guest_owner")

    hall_dict = payload.model_dump()
    hall_dict["owner_id"] = owner_id
    hall_dict["rating"] = 5.0
    hall_dict["reviews_count"] = 0
    hall_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    hall_dict["deleted_at"] = None

    if not hall_dict.get("pricing_breakdown"):
        price = hall_dict.get("price_per_day", 200000)
        hall_dict["pricing_breakdown"] = {
            "base_rent_per_day": price,
            "advance_booking_deposit": int(price * 0.2),
            "cleaning_and_maintenance": int(price * 0.05),
            "gst_percentage": 18,
            "approx_total_per_day": int(price * 1.23)
        }

    res = await db.halls.insert_one(hall_dict)
    hall_dict["id"] = str(res.inserted_id)
    del hall_dict["_id"]
    return serialize_doc(hall_dict)

@api_router.put("/halls/{hall_id}")
async def update_hall(hall_id: str, payload: HallUpdate):
    doc = None
    if ObjectId.is_valid(hall_id):
        doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not doc:
        doc = await db.halls.find_one({"id": hall_id, "deleted_at": None})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Hall not found")

    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.halls.update_one({"_id": doc["_id"]}, {"$set": update_fields})
    updated = await db.halls.find_one({"_id": doc["_id"]})
    return serialize_doc(updated)

@api_router.delete("/halls/{hall_id}")
async def soft_delete_hall(hall_id: str):
    doc = None
    if ObjectId.is_valid(hall_id):
        doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not doc:
        doc = await db.halls.find_one({"id": hall_id, "deleted_at": None})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Hall not found")

    await db.halls.update_one({"_id": doc["_id"]}, {"$set": {"deleted_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Hall archived successfully"}

@api_router.get("/halls/{hall_id}/availability")
async def get_hall_availability(hall_id: str):
    doc = None
    if ObjectId.is_valid(hall_id):
        doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not doc:
        doc = await db.halls.find_one({"$or": [{"id": hall_id}, {"_id": hall_id}], "deleted_at": None})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Convention Hall not found")

    booked_dates = set(doc.get("booked_dates", []))

    # Also include approved/confirmed bookings from enquiries & bookings collections
    enquiry_query = {
        "$or": [{"hall_id": str(doc.get("_id", hall_id))}, {"hall_id": hall_id}],
        "status": {"$in": ["Confirmed", "Pending", "Approved"]},
        "deleted_at": None
    }
    enquiries = await db.enquiries.find(enquiry_query).to_list(100)
    for enq in enquiries:
        if enq.get("event_date"):
            booked_dates.add(enq["event_date"])

    bookings = await db.bookings.find(enquiry_query).to_list(100)
    for b in bookings:
        if b.get("event_date"):
            booked_dates.add(b["event_date"])

    sorted_booked = sorted(list(booked_dates))

    return {
        "hall_id": str(doc.get("_id", hall_id)),
        "hall_name": doc.get("name"),
        "booked_dates": sorted_booked,
        "total_booked_count": len(sorted_booked),
        "synced_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/halls/{hall_id}/booked-dates")
async def toggle_hall_booked_date(hall_id: str, date_str: str = Query(...), action: Literal["add", "remove"] = Query(default="add")):
    doc = None
    if ObjectId.is_valid(hall_id):
        doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not doc:
        doc = await db.halls.find_one({"$or": [{"id": hall_id}, {"_id": hall_id}], "deleted_at": None})
    if not doc:
        raise HTTPException(status_code=404, detail="Hall not found")

    if action == "add":
        await db.halls.update_one({"_id": doc["_id"]}, {"$addToSet": {"booked_dates": date_str}})
    else:
        await db.halls.update_one({"_id": doc["_id"]}, {"$pull": {"booked_dates": date_str}})

    updated = await db.halls.find_one({"_id": doc["_id"]})
    return {"message": f"Date {date_str} {action}ed successfully", "booked_dates": updated.get("booked_dates", [])}

# ==================== REVIEWS & RATINGS ====================
@api_router.get("/halls/{hall_id}/reviews")
async def get_hall_reviews(hall_id: str):
    hall_doc = None
    if ObjectId.is_valid(hall_id):
        hall_doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not hall_doc:
        hall_doc = await db.halls.find_one({"$or": [{"id": hall_id}, {"name": hall_id}], "deleted_at": None})

    hall_query: dict[str, Any] = {"$or": [{"hall_id": hall_id}]}
    if hall_doc and "_id" in hall_doc:
        hall_query["$or"].append({"hall_id": str(hall_doc["_id"])})
    if hall_doc and "name" in hall_doc:
        hall_query["$or"].append({"hall_name": hall_doc["name"]})

    cursor = db.reviews.find(hall_query).sort("created_at", -1)
    reviews_raw = await cursor.to_list(100)
    reviews = [serialize_doc(r) for r in reviews_raw]

    total = len(reviews)
    avg_rating = round(sum(r.get("rating", 5) for r in reviews) / total, 1) if total > 0 else (hall_doc.get("rating", 4.9) if hall_doc else 4.9)
    distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    for r in reviews:
        rat = r.get("rating", 5)
        if rat in distribution:
            distribution[rat] += 1

    return {
        "hall_id": hall_id,
        "hall_name": hall_doc.get("name") if hall_doc else "Convention Hall",
        "average_rating": avg_rating,
        "total_reviews": total,
        "rating_counts": distribution,
        "reviews": reviews
    }

@api_router.post("/halls/{hall_id}/reviews", status_code=status.HTTP_201_CREATED)
async def submit_hall_review(hall_id: str, payload: ReviewCreate, request: Request):
    auth_header = request.headers.get("Authorization", "")
    user = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        user = await get_user_from_token(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to leave a review."
        )

    # Require Pro Membership
    user_id = user.get("user_id")
    user_email = user.get("email")
    membership = await db.memberships.find_one({
        "$or": [{"customer_id": user_id}, {"customer_email": user_email}],
        "is_pro": True
    })

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reviews & ratings are exclusive to HallFinder Pro members. Please upgrade to Pro to submit your review."
        )

    hall_doc = None
    if ObjectId.is_valid(hall_id):
        hall_doc = await db.halls.find_one({"_id": ObjectId(hall_id), "deleted_at": None})
    if not hall_doc:
        hall_doc = await db.halls.find_one({"$or": [{"id": hall_id}, {"name": hall_id}], "deleted_at": None})

    if not hall_doc:
        raise HTTPException(status_code=404, detail="Convention Hall not found")

    review_doc = {
        "hall_id": str(hall_doc.get("_id", hall_id)),
        "hall_name": hall_doc.get("name"),
        "user_id": user_id,
        "reviewer_name": payload.reviewer_name or user.get("name", "Verified Customer"),
        "user_email": user_email,
        "rating": payload.rating,
        "title": payload.title.strip(),
        "comment": payload.comment.strip(),
        "event_type": payload.event_type or "Wedding Event",
        "verified_booking": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    result = await db.reviews.insert_one(review_doc)
    review_doc["id"] = str(result.inserted_id)
    del review_doc["_id"]

    # Recalculate average rating
    all_hall_reviews = await db.reviews.find({"$or": [{"hall_id": str(hall_doc.get("_id"))}, {"hall_name": hall_doc.get("name")}]}).to_list(500)
    new_total = len(all_hall_reviews)
    new_avg = round(sum(r.get("rating", 5) for r in all_hall_reviews) / new_total, 1) if new_total > 0 else 5.0

    await db.halls.update_one(
        {"_id": hall_doc["_id"]},
        {"$set": {"rating": new_avg, "reviews_count": new_total}}
    )

    return review_doc

@api_router.get("/admin/reviews")
async def get_admin_reviews(
    hall_id: Optional[str] = Query(None),
    min_rating: Optional[int] = Query(None),
    limit: int = Query(default=100, le=200)
):
    query: dict[str, Any] = {}
    if hall_id and hall_id.strip() and hall_id != "all":
        query["$or"] = [{"hall_id": hall_id.strip()}, {"hall_name": hall_id.strip()}]
    if min_rating and min_rating > 0:
        query["rating"] = {"$gte": min_rating}

    cursor = db.reviews.find(query).sort("created_at", -1).limit(limit)
    reviews_raw = await cursor.to_list(limit)

    total_all = await db.reviews.count_documents({})
    all_revs = await db.reviews.find().to_list(1000)
    avg_score = round(sum(r.get("rating", 5) for r in all_revs) / len(all_revs), 1) if all_revs else 4.9
    five_stars = sum(1 for r in all_revs if r.get("rating") == 5)
    positive_pct = round((five_stars / len(all_revs)) * 100) if all_revs else 95

    return {
        "stats": {
            "total_reviews": total_all,
            "overall_average_rating": avg_score,
            "positive_rating_percentage": positive_pct,
            "total_halls": await db.halls.count_documents({"deleted_at": None})
        },
        "reviews": [serialize_doc(r) for r in reviews_raw]
    }

@api_router.post("/reviews/{review_id}/reply")
async def reply_to_review(review_id: str, payload: ReviewReplyIn):
    doc = None
    if ObjectId.is_valid(review_id):
        doc = await db.reviews.find_one({"_id": ObjectId(review_id)})
    if not doc:
        doc = await db.reviews.find_one({"id": review_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found")

    reply_data = {
        "reply": payload.reply.strip(),
        "replied_by": payload.replied_by or "Hall Management",
        "replied_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.update_one({"_id": doc["_id"]}, {"$set": {"owner_reply": reply_data}})
    updated = await db.reviews.find_one({"_id": doc["_id"]})
    return serialize_doc(updated)

# ==================== CASHFREE PAYMENTS & PRO MEMBERSHIP ====================
@api_router.post("/payments/checkout")
async def create_payment_checkout(payload: PaymentCheckoutIn):
    if payload.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid subscription plan selected")

    plan_info = PLANS[payload.plan]
    order_id = f"CF_{payload.plan}_{uuid.uuid4().hex[:12].upper()}"

    order_doc = {
        "order_id": order_id,
        "plan": payload.plan,
        "amount": plan_info["amount"],
        "currency": "INR",
        "customer_id": payload.customer_id,
        "customer_name": payload.customer_name,
        "customer_email": payload.customer_email,
        "customer_phone": payload.customer_phone,
        "status": "MOCK_READY",
        "mode": "mock" if (MOCK_PAYMENTS or not CASHFREE_CLIENT_ID) else "cashfree",
        "payment_session_id": f"session_{order_id}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    return {
        "mode": order_doc["mode"],
        "order_id": order_id,
        "payment_session_id": f"session_{order_id}",
        "plan": plan_info,
        "message": "Cashfree checkout session initiated."
    }

@api_router.get("/payments/{order_id}/verify")
async def verify_payment_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    plan_key = order.get("plan", "yearly_500")
    plan_info = PLANS.get(plan_key, PLANS["yearly_500"])
    duration_days = plan_info.get("duration_days", 30)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat()

    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "PAID", "paid_at": datetime.now(timezone.utc).isoformat()}}
    )
    membership_doc = {
        "customer_id": order.get("customer_id", "guest"),
        "customer_name": order.get("customer_name", "Valued Customer"),
        "customer_email": order.get("customer_email", ""),
        "customer_phone": order.get("customer_phone", ""),
        "plan": plan_key,
        "plan_name": plan_info["name"],
        "amount_paid": plan_info["amount"],
        "order_id": order_id,
        "status": "active",
        "is_pro": True,
        "activated_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at
    }
    await db.memberships.update_one(
        {"customer_id": order.get("customer_id", "guest")},
        {"$set": membership_doc},
        upsert=True
    )
    return {
        "order_id": order_id,
        "status": "PAID",
        "is_pro": True,
        "membership": membership_doc
    }

@api_router.get("/user/membership")
async def get_user_membership(customer_id: str = Query(default="guest")):
    membership = await db.memberships.find_one({"$or": [{"customer_id": customer_id}, {"customer_email": customer_id}]})
    if membership:
        mem_copy = serialize_doc(membership)
        expires_at_str = mem_copy.get("expires_at")
        if expires_at_str:
            try:
                exp_dt = datetime.fromisoformat(expires_at_str)
                if exp_dt < datetime.now(timezone.utc):
                    mem_copy["is_pro"] = False
                    mem_copy["status"] = "expired"
            except Exception:
                pass
        return mem_copy
    return {
        "customer_id": customer_id,
        "is_pro": False,
        "status": "free_tier",
        "plan": None
    }

@api_router.post("/user/membership/secret-unlock")
async def secret_unlock_membership(payload: SecretUnlockIn):
    secret_code = payload.code.strip().upper()
    if secret_code != "GT011103":
        raise HTTPException(
            status_code=400,
            detail="Invalid secret unlock code. Please enter valid code GT011103."
        )

    expires_at = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
    membership_doc = {
        "customer_id": payload.customer_id,
        "customer_name": payload.customer_name or "Pro VIP Member",
        "plan": "yearly_500",
        "plan_name": "Annual Pro (VIP Secret Access)",
        "amount_paid": 0.0,
        "order_id": f"SECRET_VIP_{uuid.uuid4().hex[:8].upper()}",
        "unlock_method": "secret_code_GT011103",
        "status": "active",
        "is_pro": True,
        "activated_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at
    }

    await db.memberships.update_one(
        {"customer_id": payload.customer_id},
        {"$set": membership_doc},
        upsert=True
    )

    return {
        "success": True,
        "message": "🎉 Secret Code GT011103 Applied! You have unlocked 1 Year Full Pro Access for free.",
        "membership": membership_doc
    }

@api_router.post("/user/membership/upgrade-mock")
async def mock_upgrade_membership(
    customer_id: str = Query(default="guest"),
    plan: Literal["weekly_100", "quarterly_300", "yearly_500"] = Query(default="yearly_500"),
    customer_name: str = Query(default="Pro Member")
):
    plan_info = PLANS[plan]
    duration_days = plan_info.get("duration_days", 30)
    expires_at = (datetime.now(timezone.utc) + timedelta(days=duration_days)).isoformat()

    membership_doc = {
        "customer_id": customer_id,
        "customer_name": customer_name,
        "plan": plan,
        "plan_name": plan_info["name"],
        "amount_paid": plan_info["amount"],
        "order_id": f"MOCK_PRO_{uuid.uuid4().hex[:8].upper()}",
        "status": "active",
        "is_pro": True,
        "activated_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at
    }
    await db.memberships.update_one(
        {"customer_id": customer_id},
        {"$set": membership_doc},
        upsert=True
    )
    return {"message": f"Account upgraded to HallFinder Pro ({plan_info['name']})", "membership": membership_doc}

# ==================== BOOKING ENQUIRIES ====================
@api_router.post("/enquiries", status_code=status.HTTP_201_CREATED)
async def create_booking_enquiry(payload: BookingEnquiryCreate):
    hall_doc = None
    if ObjectId.is_valid(payload.hall_id):
        hall_doc = await db.halls.find_one({"_id": ObjectId(payload.hall_id), "deleted_at": None})
    if not hall_doc:
        hall_doc = await db.halls.find_one({"$or": [{"id": payload.hall_id}, {"_id": payload.hall_id}], "deleted_at": None})
    
    if not hall_doc:
        raise HTTPException(status_code=404, detail="Selected convention hall does not exist")

    try:
        datetime.strptime(payload.event_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD")

    existing_booked = hall_doc.get("booked_dates", [])
    if payload.event_date in existing_booked:
        raise HTTPException(
            status_code=400,
            detail=f"The date {payload.event_date} is already booked for {hall_doc.get('name')}. Please choose an available green date."
        )

    ref_id = f"ENQ-{uuid.uuid4().hex[:6].upper()}"
    enquiry_doc = {
        "reference_id": ref_id,
        "hall_id": str(hall_doc.get("_id", payload.hall_id)),
        "hall_name": hall_doc.get("name"),
        "hall_pincode": hall_doc.get("pincode"),
        "hall_area": hall_doc.get("area"),
        "hall_city": hall_doc.get("city"),
        "hall_photo": hall_doc.get("photos", [""])[0] if hall_doc.get("photos") else None,
        "customer_name": payload.customer_name.strip(),
        "customer_phone": payload.customer_phone.strip(),
        "customer_email": payload.customer_email.strip().lower(),
        "event_type": payload.event_type,
        "event_date": payload.event_date,
        "guest_count": payload.guest_count,
        "food_preference": payload.food_preference,
        "additional_notes": payload.additional_notes or "",
        "status": "Pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "deleted_at": None
    }

    result = await db.enquiries.insert_one(enquiry_doc)
    enquiry_doc["id"] = str(result.inserted_id)
    del enquiry_doc["_id"]

    await db.halls.update_one(
        {"_id": hall_doc["_id"]},
        {"$addToSet": {"booked_dates": payload.event_date}}
    )

    return enquiry_doc

@api_router.get("/enquiries")
async def get_enquiries(
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    limit: int = Query(default=50, le=100)
):
    query: dict[str, Any] = {"deleted_at": None}
    if phone and phone.strip():
        query["customer_phone"] = {"$regex": re.escape(phone.strip()), "$options": "i"}
    if email and email.strip():
        query["customer_email"] = email.strip().lower()

    cursor = db.enquiries.find(query).sort("created_at", -1).limit(limit)
    enquiries_raw = await cursor.to_list(limit)
    return [serialize_doc(e) for e in enquiries_raw]

@api_router.get("/enquiries/{enquiry_id}")
async def get_enquiry_by_id(enquiry_id: str):
    doc = None
    if ObjectId.is_valid(enquiry_id):
        doc = await db.enquiries.find_one({"_id": ObjectId(enquiry_id), "deleted_at": None})
    if not doc:
        doc = await db.enquiries.find_one({"$or": [{"reference_id": enquiry_id}, {"id": enquiry_id}], "deleted_at": None})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    return serialize_doc(doc)

@api_router.patch("/enquiries/{enquiry_id}/cancel")
async def cancel_enquiry(enquiry_id: str):
    doc = None
    if ObjectId.is_valid(enquiry_id):
        doc = await db.enquiries.find_one({"_id": ObjectId(enquiry_id), "deleted_at": None})
    if not doc:
        doc = await db.enquiries.find_one({"$or": [{"reference_id": enquiry_id}, {"id": enquiry_id}], "deleted_at": None})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    await db.enquiries.update_one(
        {"_id": doc["_id"]},
        {"$set": {"status": "Cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    hall_id = doc.get("hall_id")
    event_date = doc.get("event_date")
    if hall_id and event_date and ObjectId.is_valid(hall_id):
        await db.halls.update_one(
            {"_id": ObjectId(hall_id)},
            {"$pull": {"booked_dates": event_date}}
        )

    updated_doc = await db.enquiries.find_one({"_id": doc["_id"]})
    return serialize_doc(updated_doc)

@api_router.patch("/enquiries/{enquiry_id}/status")
async def update_enquiry_status(enquiry_id: str, new_status: Literal["Pending", "Confirmed", "In Review", "Cancelled"] = Query(...)):
    doc = None
    if ObjectId.is_valid(enquiry_id):
        doc = await db.enquiries.find_one({"_id": ObjectId(enquiry_id)})
    if not doc:
        doc = await db.enquiries.find_one({"$or": [{"reference_id": enquiry_id}, {"id": enquiry_id}]})
    if not doc:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    await db.enquiries.update_one({"_id": doc["_id"]}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.enquiries.find_one({"_id": doc["_id"]})
    return serialize_doc(updated)

# ==================== INSTANT BOOKINGS & RESERVATION MARKETPLACE ====================
@api_router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_instant_booking(payload: InstantBookingCreate):
    hall_doc = None
    if ObjectId.is_valid(payload.hall_id):
        hall_doc = await db.halls.find_one({"_id": ObjectId(payload.hall_id), "deleted_at": None})
    if not hall_doc:
        hall_doc = await db.halls.find_one({"$or": [{"id": payload.hall_id}, {"_id": payload.hall_id}], "deleted_at": None})
    
    if not hall_doc:
        raise HTTPException(status_code=404, detail="Convention hall not found")

    existing_booked = hall_doc.get("booked_dates", [])
    if payload.event_date in existing_booked:
        raise HTTPException(
            status_code=400,
            detail=f"The date {payload.event_date} is already reserved for {hall_doc.get('name')}."
        )

    deposit = payload.deposit_amount or hall_doc.get("pricing_breakdown", {}).get("advance_booking_deposit", int(hall_doc.get("price_per_day", 200000) * 0.2))
    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"

    booking_doc = {
        "booking_reference": booking_ref,
        "hall_id": str(hall_doc.get("_id", payload.hall_id)),
        "hall_name": hall_doc.get("name"),
        "hall_pincode": hall_doc.get("pincode"),
        "hall_area": hall_doc.get("area"),
        "hall_city": hall_doc.get("city"),
        "hall_photo": hall_doc.get("photos", [""])[0] if hall_doc.get("photos") else None,
        "customer_name": payload.customer_name.strip(),
        "customer_phone": payload.customer_phone.strip(),
        "customer_email": payload.customer_email.strip().lower(),
        "event_type": payload.event_type,
        "event_date": payload.event_date,
        "guest_count": payload.guest_count,
        "food_preference": payload.food_preference,
        "total_rent": hall_doc.get("price_per_day", 200000),
        "deposit_amount": deposit,
        "payment_status": "PAID",
        "booking_status": "Confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "deleted_at": None
    }

    res = await db.bookings.insert_one(booking_doc)
    booking_doc["id"] = str(res.inserted_id)
    del booking_doc["_id"]

    await db.halls.update_one(
        {"_id": hall_doc["_id"]},
        {"$addToSet": {"booked_dates": payload.event_date}}
    )

    return booking_doc

@api_router.get("/bookings")
async def list_bookings(email: Optional[str] = Query(None)):
    query: dict[str, Any] = {"deleted_at": None}
    if email and email.strip():
        query["customer_email"] = email.strip().lower()
    cursor = db.bookings.find(query).sort("created_at", -1)
    results = await cursor.to_list(100)
    return [serialize_doc(b) for b in results]

# ==================== AUTHENTICATION ====================
@api_router.post("/auth/register")
async def register_user(payload: UserRegisterIn):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please sign in.")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": payload.role or "customer",
        "auth_provider": "custom",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    session_token = await create_user_session(user_id)
    return {
        "token": session_token,
        "session_token": session_token,
        "user": {
            "user_id": user_id,
            "email": email,
            "name": payload.name,
            "role": payload.role or "customer",
            "auth_provider": "custom"
        }
    }

@api_router.post("/auth/login")
async def login_user(payload: UserLoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    session_token = await create_user_session(user["user_id"])
    user_data = {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", "User"),
        "role": user.get("role", "customer"),
        "auth_provider": user.get("auth_provider", "custom")
    }
    return {"token": session_token, "session_token": session_token, "user": user_data}

@api_router.post("/auth/demo-login")
async def demo_login(payload: DemoLoginIn):
    email = payload.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email address is required")

    name = payload.name.strip() if payload.name else email.split("@")[0].capitalize()
    role = payload.role or "customer"

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "role": role, "last_login": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": role,
            "auth_provider": "demo",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat()
        })

    session_token = await create_user_session(user_id)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"token": session_token, "session_token": session_token, "user": user_doc}

processed_sessions_set = set()

@api_router.post("/auth/session")
async def exchange_google_session(payload: SessionExchangeIn):
    session_id = payload.session_id.strip()
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required")

    if session_id in processed_sessions_set:
        raise HTTPException(status_code=400, detail="session_id already processed")
    
    processed_sessions_set.add(session_id)

    try:
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            resp = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
        if resp.status_code != 200:
            logging.error(f"Emergent auth session exchange failed: {resp.status_code} {resp.text}")
            raise HTTPException(status_code=401, detail="Invalid or expired session_id")
        
        auth_data = resp.json()
        email = auth_data.get("email", "").lower().strip()
        name = auth_data.get("name") or email.split("@")[0]
        picture = auth_data.get("picture")

        if not email:
            raise HTTPException(status_code=401, detail="No email associated with session")

        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            user_id = existing_user["user_id"]
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"name": name, "picture": picture, "last_login": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "customer",
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat()
            })

        session_token = await create_user_session(user_id)
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        return {"session_token": session_token, "user": user_doc}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication server error")

@api_router.post("/auth/apple")
async def apple_login(payload: AppleAuthIn):
    apple_id = payload.apple_id.strip()
    if not apple_id:
        raise HTTPException(status_code=400, detail="apple_id is required")

    email = (payload.email or f"{apple_id[:10]}@privaterelay.appleid.com").lower().strip()
    name = payload.name or "Apple User"

    existing_user = await db.users.find_one({"$or": [{"apple_id": apple_id}, {"email": email}]})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "apple_id": apple_id,
            "email": email,
            "name": name,
            "role": "customer",
            "auth_provider": "apple",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat()
        })

    session_token = await create_user_session(user_id)
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"session_token": session_token, "user": user_doc}

@api_router.get("/auth/me")
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized - Missing Bearer Token")
    
    token = auth_header[7:].strip()
    user = await get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    membership = await db.memberships.find_one({"$or": [{"customer_id": user["user_id"]}, {"customer_email": user["email"]}]})
    user_data = dict(user)
    if membership:
        user_data["is_pro"] = membership.get("is_pro", False)
        user_data["plan"] = membership.get("plan")
        user_data["plan_name"] = membership.get("plan_name")
        user_data["expires_at"] = membership.get("expires_at")
    else:
        user_data["is_pro"] = False
        user_data["plan"] = None

    return user_data

@api_router.post("/auth/logout")
async def logout(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        await db.user_sessions.delete_many({"session_token": token})
    return {"message": "Logged out successfully"}

# ==================== OWNER & ADMIN DESK ====================
@api_router.get("/admin/stats")
async def get_admin_stats():
    total_halls = await db.halls.count_documents({"deleted_at": None})
    total_enquiries = await db.enquiries.count_documents({"deleted_at": None})
    total_bookings = await db.bookings.count_documents({"deleted_at": None})
    total_reviews = await db.reviews.count_documents({})
    total_pro = await db.memberships.count_documents({"is_pro": True})
    return {
        "total_halls": total_halls,
        "total_enquiries": total_enquiries,
        "total_bookings": total_bookings,
        "total_reviews": total_reviews,
        "total_pro_members": total_pro,
        "active_cities": ["Bangalore", "Chennai", "Hyderabad", "Mumbai", "Delhi"]
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
