/**
 * Dayflow API Client
 * Reads VITE_API_BASE_URL from environment. Sends JSON + Bearer token.
 * Handles 401 (session expired), 403 (forbidden), and server errors.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

/** Get stored auth token */
const getToken = () => localStorage.getItem("dayflow_token");

/** Get stored user object */
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("dayflow_user"));
  } catch {
    return null;
  }
};

/** Persist auth session */
export const storeSession = (token, user) => {
  localStorage.setItem("dayflow_token", token);
  localStorage.setItem("dayflow_user", JSON.stringify(user));
};

/** Clear auth session */
export const clearSession = () => {
  localStorage.removeItem("dayflow_token");
  localStorage.removeItem("dayflow_user");
};

/**
 * Core API request function.
 * @param {"GET"|"POST"|"PUT"|"DELETE"} method
 * @param {string} endpoint — path after /api, e.g. "/auth/login"
 * @param {object|null} body
 * @returns {Promise<{data?: any, error?: string, status?: number}>}
 */
export async function apiCall(method, endpoint, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body !== null && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const contentType = res.headers.get("content-type") || "";

    let data = null;
    if (contentType.includes("application/json")) {
      data = await res.json();
    }

    if (res.status === 401) {
      clearSession();
      return { error: "Session expired. Please sign in again.", status: 401 };
    }

    if (res.status === 403) {
      return { error: data?.error || "You don't have permission for this action.", status: 403 };
    }

    if (res.status === 409) {
      return { error: data?.error || "This action conflicts with an existing record.", status: 409 };
    }

    if (!res.ok) {
      return { error: data?.error || `Request failed (${res.status}).`, status: res.status };
    }

    return { data, status: res.status };
  } catch (err) {
    if (err.name === "TypeError") {
      return { error: "Cannot reach the server. Is the backend running?" };
    }
    return { error: err.message || "An unexpected error occurred." };
  }
}

// ── Auth convenience wrappers ──────────────────────────────────

export const authLogin = (email, password) =>
  apiCall("POST", "/auth/login", { email, password });

export const authSignup = (employee_id, email, password, role) =>
  apiCall("POST", "/auth/signup", { employee_id, email, password, role });

export const authMe = () => apiCall("GET", "/auth/me");

// ── Dashboard ──────────────────────────────────────────────────

export const fetchDashboard = () => apiCall("GET", "/dashboard");

// ── Profile ────────────────────────────────────────────────────

export const fetchProfile = () => apiCall("GET", "/profile");

export const updateProfile = (body) => apiCall("PUT", "/profile", body);

export const fetchAllProfiles = () => apiCall("GET", "/profiles");

export const updateProfileById = (userId, body) =>
  apiCall("PUT", `/profiles/${userId}`, body);

// ── Attendance ─────────────────────────────────────────────────

export const postCheckIn = () => apiCall("POST", "/attendance/checkin", {});

export const postCheckOut = () => apiCall("POST", "/attendance/checkout", {});

export const fetchMyAttendance = (startDate, endDate) => {
  let qs = "";
  if (startDate && endDate) qs = `?start_date=${startDate}&end_date=${endDate}`;
  return apiCall("GET", `/attendance/my${qs}`);
};

export const fetchAllAttendance = (date, userId) => {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (userId) params.set("user_id", userId);
  const qs = params.toString();
  return apiCall("GET", `/attendance/all${qs ? "?" + qs : ""}`);
};

// ── Leaves ─────────────────────────────────────────────────────

export const submitLeaveRequest = (body) => apiCall("POST", "/leaves", body);

export const fetchMyLeaves = () => apiCall("GET", "/leaves/my");

export const fetchAllLeaves = (status) => {
  const qs = status ? `?status=${status}` : "";
  return apiCall("GET", `/leaves/all${qs}`);
};

export const updateLeaveStatus = (leaveId, status, adminComment) =>
  apiCall("PUT", `/leaves/${leaveId}/status`, { status, admin_comment: adminComment });

// ── Payroll ────────────────────────────────────────────────────

export const fetchMyPayroll = () => apiCall("GET", "/payroll/my");

export const fetchAllPayroll = () => apiCall("GET", "/payroll/all");

export const updatePayroll = (userId, body) =>
  apiCall("PUT", `/payroll/${userId}`, body);

// ── Analytics ──────────────────────────────────────────────────

export const fetchAttendanceAnalytics = () => apiCall("GET", "/analytics/attendance");

export const fetchLeavesAnalytics = () => apiCall("GET", "/analytics/leaves");
