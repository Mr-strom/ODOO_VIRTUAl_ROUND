# routes/analytics.py — HR-only analytics endpoints
from flask import Blueprint, jsonify
from datetime import date, timedelta
from sqlalchemy import func

from .. import db
from ..models import Attendance, LeaveRequest
from ..auth_utils import hr_required

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/attendance', methods=['GET'])
@hr_required
def attendance_analytics():
    """GET /api/analytics/attendance
    Returns last-30-day daily breakdown + overall status totals.
    Uses GROUP BY in the DB — no Python loops for aggregation.
    """
    today = date.today()
    thirty_days_ago = today - timedelta(days=29)  # inclusive: 30 days

    # ── Daily summary: one row per (date, status) with count ────────────────
    rows = (
        db.session.query(
            Attendance.date,
            Attendance.status,
            func.count(Attendance.id).label('cnt')
        )
        .filter(Attendance.date >= thirty_days_ago, Attendance.date <= today)
        .group_by(Attendance.date, Attendance.status)
        .order_by(Attendance.date)
        .all()
    )

    # Pivot into {date_str: {status: count}} dict
    daily_map = {}
    for att_date, status, cnt in rows:
        ds = att_date.isoformat()
        if ds not in daily_map:
            daily_map[ds] = {"present": 0, "absent": 0, "half_day": 0, "leave": 0}
        key = "half_day" if status == "half-day" else status
        if key in daily_map[ds]:
            daily_map[ds][key] = cnt

    # Build sorted list — include all 30 days (zeros for days with no records)
    daily_summary = []
    for offset in range(30):
        ds = (thirty_days_ago + timedelta(days=offset)).isoformat()
        entry = daily_map.get(ds, {"present": 0, "absent": 0, "half_day": 0, "leave": 0})
        daily_summary.append({"date": ds, **entry})

    # ── Overall status breakdown (same 30-day window) ────────────────────────
    totals_rows = (
        db.session.query(
            Attendance.status,
            func.count(Attendance.id).label('cnt')
        )
        .filter(Attendance.date >= thirty_days_ago, Attendance.date <= today)
        .group_by(Attendance.status)
        .all()
    )

    status_breakdown = {"present": 0, "absent": 0, "half_day": 0, "leave": 0}
    for status, cnt in totals_rows:
        key = "half_day" if status == "half-day" else status
        if key in status_breakdown:
            status_breakdown[key] = cnt

    return jsonify({
        "daily_summary": daily_summary,
        "status_breakdown": status_breakdown
    }), 200


@analytics_bp.route('/leaves', methods=['GET'])
@hr_required
def leaves_analytics():
    """GET /api/analytics/leaves
    Returns leave count by type + monthly trend for the last 6 months.
    Uses GROUP BY in the DB — no Python loops for aggregation.
    """
    today = date.today()

    # ── By type: count all leave requests grouped by leave_type ─────────────
    type_rows = (
        db.session.query(
            LeaveRequest.leave_type,
            func.count(LeaveRequest.id).label('cnt')
        )
        .group_by(LeaveRequest.leave_type)
        .all()
    )

    by_type = {"paid": 0, "sick": 0, "unpaid": 0}
    for ltype, cnt in type_rows:
        if ltype in by_type:
            by_type[ltype] = cnt

    # ── Monthly trend: last 6 calendar months ────────────────────────────────
    # Build list of (year, month) for last 6 months
    months = []
    for i in range(5, -1, -1):  # 5 months ago → current month
        # Roll back i months from today
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        months.append((year, month))

    # Single query: count leaves grouped by (year, month) of created_at
    monthly_rows = (
        db.session.query(
            func.extract('year',  LeaveRequest.created_at).label('yr'),
            func.extract('month', LeaveRequest.created_at).label('mo'),
            func.count(LeaveRequest.id).label('cnt')
        )
        .group_by('yr', 'mo')
        .order_by('yr', 'mo')
        .all()
    )

    # Map (year, month) -> count from DB results
    monthly_db = {}
    for yr, mo, cnt in monthly_rows:
        monthly_db[(int(yr), int(mo))] = cnt

    # Build response including months with zero count
    monthly_trend = []
    for yr, mo in months:
        monthly_trend.append({
            "month": f"{yr}-{mo:02d}",
            "count": monthly_db.get((yr, mo), 0)
        })

    return jsonify({
        "by_type": by_type,
        "monthly_trend": monthly_trend
    }), 200
