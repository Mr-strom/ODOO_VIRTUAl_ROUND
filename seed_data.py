# seed_data.py â€” Demo data seeder for Dayflow HRMS
# Usage:
#   python seed_data.py          -> inserts if tables are empty
#   python seed_data.py --clear  -> clears all existing data first
import sys
import random
from datetime import date, time, timedelta, datetime

from dotenv import load_dotenv
load_dotenv()  # must happen before create_app so DATABASE_URL is available

from app import create_app, db
from app.models import User, Profile, Attendance, LeaveRequest, Payroll
from werkzeug.security import generate_password_hash

# â”€â”€â”€ Seed payload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

USERS = [
    # (employee_id, email, password, role)
    ("HR001",  "hr@dayflow.com",   "hrpass123",  "hr"),
    ("EMP001", "emp1@dayflow.com", "emppass123", "employee"),
    ("EMP002", "emp2@dayflow.com", "emppass123", "employee"),
    ("EMP003", "emp3@dayflow.com", "emppass123", "employee"),
    ("EMP004", "emp4@dayflow.com", "emppass123", "employee"),
    ("EMP005", "emp5@dayflow.com", "emppass123", "employee"),
    ("EMP006", "emp6@dayflow.com", "emppass123", "employee"),
    ("EMP007", "emp7@dayflow.com", "emppass123", "employee"),
    ("EMP008", "emp8@dayflow.com", "emppass123", "employee"),
]

PROFILES = [
    # (employee_id, full_name, phone, department, designation, joining_date)
    ("HR001",  "Raj Mehta",        "9001001001", "Human Resources", "HR Manager",          date(2023, 1, 15)),
    ("EMP001", "Ananya Sharma",    "9001001002", "Engineering",     "Software Engineer",   date(2024, 3, 10)),
    ("EMP002", "Vikram Nair",      "9001001003", "Engineering",     "Senior Developer",    date(2023, 7, 1)),
    ("EMP003", "Priya Kapoor",     "9001001004", "Marketing",       "Marketing Executive", date(2024, 1, 20)),
    ("EMP004", "Rohit Joshi",      "9001001005", "Finance",         "Accountant",          date(2023, 9, 5)),
    ("EMP005", "Sneha Patel",      "9001001006", "Engineering",     "QA Engineer",         date(2024, 6, 15)),
    ("EMP006", "Amit Verma",       "9001001007", "Operations",      "Operations Lead",     date(2022, 11, 30)),
    ("EMP007", "Kavya Reddy",      "9001001008", "Marketing",       "Content Writer",      date(2024, 4, 8)),
    ("EMP008", "Arjun Singh",      "9001001009", "Finance",         "Finance Analyst",     date(2023, 5, 22)),
]

PAYROLLS = [
    # (employee_id, basic_salary, hra, deductions)
    ("HR001",  75000, 20000, 7000),
    ("EMP001", 55000, 15000, 5000),
    ("EMP002", 70000, 18000, 7000),
    ("EMP003", 40000, 12000, 3000),
    ("EMP004", 50000, 14000, 4500),
    ("EMP005", 48000, 13000, 4000),
    ("EMP006", 60000, 16000, 6000),
    ("EMP007", 35000, 10000, 2500),
    ("EMP008", 52000, 14500, 4800),
]

# 14 days: Aug 8â€“21, 2026
ATTENDANCE_START = date(2026, 8, 8)
ATTENDANCE_DAYS = 14

# Weighted random statuses per day
STATUSES = ["present"] * 7 + ["absent"] * 2 + ["half-day"] * 3 + ["leave"] * 2

# 12 leave requests: (employee_id, leave_type, start, end, remarks, status, admin_comment)
LEAVES = [
    ("EMP001", "paid",   date(2026, 8, 10), date(2026, 8, 11), "Doctor appointment",     "approved", "Approved"),
    ("EMP001", "sick",   date(2026, 8, 19), date(2026, 8, 19), "Fever",                  "pending",  None),
    ("EMP002", "paid",   date(2026, 8, 8),  date(2026, 8, 9),  "Family event",           "approved", "Approved, enjoy!"),
    ("EMP002", "unpaid", date(2026, 8, 20), date(2026, 8, 21), "Personal work",          "rejected", "Insufficient balance"),
    ("EMP003", "sick",   date(2026, 8, 12), date(2026, 8, 12), "Not feeling well",       "approved", "Get well soon"),
    ("EMP003", "paid",   date(2026, 8, 18), date(2026, 8, 20), "Vacation",               "pending",  None),
    ("EMP004", "paid",   date(2026, 8, 14), date(2026, 8, 15), "Wedding function",       "approved", "Approved"),
    ("EMP005", "sick",   date(2026, 8, 9),  date(2026, 8, 10), "Migraine",               "approved", "Approved"),
    ("EMP005", "unpaid", date(2026, 8, 21), date(2026, 8, 21), "Urgent personal matter", "pending",  None),
    ("EMP006", "paid",   date(2026, 8, 11), date(2026, 8, 13), "Festival",               "approved", "Approved, enjoy!"),
    ("EMP007", "sick",   date(2026, 8, 16), date(2026, 8, 16), "Cold and flu",           "rejected", "Not enough sick leave"),
    ("EMP008", "paid",   date(2026, 8, 20), date(2026, 8, 21), "Anniversary trip",       "pending",  None),
]


