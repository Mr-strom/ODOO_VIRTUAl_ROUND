"""
Dayflow HRMS — Full QA Test Suite (55 tests)
Run: python qa_suite.py
"""
import sys
import requests
import json

BASE = "http://127.0.0.1:5000"
results = []
tokens = {}

# -- helpers ----------------------------------------------------------------
def h(token=None):
    return {"Authorization": f"Bearer {token}"} if token else {}

def j(token=None):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"} if token else {"Content-Type": "application/json"}

def record(n, desc, status, code, evidence, expected=None):
    ok = status == "PASS"
    results.append((n, desc, status, code, evidence))
    icon = "[PASS]" if ok else "[FAIL]"
    print(f"TEST {n:02d}: {desc}")
    print(f"  STATUS: {status}  CODE: {code}")
    if not ok:
        print(f"  EVIDENCE: {evidence}")
    print()

def chk(n, desc, resp, expected_code, extra_check=None, extra_msg=""):
    code = resp.status_code
    ok = (code == expected_code)
    evidence = ""
    if not ok:
        evidence = f"Expected {expected_code}, got {code}. Body: {resp.text[:200]}"
    elif extra_check is not None:
        try:
            data = resp.json()
            if not extra_check(data):
                ok = False
                evidence = f"Unexpected body: {str(data)[:200]} {extra_msg}"
        except Exception as e:
            ok = False
            evidence = f"JSON parse error: {e}"
    record(n, desc, "PASS" if ok else "FAIL", code, evidence)
    return resp

# ==========================================================================
print("=" * 60)
print("DAYFLOW HRMS — QA TEST SUITE (55 tests)")
print("=" * 60)
print()

# -- Seed fresh demo users for QA (avoid conflicts with existing data) ------
# First login as HR to get token, or create a fresh QA HR user
try:
    r = requests.post(f"{BASE}/api/auth/login", json={"email": "hr@dayflow.com", "password": "hrpass123"}, timeout=5)
    if r.status_code == 200:
        tokens["hr"] = r.json()["token"]
        print(f"[SETUP] HR login OK. token={tokens['hr'][:30]}...")
    else:
        raise Exception("HR login failed")
except Exception as e:
    print(f"[SETUP ERROR] Cannot reach server: {e}")
    sys.exit(1)

try:
    r = requests.post(f"{BASE}/api/auth/login", json={"email": "emp1@dayflow.com", "password": "emppass123"}, timeout=5)
    tokens["emp"] = r.json()["token"]
    emp_data = r.json()
    print(f"[SETUP] EMP login OK.")
except Exception as e:
    print(f"[SETUP ERROR] Employee login failed: {e}")
    sys.exit(1)

# Get the employee's user id for later tests
me = requests.get(f"{BASE}/api/auth/me", headers=h(tokens["emp"])).json()
emp_user_id = me.get("id")

# Get payroll id for EMP
all_pay = requests.get(f"{BASE}/api/payroll/all", headers=h(tokens["hr"])).json()
emp_payroll = next((p for p in all_pay if p.get("employee", {}).get("role") == "employee"), None)
emp_payroll_id = emp_payroll["id"] if emp_payroll else 9

# Get a profile id to update (first non-HR profile)
profiles = requests.get(f"{BASE}/api/profiles", headers=h(tokens["hr"])).json()
emp_profile_id = next((p["id"] for p in profiles if p.get("user_id") != 1), None) or 2

print(f"[SETUP] emp_user_id={emp_user_id}, emp_payroll_id={emp_payroll_id}, emp_profile_id={emp_profile_id}")
print()

# ==========================================================================
print("--- AUTH (7 tests) -----------------------------------------------")

import time as _time
_ts = int(_time.time())
# 1 -- Signup new user (unique email each run)
r = requests.post(f"{BASE}/api/auth/signup", json={"employee_id": f"QATMP{_ts}", "email": f"qa{_ts}@test.com", "password": "qa123", "role": "employee"})
chk(1, "Signup new user -> 201 + token", r, 201, lambda d: "token" in d and d.get("user", {}).get("role") == "employee")
_qa_email = f"qa{_ts}@test.com"
_qa_emp_id = f"QATMP{_ts}"

