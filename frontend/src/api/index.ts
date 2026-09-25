import {
  Hall,
  BookingEnquiry,
  BookingEnquiryPayload,
  InstantBooking,
  InstantBookingPayload,
  AvailabilityData,
  PincodeInfo,
  SearchFilters,
  ProPlan,
  UserMembership,
  PaymentCheckoutPayload,
  CheckoutResponse,
  AuthUser,
  AuthSessionResponse,
  HallReview,
  ReviewSummaryData,
  CreateReviewPayload,
  AdminReviewsData,
  AdminStatsData,
} from "../types";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_BACKEND_URL ||
  "";
const API_BASE = `${BACKEND_URL}/api`;

let inMemoryToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  inMemoryToken = token;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (inMemoryToken) {
    headers["Authorization"] = `Bearer ${inMemoryToken}`;
  }
  return headers;
}

// ==================== HALL DISCOVERY ====================
export async function fetchHalls(filters: SearchFilters = {}): Promise<Hall[]> {
  const params = new URLSearchParams();
  if (filters.pincode && filters.pincode.trim()) {
    params.append("pincode", filters.pincode.trim());
  }
  if (filters.search && filters.search.trim()) {
    params.append("search", filters.search.trim());
  }
  if (filters.city && filters.city.trim()) {
    params.append("city", filters.city.trim());
  }
  if (filters.event_type && filters.event_type !== "All") {
    params.append("event_type", filters.event_type);
  }
  if (filters.min_capacity) {
    params.append("min_capacity", String(filters.min_capacity));
  }
  if (filters.max_price) {
    params.append("max_price", String(filters.max_price));
  }
  if (filters.ac_only) {
    params.append("ac_only", "true");
  }
  if (filters.generator_only) {
    params.append("generator_only", "true");
  }
  if (filters.parking_only) {
    params.append("parking_only", "true");
  }
  if (filters.featured_only) {
    params.append("featured_only", "true");
  }

  const queryString = params.toString();
  const url = `${API_BASE}/halls${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url);
  return handleResponse<Hall[]>(res);
}

export async function fetchFeaturedHalls(): Promise<Hall[]> {
  const res = await fetch(`${API_BASE}/halls/featured`);
  return handleResponse<Hall[]>(res);
}

export async function fetchHallById(hallId: string): Promise<Hall> {
  const res = await fetch(`${API_BASE}/halls/${hallId}`);
  return handleResponse<Hall>(res);
}

export async function createHall(payload: Partial<Hall>): Promise<Hall> {
  const res = await fetch(`${API_BASE}/halls`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Hall>(res);
}

export async function updateHall(hallId: string, payload: Partial<Hall>): Promise<Hall> {
  const res = await fetch(`${API_BASE}/halls/${hallId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Hall>(res);
}

export async function deleteHall(hallId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/halls/${hallId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(res);
}

export async function fetchHallAvailability(hallId: string): Promise<AvailabilityData> {
  const res = await fetch(`${API_BASE}/halls/${hallId}/availability`);
  return handleResponse<AvailabilityData>(res);
}

export async function toggleBookedDate(hallId: string, dateStr: string, action: "add" | "remove"): Promise<{ message: string; booked_dates: string[] }> {
  const res = await fetch(`${API_BASE}/halls/${hallId}/booked-dates?date_str=${encodeURIComponent(dateStr)}&action=${action}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string; booked_dates: string[] }>(res);
}

export async function fetchPincodes(): Promise<PincodeInfo[]> {
  const res = await fetch(`${API_BASE}/pincodes`);
  return handleResponse<PincodeInfo[]>(res);
}

// ==================== ENQUIRIES ====================
export async function createBookingEnquiry(payload: BookingEnquiryPayload): Promise<BookingEnquiry> {
  const res = await fetch(`${API_BASE}/enquiries`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<BookingEnquiry>(res);
}

export async function fetchEnquiries(phone?: string, email?: string): Promise<BookingEnquiry[]> {
  const params = new URLSearchParams();
  if (phone) params.append("phone", phone);
  if (email) params.append("email", email);
  const queryString = params.toString();
  const url = `${API_BASE}/enquiries${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse<BookingEnquiry[]>(res);
}

export async function fetchEnquiryById(enquiryId: string): Promise<BookingEnquiry> {
  const res = await fetch(`${API_BASE}/enquiries/${enquiryId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<BookingEnquiry>(res);
}

export async function cancelBookingEnquiry(enquiryId: string): Promise<BookingEnquiry> {
  const res = await fetch(`${API_BASE}/enquiries/${enquiryId}/cancel`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return handleResponse<BookingEnquiry>(res);
}

export async function updateEnquiryStatus(enquiryId: string, newStatus: string): Promise<BookingEnquiry> {
  const res = await fetch(`${API_BASE}/enquiries/${enquiryId}/status?new_status=${encodeURIComponent(newStatus)}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  return handleResponse<BookingEnquiry>(res);
}

// ==================== INSTANT BOOKINGS ====================
export async function createInstantBooking(payload: InstantBookingPayload): Promise<InstantBooking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<InstantBooking>(res);
}

export async function fetchBookings(email?: string): Promise<InstantBooking[]> {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  const queryString = params.toString();
  const url = `${API_BASE}/bookings${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse<InstantBooking[]>(res);
}

// ==================== CASHFREE PAYMENTS & PRO MEMBERSHIP ====================
export async function fetchPlans(): Promise<ProPlan[]> {
  const res = await fetch(`${API_BASE}/plans`);
  return handleResponse<ProPlan[]>(res);
}

export async function createPaymentCheckout(payload: PaymentCheckoutPayload): Promise<CheckoutResponse> {
  const res = await fetch(`${API_BASE}/payments/checkout`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<CheckoutResponse>(res);
}

export async function verifyPayment(orderId: string): Promise<{ order_id: string; status: string; is_pro: boolean; membership: UserMembership }> {
  const res = await fetch(`${API_BASE}/payments/${orderId}/verify`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<{ order_id: string; status: string; is_pro: boolean; membership: UserMembership }>(res);
}

export async function fetchUserMembership(customerId: string): Promise<UserMembership> {
  const res = await fetch(`${API_BASE}/user/membership?customer_id=${encodeURIComponent(customerId)}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<UserMembership>(res);
}

export async function mockUpgradeMembership(customerId: string, plan: "weekly_100" | "quarterly_300" | "yearly_500", customerName: string = "Pro Member"): Promise<{ message: string; membership: UserMembership }> {
  const res = await fetch(`${API_BASE}/user/membership/upgrade-mock?customer_id=${encodeURIComponent(customerId)}&plan=${plan}&customer_name=${encodeURIComponent(customerName)}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string; membership: UserMembership }>(res);
}

export async function secretUnlockMembership(customerId: string, code: string, customerName?: string): Promise<{ success: boolean; message: string; membership: UserMembership }> {
  const res = await fetch(`${API_BASE}/user/membership/secret-unlock`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      customer_id: customerId,
      code: code.trim(),
      customer_name: customerName || "VIP Pro Member",
    }),
  });
  return handleResponse<{ success: boolean; message: string; membership: UserMembership }>(res);
}

// ==================== AUTHENTICATION ====================
export async function registerUserApi(email: string, password: string, name: string, role: string = "customer"): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password, name: name.trim(), role }),
  });
  return handleResponse<AuthSessionResponse>(res);
}

export async function loginUserApi(email: string, password: string): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  return handleResponse<AuthSessionResponse>(res);
}

export async function exchangeGoogleSession(sessionId: string): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return handleResponse<AuthSessionResponse>(res);
}

export async function loginWithAppleApi(appleId: string, name?: string, email?: string): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/auth/apple`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apple_id: appleId,
      name: name || "Apple User",
      email: email,
    }),
  });
  return handleResponse<AuthSessionResponse>(res);
}

export async function loginWithDemoApi(email: string, name?: string, role: string = "customer"): Promise<AuthSessionResponse> {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      name: name ? name.trim() : undefined,
      role: role,
    }),
  });
  return handleResponse<AuthSessionResponse>(res);
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<AuthUser>(res);
}