# â”€â”€â”€ Seeder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def seed(clear=False):
    app = create_app()
    with app.app_context():
        if clear:
            print("Clearing existing data...")
            db.session.execute(db.text("TRUNCATE users CASCADE;"))
            db.session.commit()
            print("  âœ“ Tables cleared")

        # â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        user_map = {}  # employee_id -> User object
        created_users = 0
        for emp_id, email, password, role in USERS:
            if User.query.filter_by(employee_id=emp_id).first():
                print(f"  [skip] User {emp_id} already exists")
                user_map[emp_id] = User.query.filter_by(employee_id=emp_id).first()
                continue
            u = User(
                employee_id=emp_id,
                email=email,
                password_hash=generate_password_hash(password),
                role=role,
                is_verified=True,
            )
            db.session.add(u)
            db.session.flush()  # get u.id before commit
            user_map[emp_id] = u
            created_users += 1

        db.session.flush()
        print(f"  âœ“ Users: {created_users} created")

        # â”€â”€ Profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        created_profiles = 0
        for emp_id, full_name, phone, department, designation, joining_date in PROFILES:
            u = user_map.get(emp_id)
            if not u or Profile.query.filter_by(user_id=u.id).first():
                continue
            p = Profile(
                user_id=u.id,
                full_name=full_name,
                phone=phone,
                address=f"{full_name}'s address, India",
                department=department,
                designation=designation,
                joining_date=joining_date,
            )
            db.session.add(p)
            created_profiles += 1

        db.session.flush()
        print(f"  âœ“ Profiles: {created_profiles} created")

        # â”€â”€ Payroll â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        created_payroll = 0
        for emp_id, basic, hra, deductions in PAYROLLS:
            u = user_map.get(emp_id)
            if not u or Payroll.query.filter_by(user_id=u.id).first():
                continue
            pr = Payroll(
                user_id=u.id,
                basic_salary=basic,
                hra=hra,
                deductions=deductions,
            )
            db.session.add(pr)
            created_payroll += 1

        db.session.flush()
        print(f"  âœ“ Payroll: {created_payroll} records created")

        # â”€â”€ Attendance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        # Only for employee users (not HR)
        emp_users = [uid for uid, u in user_map.items() if u.role == "employee"]
        created_att = 0
        rng = random.Random(42)  # fixed seed for reproducibility
        for emp_id in emp_users:
            u = user_map[emp_id]
            for day_offset in range(ATTENDANCE_DAYS):
                att_date = ATTENDANCE_START + timedelta(days=day_offset)
                # Skip weekends
                if att_date.weekday() >= 5:
                    continue
                # Skip if already exists
                if Attendance.query.filter_by(user_id=u.id, date=att_date).first():
                    continue
                status = rng.choice(STATUSES)
                check_in = None
                check_out = None
                if status in ("present", "half-day"):
                    check_in = time(9, rng.randint(0, 30))
                    check_out = time(18, rng.randint(0, 30)) if status == "present" else time(13, rng.randint(0, 30))
                att = Attendance(
                    user_id=u.id,
                    date=att_date,
                    check_in=check_in,
                    check_out=check_out,
                    status=status,
                )
                db.session.add(att)
                created_att += 1

        db.session.flush()
        print(f"  âœ“ Attendance: {created_att} records created")

        # â”€â”€ Leave Requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        hr_user = user_map.get("HR001")
        created_leaves = 0
        for emp_id, ltype, start, end, remarks, status, comment in LEAVES:
            u = user_map.get(emp_id)
            if not u:
                continue
            # Skip if a leave for this user on this start_date already exists
            if LeaveRequest.query.filter_by(user_id=u.id, start_date=start).first():
                continue
            approved_by_id = hr_user.id if (status in ("approved", "rejected") and hr_user) else None
            lr = LeaveRequest(
                user_id=u.id,
                leave_type=ltype,
                start_date=start,
                end_date=end,
                remarks=remarks,
                status=status,
                admin_comment=comment,
                approved_by=approved_by_id,
                updated_at=datetime.utcnow(),
            )
            db.session.add(lr)
            created_leaves += 1

        db.session.commit()
        print(f"  âœ“ Leave Requests: {created_leaves} created")

        # â”€â”€ Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print()
        print("===========================================")
        print("SEED COMPLETE")
        print("===========================================")
        print(f"  Users     : {User.query.count()}")
        print(f"  Profiles  : {Profile.query.count()}")
        print(f"  Attendance: {Attendance.query.count()} records")
        print(f"  Leaves    : {LeaveRequest.query.count()} requests")
        print(f"  Payroll   : {Payroll.query.count()} records")
        print()
        print("HR login    : hr@dayflow.com / hrpass123")
        print("Emp login   : emp1@dayflow.com ... emp8@dayflow.com / emppass123")
        print("===========================================")


if __name__ == "__main__":
    clear_flag = "--clear" in sys.argv
    seed(clear=clear_flag)