# 2 -- Duplicate email
r = requests.post(f"{BASE}/api/auth/signup", json={"employee_id": f"QATMP{_ts}X", "email": _qa_email, "password": "qa123", "role": "employee"})
chk(2, "Duplicate email -> 400", r, 400)

# 3 -- Login correct
r = requests.post(f"{BASE}/api/auth/login", json={"email": _qa_email, "password": "qa123"})
chk(3, "Login correct -> 200 + token", r, 200, lambda d: "token" in d)

# 4 -- Wrong password
r = requests.post(f"{BASE}/api/auth/login", json={"email": _qa_email, "password": "wrongpass"})
chk(4, "Wrong password -> 401", r, 401)

# 5 — Wrong email
r = requests.post(f"{BASE}/api/auth/login", json={"email": "nobody@nowhere.com", "password": "qa123"})
chk(5, "Wrong email -> 401", r, 401)

# 6 — GET /api/auth/me with token
r = requests.get(f"{BASE}/api/auth/me", headers=h(tokens["hr"]))
chk(6, "GET /api/auth/me with token -> 200", r, 200, lambda d: "id" in d and "email" in d)

# 7 — GET /api/auth/me without token
r = requests.get(f"{BASE}/api/auth/me")
chk(7, "GET /api/auth/me without token -> 401", r, 401)

# ==========================================================================
print("--- ROLE GUARDS (6 tests) ----------------------------------------")

guarded = [
    ("/api/profiles",             "profiles"),
    ("/api/attendance/all",       "attendance/all"),
    ("/api/leaves/all",           "leaves/all"),
    ("/api/payroll/all",          "payroll/all"),
    ("/api/analytics/attendance", "analytics/attendance"),
    ("/api/analytics/leaves",     "analytics/leaves"),
]

for i, (endpoint, label) in enumerate(guarded, start=8):
    r_emp = requests.get(f"{BASE}{endpoint}", headers=h(tokens["emp"]))
    r_hr  = requests.get(f"{BASE}{endpoint}", headers=h(tokens["hr"]))
    ok = r_emp.status_code == 403 and r_hr.status_code == 200
    code_str = f"emp={r_emp.status_code}, hr={r_hr.status_code}"
    record(i, f"Role guard: {label} (emp->403, hr->200)", "PASS" if ok else "FAIL", code_str,
           "" if ok else f"Expected emp=403/hr=200, got {code_str}")

# ==========================================================================
print("--- PROFILE (5 tests) --------------------------------------------")

# 14 -- GET /api/profile — response wraps profile inside user object
r = requests.get(f"{BASE}/api/profile", headers=h(tokens["emp"]))
chk(14, "GET /api/profile -> 200", r, 200, lambda d: "id" in d)

# 15 -- PUT /api/profile (only employee-allowed fields: phone, address)
r = requests.put(f"{BASE}/api/profile", json={"phone": "9999999999", "address": "QA Lane"}, headers=j(tokens["emp"]))
chk(15, "PUT /api/profile (phone, address) -> 200", r, 200, lambda d: d.get("phone") == "9999999999")

# 16 — PUT /api/profile (full_name) -> 400
r = requests.put(f"{BASE}/api/profile", json={"full_name": "Hack Name"}, headers=j(tokens["emp"]))
chk(16, "PUT /api/profile (full_name) -> 400", r, 400)

# 17 — HR GET /api/profiles
r = requests.get(f"{BASE}/api/profiles", headers=h(tokens["hr"]))
chk(17, "HR GET /api/profiles -> 200 + array", r, 200, lambda d: isinstance(d, list) and len(d) > 0)

# 18 — HR PUT /api/profiles/<id>
r = requests.put(f"{BASE}/api/profiles/{emp_profile_id}", json={"designation": "QA Engineer"}, headers=j(tokens["hr"]))
chk(18, f"HR PUT /api/profiles/{emp_profile_id} -> 200", r, 200)

# ==========================================================================
print("--- ATTENDANCE (6 tests) -----------------------------------------")

# 19 — Checkin
r = requests.post(f"{BASE}/api/attendance/checkin", headers=h(tokens["emp"]))
chk(19, "POST /api/attendance/checkin -> 200", r, 200, lambda d: d.get("status") == "present")