export async function logoutApi(token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<{ message: string }>(res);
}

// ==================== REVIEWS APIs ====================
export async function fetchHallReviews(hallId: string): Promise<ReviewSummaryData> {
  const res = await fetch(`${API_BASE}/halls/${hallId}/reviews`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ReviewSummaryData>(res);
}

export async function submitHallReview(hallId: string, payload: CreateReviewPayload): Promise<HallReview> {
  const res = await fetch(`${API_BASE}/halls/${hallId}/reviews`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<HallReview>(res);
}

export async function fetchAdminReviews(hallId?: string, minRating?: number): Promise<AdminReviewsData> {
  const params = new URLSearchParams();
  if (hallId && hallId !== "all") params.append("hall_id", hallId);
  if (minRating) params.append("min_rating", String(minRating));
  const queryString = params.toString();
  const url = `${API_BASE}/admin/reviews${queryString ? `?${queryString}` : ""}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AdminReviewsData>(res);
}

export async function replyToReviewApi(reviewId: string, reply: string, repliedBy?: string): Promise<HallReview> {
  const res = await fetch(`${API_BASE}/reviews/${reviewId}/reply`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reply, replied_by: repliedBy }),
  });
  return handleResponse<HallReview>(res);
}

export async function fetchAdminStats(): Promise<AdminStatsData> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AdminStatsData>(res);
}
