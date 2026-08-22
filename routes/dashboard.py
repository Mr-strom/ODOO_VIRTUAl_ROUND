from flask import Blueprint, jsonify
from app import db
from models import User, Profile, Attendance, LeaveRequest
from auth import token_required
from datetime import date

dashboard_bp = Blueprint('dashboard', __name__)

PROFILE_FIELDS = [
    'full_name', 'phone', 'address', 'department',
    'designation', 'joining_date', 'profile_picture'
]


def get_profile_completeness(profile):
    """Calculate percentage of filled profile fields."""
    if not profile:
        return 0
    filled = sum(1 for f in PROFILE_FIELDS if getattr(profile, f, None))
    return round((filled / len(PROFILE_FIELDS)) * 100)


def serialize_attendance(record):
    if not record:
        return {'status': 'absent', 'check_in': None, 'check_out': None}
    return {
        'status': record.status,
        'check_in': str(record.check_in) if record.check_in else None,
        'check_out': str(record.check_out) if record.check_out else None
    }


def employee_dashboard(current_user):
    today = date.today()

    today_attendance = Attendance.query.filter_by(
        user_id=current_user.id, date=today
    ).first()

    pending_leaves = LeaveRequest.query.filter_by(
        user_id=current_user.id, status='pending'
    ).count()

    profile = Profile.query.filter_by(user_id=current_user.id).first()

    return {
        'role': 'employee',
        'today_attendance': serialize_attendance(today_attendance),
        'pending_leaves': pending_leaves,
        'profile_completeness': get_profile_completeness(profile)
    }


def hr_dashboard():
    today = date.today()

    total_employees = User.query.count()

    pending_leave_requests = LeaveRequest.query.filter_by(
        status='pending'
    ).count()

    today_records = Attendance.query.filter_by(date=today).all()

    today_present = sum(
        1 for r in today_records if r.status in ('present', 'half-day')
    )
    today_absent = sum(
        1 for r in today_records if r.status == 'absent'
    )
    today_on_leave = sum(
        1 for r in today_records if r.status == 'leave'
    )

    return {
        'role': 'hr',
        'total_employees': total_employees,
        'pending_leave_requests': pending_leave_requests,
        'today_present': today_present,
        'today_absent': today_absent,
        'today_on_leave': today_on_leave
    }


# GET /api/dashboard — role-based dashboard data
@dashboard_bp.route('/api/dashboard', methods=['GET'])
@token_required
def dashboard(current_user):
    if current_user.role in ('hr', 'admin'):
        return jsonify(hr_dashboard()), 200
    return jsonify(employee_dashboard(current_user)), 200
