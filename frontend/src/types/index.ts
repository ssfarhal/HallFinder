export interface PricingBreakdown {
  base_rent_per_day: number;
  advance_booking_deposit: number;
  cleaning_and_maintenance: number;
  gst_percentage: number;
  approx_total_per_day: number;
}

export interface Hall {
  id: string;
  name: string;
  tagline: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  full_address: string;
  google_maps_url?: string;
  description: string;
  price_per_day: number;
  pricing_breakdown?: PricingBreakdown;
  seating_capacity: number;
  food_capacity: number;
  parking_capacity: string;
  parking_available: boolean;
  generator_backup: boolean;
  generator_details: string;
  ac_available: boolean;
  rooms_count: number;
  catering_policy: string;
  amenities: string[];
  photos: string[];
  rating: number;
  reviews_count: number;
  contact_phone: string;
  manager_phone?: string;
  whatsapp_number?: string;
  contact_email: string;
  event_types: string[];
  booked_dates: string[];
  featured: boolean;
  owner_id?: string;
}

export interface BookingEnquiry {
  id: string;
  reference_id: string;
  hall_id: string;
  hall_name: string;
  hall_pincode: string;
  hall_area: string;
  hall_city: string;
  hall_photo?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  food_preference: string;
  additional_notes?: string;
  status: "Pending" | "Confirmed" | "In Review" | "Cancelled";
  created_at: string;
}

export interface InstantBooking {
  id: string;
  booking_reference: string;
  hall_id: string;
  hall_name: string;
  hall_pincode: string;
  hall_area: string;
  hall_city: string;
  hall_photo?: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  food_preference: string;
  total_rent: number;
  deposit_amount: number;
  payment_status: "PAID" | "PENDING";
  booking_status: "Confirmed" | "Pending" | "Cancelled";
  created_at: string;
}

export interface BookingEnquiryPayload {
  hall_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  food_preference?: string;
  additional_notes?: string;
}

export interface InstantBookingPayload {
  hall_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  deposit_amount?: number;
  food_preference?: string;
  additional_notes?: string;
}

export interface AvailabilityData {
  hall_id: string;
  hall_name: string;
  booked_dates: string[];
  total_booked_count: number;
  synced_at: string;
}

export interface PincodeInfo {
  pincode: string;
  city: string;
  area: string;
  hall_count: number;
  min_price: number;
  max_capacity: number;
}

export interface SearchFilters {
  pincode?: string;
  search?: string;
  city?: string;
  event_type?: string;
  min_capacity?: number;
  max_price?: number;
  ac_only?: boolean;
  generator_only?: boolean;
  parking_only?: boolean;
  featured_only?: boolean;
}

export interface ProPlan {
  id: "quarterly_300" | "yearly_500";
  name: string;
  amount: number;
  currency: string;
  duration_months: number;
  description: string;
}

export interface UserMembership {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  plan?: "quarterly_300" | "yearly_500";
  plan_name?: string;
  amount_paid?: number;
  order_id?: string;
  status: "active" | "expired" | "free_tier";
  is_pro: boolean;
  activated_at?: string;
  expires_at?: string;
}

export interface PaymentCheckoutPayload {
  plan: "quarterly_300" | "yearly_500";
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export interface CheckoutResponse {
  mode: "cashfree" | "mock";
  order_id: string;
  payment_session_id?: string;
  plan: ProPlan;
  message?: string;
}

export interface AuthUser {
  user_id: string;
  email: string;
  name: string;
  role?: "customer" | "owner" | "admin";
  picture?: string;
  auth_provider: "google" | "apple" | "demo" | "custom";
  is_pro?: boolean;
  plan?: string;
  plan_name?: string;
  expires_at?: string;
  created_at?: string;
}

export interface AuthSessionResponse {
  session_token: string;
  user: AuthUser;
}

export interface HallReview {
  id: string;
  hall_id: string;
  hall_name: string;
  user_id: string;
  reviewer_name: string;
  user_email?: string;
  rating: number;
  title: string;
  comment: string;
  event_type?: string;
  verified_booking: boolean;
  owner_reply?: {
    reply: string;
    replied_by: string;
    replied_at: string;
  };
  created_at: string;
}

export interface ReviewSummaryData {
  hall_id: string;
  hall_name: string;
  average_rating: number;
  total_reviews: number;
  rating_counts: Record<number, number>;
  reviews: HallReview[];
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  comment: string;
  event_type?: string;
  reviewer_name?: string;
}

export interface AdminReviewsData {
  stats: {
    total_reviews: number;
    overall_average_rating: number;
    positive_rating_percentage: number;
    total_halls: number;
  };
  reviews: HallReview[];
}

export interface AdminStatsData {
  total_halls: number;
  total_enquiries: number;
  total_bookings: number;
  total_reviews: number;
  total_pro_members: number;
  active_cities: string[];
}
