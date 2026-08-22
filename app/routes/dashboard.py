# routes/dashboard.py — Role-based dashboard summary
from flask import Blueprint, jsonify, g
from datetime import date
from .. import db
from ..models import User, Attendance, LeaveRequest, Profile
from ..auth_utils import jwt_required

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('', methods=['GET'])
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
            'today_attendance': today_att.to_dict() if today_att else None,
            'pending_leaves': pending_leaves,
            'profile_completeness': f'{completeness}%'
        }), 200

    else:  # hr
        # Total employees (excluding HR accounts)
        total_employees = User.query.filter_by(role='employee').count()

        # Pending leave requests across all employees
        pending_leaves = LeaveRequest.query.filter_by(status='pending').count()

        # Today's attendance summary
        present = Attendance.query.filter_by(date=today, status='present').count()
        absent = Attendance.query.filter_by(date=today, status='absent').count()
        half_day = Attendance.query.filter_by(date=today, status='half-day').count()
        on_leave = Attendance.query.filter_by(date=today, status='leave').count()

        return jsonify({
            'role': 'hr',
            'total_employees': total_employees,
            'pending_leave_requests': pending_leaves,
            'today_attendance_summary': {
                'present': present,
                'absent': absent,
                'half_day': half_day,
                'on_leave': on_leave
            }
        }), 200