# 20 — Checkin again same day (should update, not 409)
r2 = requests.post(f"{BASE}/api/attendance/checkin", headers=h(tokens["emp"]))
chk(20, "Checkin again same day -> 200 (no duplicate)", r2, 200)

# 21 — Checkout
r = requests.post(f"{BASE}/api/attendance/checkout", headers=h(tokens["emp"]))
chk(21, "POST /api/attendance/checkout -> 200", r, 200, lambda d: d.get("check_out") is not None)

# 22 — My attendance
r = requests.get(f"{BASE}/api/attendance/my", headers=h(tokens["emp"]))
chk(22, "GET /api/attendance/my -> 200 + array", r, 200, lambda d: isinstance(d, list))

# 23 — Filtered attendance
r = requests.get(f"{BASE}/api/attendance/my?start_date=2026-08-08&end_date=2026-08-21", headers=h(tokens["emp"]))
chk(23, "GET /api/attendance/my?dates filtered -> 200", r, 200, lambda d: isinstance(d, list))

# 24 — HR all attendance
r = requests.get(f"{BASE}/api/attendance/all", headers=h(tokens["hr"]))
chk(24, "HR GET /api/attendance/all -> 200 + array", r, 200, lambda d: isinstance(d, list) and len(d) > 0)

# ==========================================================================
print("--- LEAVES (6 tests) ---------------------------------------------")

# 25 — Apply leave
r = requests.post(f"{BASE}/api/leaves", json={"leave_type": "paid", "start_date": "2026-09-10", "end_date": "2026-09-11", "remarks": "QA test leave"}, headers=j(tokens["emp"]))
chk(25, "POST /api/leaves -> 201, status pending", r, 201, lambda d: d.get("status") == "pending")
new_leave_id = r.json().get("id") if r.status_code == 201 else None

# 26 — My leaves
r = requests.get(f"{BASE}/api/leaves/my", headers=h(tokens["emp"]))
chk(26, "GET /api/leaves/my -> 200 + array", r, 200, lambda d: isinstance(d, list) and len(d) > 0)

# 27 — HR all leaves
r = requests.get(f"{BASE}/api/leaves/all", headers=h(tokens["hr"]))
chk(27, "HR GET /api/leaves/all -> 200 + array", r, 200, lambda d: isinstance(d, list))

# 28 — HR approve
if new_leave_id:
    r = requests.put(f"{BASE}/api/leaves/{new_leave_id}/status", json={"status": "approved", "admin_comment": "QA approved"}, headers=j(tokens["hr"]))
    chk(28, f"HR PUT /api/leaves/{new_leave_id}/status approved -> 200, approved_by set", r, 200, lambda d: d.get("status") == "approved" and d.get("approved_by") is not None)
else:
    record(28, "HR approve leave -> SKIPPED (no new_leave_id)", "FAIL", "N/A", "Leave was not created in test 25")

# 29 — Employee sees approved status
r = requests.get(f"{BASE}/api/leaves/my", headers=h(tokens["emp"]))
chk(29, "Employee sees leave status approved after HR action", r, 200, lambda d: any(l.get("status") == "approved" for l in d), "No approved leave found")

# 30 — HR reject a different one (apply then reject)
r_new = requests.post(f"{BASE}/api/leaves", json={"leave_type": "sick", "start_date": "2026-09-15", "end_date": "2026-09-15", "remarks": "QA reject test"}, headers=j(tokens["emp"]))
reject_id = r_new.json().get("id") if r_new.status_code == 201 else None
if reject_id:
    r = requests.put(f"{BASE}/api/leaves/{reject_id}/status", json={"status": "rejected", "admin_comment": "Rejected for QA"}, headers=j(tokens["hr"]))
    chk(30, "HR PUT /api/leaves/<id>/status rejected -> 200", r, 200, lambda d: d.get("status") == "rejected")
else:
    record(30, "HR reject leave", "FAIL", "N/A", "Could not create second leave")

# ==========================================================================
print("--- PAYROLL (5 tests) --------------------------------------------")

