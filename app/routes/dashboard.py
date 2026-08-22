# routes/dashboard.py — Role-based dashboard summary
from flask import Blueprint, jsonify, g
from datetime import date
from .. import db
from ..models import User, Attendance, LeaveRequest, Profile
from ..auth_utils import jwt_required

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required
def dashboard():
    """GET /api/dashboard — Role-based summary for employee or HR."""
    user = g.current_user
    today = date.today()

    if user.role == 'employee':
        # Today's attendance record
        today_att = Attendance.query.filter_by(user_id=user.id, date=today).first()

        # Pending leave requests count
        pending_leaves = LeaveRequest.query.filter_by(user_id=user.id, status='pending').count()

        # Profile completeness: count non-null optional fields
        profile = user.profile
        fields = ['full_name', 'phone', 'address', 'department', 'designation', 'joining_date', 'profile_picture']
        filled = sum(1 for f in fields if getattr(profile, f, None)) if profile else 0
        completeness = round((filled / len(fields)) * 100)

        return jsonify({
            'role': 'employee',
            'today_attendance': today_att.to_dict() if today_att else {'status': 'absent', 'check_in': None, 'check_out': None},
            'pending_leaves': pending_leaves,
            'profile_completeness': completeness
        }), 200

    else:  # hr
        # Total employees (excluding HR accounts)
        total_employees = User.query.filter_by(role='employee').count()

        # Pending leave requests across all employees
        pending_leaves = LeaveRequest.query.filter_by(status='pending').count()

        # Today's attendance summary — flat fields for JS
        today_records = Attendance.query.filter_by(date=today).all()
        present = sum(1 for r in today_records if r.status in ('present', 'half-day'))
        absent = sum(1 for r in today_records if r.status == 'absent')
        on_leave = sum(1 for r in today_records if r.status == 'leave')

        return jsonify({
            'role': 'hr',
            'total_employees': total_employees,
            'pending_leave_requests': pending_leaves,
            'today_present': present,
            'today_absent': absent,
            'today_on_leave': on_leave
        }), 200
