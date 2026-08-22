/**
 * Dayflow Field Mappers
 * Converts between Flask API field names and the frontend's UI data model.
 *
 * API Profile:  { full_name, designation, joining_date, profile_picture, ... }
 * UI Person:    { name, title, joined, avatarImage, ... }
 *
 * API Attendance: { check_in: "09:11:23", status: "present" }
 * UI Record:      { checkIn: "09:11",     status: "Present" }
 */

// ── Formatting helpers ─────────────────────────────────────────

/** "09:11:23" → "09:11" */
const trimTime = (t) => (t && t.length > 5 ? t.slice(0, 5) : t || null);

/** "present" → "Present", "half-day" → "Half-day" */
const capitalize = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

/** "2024-03-10" → "10 Mar 2024" */
const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
};

/** Derive two-letter avatar initials from a full name */
const initials = (name) => {
  if (!name) return "DF";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ── API → UI Mappers ───────────────────────────────────────────

/**
 * Merge API user object + profile object + payroll object into a single
 * UI "person" object that the existing JSX components expect.
 */
export function mapApiToPerson(apiUser, apiProfile, apiPayroll) {
  const profile = apiProfile || {};
  const user = apiUser || {};
  const payroll = apiPayroll || {};

  return {
    id: user.id,
    name: profile.full_name || user.email?.split("@")[0] || "—",
    employeeId: user.employee_id || "—",
    email: user.email || "",
    role: user.role || "employee",
    department: profile.department || "Unassigned",
    title: profile.designation || "Team member",
    phone: profile.phone || "",
    address: profile.address || "",
    joined: formatDate(profile.joining_date),
    joinedRaw: profile.joining_date || "",
    manager: "—",
    avatar: initials(profile.full_name),
    avatarImage: profile.profile_picture || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.employee_id || user.id}`,
    documents: profile.documents ? profile.documents.split(",").map((d) => d.trim()).filter(Boolean) : [],
    salary: {
      basic: Number(payroll.basic_salary || 0),
      hra: Number(payroll.hra || 0),
      deductions: Number(payroll.deductions || 0),
    },
    // Keep raw IDs for API calls
    _userId: user.id,
    _profileId: profile.id,
    _payrollId: payroll.id,
  };
}

/**
 * Map a single profile response from GET /profiles (HR view) into a person.
 * The HR endpoint nests the user object inside the profile.
 */
export function mapHrProfileToPerson(apiProfileWithUser, payrollMap = {}) {
  const user = apiProfileWithUser.user || {};
  const payroll = payrollMap[user.id] || {};
  return mapApiToPerson(user, apiProfileWithUser, payroll);
}

/**
 * Map an API attendance record to the UI format.
 */
export function mapApiAttendance(record) {
  return {
    id: record.id,
    personId: record.user_id,
    date: record.date,
    checkIn: trimTime(record.check_in),
    checkOut: trimTime(record.check_out),
    status: capitalize(record.status),
    // Nested user from HR /all endpoint
    _user: record.user || null,
  };
}

/**
 * Map an API leave request to the UI format.
 */
export function mapApiLeave(leave) {
  return {
    id: leave.id,
    personId: leave.user_id,
    type: capitalize(leave.leave_type),
    start: leave.start_date,
    end: leave.end_date,
    days: leave.total_days || daysBetween(leave.start_date, leave.end_date),
    status: capitalize(leave.status),
    remarks: leave.remarks || "",
    comment: leave.admin_comment || "",
    // Nested user from HR /all endpoint
    _user: leave.user || null,
  };
}

// ── UI → API Mappers ───────────────────────────────────────────

/**
 * Convert the leave form values to API body.
 * UI type "Paid" → API "paid"
 */
export function mapLeaveFormToApi(form) {
  return {
    leave_type: (form.type || "").toLowerCase(),
    start_date: form.start,
    end_date: form.end,
    remarks: form.remarks || "",
  };
}

/**
 * Convert employee profile edits to API body.
 * Employee can only update: phone, address, profile_picture.
 */
export function mapEmployeeProfileToApi(draft) {
  const body = {};
  if (draft.phone !== undefined) body.phone = draft.phone;
  if (draft.address !== undefined) body.address = draft.address;
  if (draft.avatarImage !== undefined) body.profile_picture = draft.avatarImage;
  return body;
}

/**
 * Convert HR profile edits to API body.
 * HR can update all fields.
 */
export function mapHrProfileToApi(draft) {
  return {
    full_name: draft.name,
    phone: draft.phone,
    address: draft.address,
    department: draft.department,
    designation: draft.title,
    joining_date: draft.joinedRaw || "",
    profile_picture: draft.avatarImage || "",
  };
}

/**
 * Convert salary edits to API body.
 */
export function mapSalaryToApi(salary) {
  return {
    basic_salary: Number(salary.basic || 0),
    hra: Number(salary.hra || 0),
    deductions: Number(salary.deductions || 0),
  };
}

// ── Helpers ────────────────────────────────────────────────────

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  return Math.max(1, Math.floor((e - s) / 86400000) + 1);
}

export { formatDate, capitalize, initials, trimTime };