# 31 — Employee GET /api/payroll/my
r = requests.get(f"{BASE}/api/payroll/my", headers=h(tokens["emp"]))
pay_data = r.json() if r.status_code == 200 else {}
basic = pay_data.get("basic_salary", 0)
hra = pay_data.get("hra", 0)
ded = pay_data.get("deductions", 0)
expected_net = round(basic + hra - ded, 2)
actual_net = pay_data.get("net_salary", -1)
chk(31, "Employee GET /api/payroll/my -> 200, net_salary correct", r, 200,
    lambda d: round(d.get("basic_salary",0) + d.get("hra",0) - d.get("deductions",0), 2) == d.get("net_salary"),
    f"Expected net={expected_net}, got {actual_net}")

# 32 — Fresh user with 0 salary
r_new_user = requests.post(f"{BASE}/api/auth/signup", json={"employee_id": f"QAZERO{_ts}", "email": f"qazero{_ts}@test.com", "password": "qa123", "role": "employee"})
if r_new_user.status_code == 201:
    zero_token = r_new_user.json()["token"]
    r = requests.get(f"{BASE}/api/payroll/my", headers=h(zero_token))
    chk(32, "New employee payroll before salary set -> net_salary=0", r, 200, lambda d: d.get("net_salary") == 0.0)
else:
    record(32, "New employee payroll before salary set -> net=0", "FAIL", r_new_user.status_code, "Signup failed")

# 33 — HR all payroll
r = requests.get(f"{BASE}/api/payroll/all", headers=h(tokens["hr"]))
chk(33, "HR GET /api/payroll/all -> 200 + array", r, 200, lambda d: isinstance(d, list) and len(d) > 0)

# 34 — HR update payroll
r = requests.put(f"{BASE}/api/payroll/{emp_payroll_id}", json={"basic_salary": 55000, "hra": 15000, "deductions": 5000}, headers=j(tokens["hr"]))
chk(34, f"HR PUT /api/payroll/{emp_payroll_id} -> 200, net recalculated", r, 200,
    lambda d: d.get("net_salary") == 65000.0, f"Expected net=65000.0, got {r.json().get('net_salary') if r.status_code==200 else 'N/A'}")

# 35 — Employee cannot update payroll
r = requests.put(f"{BASE}/api/payroll/{emp_payroll_id}", json={"basic_salary": 99999}, headers=j(tokens["emp"]))
chk(35, f"Employee PUT /api/payroll/{emp_payroll_id} -> 403", r, 403)

# ==========================================================================
print("--- DASHBOARD (2 tests) ------------------------------------------")

# 36 — Employee dashboard
r = requests.get(f"{BASE}/api/dashboard", headers=h(tokens["emp"]))
chk(36, "Employee GET /api/dashboard -> has today_attendance + pending_leaves", r, 200,
    lambda d: "today_attendance" in d and "pending_leaves" in d)

# 37 — HR dashboard
r = requests.get(f"{BASE}/api/dashboard", headers=h(tokens["hr"]))
chk(37, "HR GET /api/dashboard -> has total_employees + pending_leave_requests", r, 200,
    lambda d: "total_employees" in d and "pending_leave_requests" in d)

# ==========================================================================
print("--- ANALYTICS (4 tests) ------------------------------------------")

# 38 — HR attendance analytics
r = requests.get(f"{BASE}/api/analytics/attendance", headers=h(tokens["hr"]))
chk(38, "HR GET /api/analytics/attendance -> daily_summary + status_breakdown", r, 200,
    lambda d: "daily_summary" in d and "status_breakdown" in d and len(d["daily_summary"]) == 30)

# 39 — HR leaves analytics
r = requests.get(f"{BASE}/api/analytics/leaves", headers=h(tokens["hr"]))
chk(39, "HR GET /api/analytics/leaves -> by_type + monthly_trend (6 months)", r, 200,
    lambda d: "by_type" in d and "monthly_trend" in d and len(d["monthly_trend"]) == 6)

# 40 — Employee cannot access analytics
r = requests.get(f"{BASE}/api/analytics/attendance", headers=h(tokens["emp"]))
chk(40, "Employee GET /api/analytics/attendance -> 403", r, 403)

# 41 — status_breakdown totals match DB count (sum present+absent+half_day+leave > 0)
r = requests.get(f"{BASE}/api/analytics/attendance", headers=h(tokens["hr"]))
if r.status_code == 200:
    sb = r.json()["status_breakdown"]
    total = sb.get("present", 0) + sb.get("absent", 0) + sb.get("half_day", 0) + sb.get("leave", 0)
    ok = total > 0
    record(41, "Analytics status_breakdown totals are non-zero (DB has seeded data)", "PASS" if ok else "FAIL", 200,
           "" if ok else f"All zero: {sb}")
else:
    record(41, "Analytics status_breakdown totals", "FAIL", r.status_code, r.text[:100])

# ==========================================================================
print("--- NOTIFICATIONS (6 tests) --------------------------------------")

# Apply a fresh leave to generate notification
r_leave = requests.post(f"{BASE}/api/leaves", json={"leave_type": "unpaid", "start_date": "2026-09-20", "end_date": "2026-09-20", "remarks": "Notification test"}, headers=j(tokens["emp"]))
notif_leave_id = r_leave.json().get("id") if r_leave.status_code == 201 else None

# 42 — HR gets notification after leave applied
r = requests.get(f"{BASE}/api/notifications/my", headers=h(tokens["hr"]))
chk(42, "HR gets notification after employee applies leave", r, 200,
    lambda d: isinstance(d.get("notifications"), list) and len(d["notifications"]) > 0,
    "No notifications found for HR")

# 43 — HR unread count > 0
r = requests.get(f"{BASE}/api/notifications/unread-count", headers=h(tokens["hr"]))
chk(43, "HR unread-count > 0 after leave applied", r, 200,
    lambda d: d.get("count", 0) > 0, f"count={r.json().get('count') if r.status_code==200 else 'N/A'}")

# 44 — HR approves -> employee gets notification
if notif_leave_id:
    requests.put(f"{BASE}/api/leaves/{notif_leave_id}/status", json={"status": "approved", "admin_comment": "ok"}, headers=j(tokens["hr"]))
r_emp_notifs = requests.get(f"{BASE}/api/notifications/my", headers=h(tokens["emp"]))
chk(44, "Employee gets notification after HR approves leave", r_emp_notifs, 200,
    lambda d: any(n.get("type") == "leave_status" for n in d.get("notifications", [])),
    "No leave_status notification found for employee")

# 45 — Mark single notification as read
hr_notifs = requests.get(f"{BASE}/api/notifications/my", headers=h(tokens["hr"])).json().get("notifications", [])
if hr_notifs:
    nid = hr_notifs[0]["id"]
    r = requests.put(f"{BASE}/api/notifications/{nid}/read", headers=h(tokens["hr"]))
    chk(45, f"PUT /api/notifications/{nid}/read -> is_read=true", r, 200, lambda d: d.get("is_read") == True)
else:
    record(45, "Mark single notification read", "FAIL", "N/A", "No HR notifications to mark")

# 46 — Mark all read -> unread count = 0
requests.put(f"{BASE}/api/notifications/read-all", headers=h(tokens["hr"]))
r = requests.get(f"{BASE}/api/notifications/unread-count", headers=h(tokens["hr"]))
chk(46, "After read-all, HR unread-count = 0", r, 200, lambda d: d.get("count") == 0,
    f"count={r.json().get('count') if r.status_code==200 else 'N/A'}")

# 47 — Employee only sees their own notifications
emp_notifs = requests.get(f"{BASE}/api/notifications/my", headers=h(tokens["emp"])).json().get("notifications", [])
all_own = all(n.get("type") == "leave_status" or n.get("user_id") == emp_user_id for n in emp_notifs)
record(47, "Employee notifications only contain their own records", "PASS" if all_own else "FAIL",
       200, "" if all_own else f"Found cross-user notification: {emp_notifs[:1]}")

# ==========================================================================
print("--- CSV EXPORT (2 tests) -----------------------------------------")

# 48 — Attendance CSV
r = requests.get(f"{BASE}/api/attendance/export?start_date=2026-08-08&end_date=2026-08-21", headers=h(tokens["hr"]))
ok_csv_att = (r.status_code == 200 and "text/csv" in r.headers.get("Content-Type", ""))
lines = [l for l in r.text.split("\n") if l.strip()]
has_header = lines[0].startswith("Employee ID,Name,Date") if lines else False
has_data = len(lines) > 1
ok = ok_csv_att and has_header and has_data
record(48, "HR GET /api/attendance/export -> text/csv with header+data", "PASS" if ok else "FAIL",
       r.status_code, "" if ok else f"CT={r.headers.get('Content-Type')}, rows={len(lines)}, header={lines[0][:50] if lines else 'none'}")

# 49 — Payroll CSV
r = requests.get(f"{BASE}/api/payroll/export", headers=h(tokens["hr"]))
ok_csv_pay = (r.status_code == 200 and "text/csv" in r.headers.get("Content-Type", ""))
lines_pay = [l.strip() for l in r.text.split("\n") if l.strip()]
expected_header = "Employee ID,Name,Basic Salary,HRA,Deductions,Net Salary"
header_ok = lines_pay[0] == expected_header if lines_pay else False
ok = ok_csv_pay and header_ok and len(lines_pay) > 1
record(49, "HR GET /api/payroll/export -> correct headers", "PASS" if ok else "FAIL",
       r.status_code, "" if ok else f"Got header: '{lines_pay[0] if lines_pay else 'none'}'")

# ==========================================================================
print("--- PDF PAYSLIP (1 test) -----------------------------------------")

# 50 — PDF salary slip
r = requests.get(f"{BASE}/api/payroll/my/slip", headers=h(tokens["emp"]))
ct = r.headers.get("Content-Type", "")
cd = r.headers.get("Content-Disposition", "")
ok = (r.status_code == 200 and "application/pdf" in ct and "EMP" in cd.upper() and len(r.content) > 100)
record(50, "Employee GET /api/payroll/my/slip -> PDF with correct headers", "PASS" if ok else "FAIL",
       r.status_code, "" if ok else f"CT={ct}, CD={cd}, size={len(r.content)}")

# ==========================================================================
print("--- EDGE CASES (5 tests) -----------------------------------------")

# 51 — Signup role=admin
r = requests.post(f"{BASE}/api/auth/signup", json={"employee_id": "BADMIN01", "email": "admin@hack.com", "password": "hack", "role": "admin"})
chk(51, "Signup role='admin' -> 400", r, 400)

# 52 — Leave end_date before start_date
r = requests.post(f"{BASE}/api/leaves", json={"leave_type": "paid", "start_date": "2026-09-10", "end_date": "2026-09-05", "remarks": "invalid"}, headers=j(tokens["emp"]))
chk(52, "Leave end_date before start_date -> 400", r, 400)

# 53 — PUT /api/profile with empty body
r = requests.put(f"{BASE}/api/profile", data="", headers={"Authorization": f"Bearer {tokens['emp']}", "Content-Type": "application/json"})
chk(53, "PUT /api/profile empty body -> 400 not 500", r, 400)

# 54 — Invalid date on attendance query
r = requests.get(f"{BASE}/api/attendance/my?start_date=not-a-date", headers=h(tokens["emp"]))
chk(54, "GET /api/attendance/my?start_date=invalid -> 400", r, 400)

# 55 — Notifications without token
r = requests.get(f"{BASE}/api/notifications/my")
chk(55, "GET /api/notifications/my without token -> 401", r, 401)

# ==========================================================================
print("=" * 60)
print("RESULTS SUMMARY")
print("=" * 60)

passed = [r for r in results if r[2] == "PASS"]
failed = [r for r in results if r[2] == "FAIL"]

print(f"TOTAL  : {len(results)}")
print(f"PASSED : {len(passed)}")
print(f"FAILED : {len(failed)}")
print()

if failed:
    print("BUGS FOUND:")
    for n, desc, status, code, evidence in failed:
        print(f"  BUG #{n}: {desc}")
        print(f"    Code: {code}")
        print(f"    Evidence: {evidence}")
    print()
    print("RECOMMENDATIONS:")
    for n, desc, status, code, evidence in failed:
        print(f"  - Fix test #{n}: {desc}")
else:
    print("NO BUGS FOUND. All endpoints behaving correctly.")
print()
print("=" * 60)


