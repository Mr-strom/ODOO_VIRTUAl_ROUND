# routes/attendance.py — Check-in, check-out, own records, HR all records
from flask import Blueprint, request, jsonify, g
from datetime import date, datetime, timedelta, time
from .. import db
from ..models import Attendance, User
from ..auth_utils import jwt_required, hr_required

attendance_bp = Blueprint('attendance', __name__)


@attendance_bp.route('/checkin', methods=['POST'])
@jwt_required
def checkin():
    """POST /api/attendance/checkin — Record check-in for today."""
    user = g.current_user
    today = date.today()
    now_time = datetime.now().time()

    existing = Attendance.query.filter_by(user_id=user.id, date=today).first()
    if existing and existing.check_in:
        return jsonify({'error': 'Already checked in today'}), 409

    # Auto-set status to half-day if after 10:00 AM
    status = 'half-day' if now_time > time(10, 0) else 'present'

    if existing:
        existing.check_in = now_time
        existing.status = status
        db.session.commit()
        return jsonify(existing.to_dict()), 201

    record = Attendance(
        user_id=user.id,
        date=today,
        check_in=now_time,
        status=status
    )
    db.session.add(record)
    db.session.commit()
    return jsonify(record.to_dict()), 201


@attendance_bp.route('/checkout', methods=['POST'])
@jwt_required
def checkout():
    """POST /api/attendance/checkout — Record check-out for today."""
    user = g.current_user
    today = date.today()

    record = Attendance.query.filter_by(user_id=user.id, date=today).first()
    if not record or not record.check_in:
        return jsonify({'error': 'No check-in found for today'}), 404

    if record.check_out:
        return jsonify({'error': 'Already checked out today'}), 409

    record.check_out = datetime.now().time()
    db.session.commit()
    return jsonify(record.to_dict()), 200


@attendance_bp.route('/my', methods=['GET'])
@jwt_required
def my_attendance():
    """GET /api/attendance/my — Own attendance with optional date range filter.
    Defaults to last 7 days. Query params: start_date, end_date (YYYY-MM-DD).
    """
    user = g.current_user
    today = date.today()
    start_str = request.args.get('start_date')
    end_str = request.args.get('end_date')

    try:
        start = datetime.strptime(start_str, '%Y-%m-%d').date() if start_str else today - timedelta(days=7)
        end = datetime.strptime(end_str, '%Y-%m-%d').date() if end_str else today
    except ValueError:
        return jsonify({'error': 'Dates must be YYYY-MM-DD'}), 400

    records = Attendance.query.filter(
        Attendance.user_id == user.id,
        Attendance.date >= start,
        Attendance.date <= end
    ).order_by(Attendance.date.desc()).all()

    return jsonify({'attendance': [r.to_dict() for r in records]}), 200


@attendance_bp.route('/all', methods=['GET'])
@hr_required
def all_attendance():
    """GET /api/attendance/all — HR only: all records with optional ?date= and ?user_id= filters."""
    date_str = request.args.get('date')
    user_id = request.args.get('user_id')

    query = Attendance.query

    if date_str:
        try:
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'date must be YYYY-MM-DD'}), 400
        query = query.filter_by(date=filter_date)

    if user_id:
        query = query.filter_by(user_id=user_id)

    records = query.order_by(Attendance.date.desc()).all()

    result = []
    for r in records:
        data = r.to_dict()
        user = User.query.get(r.user_id)
        data['user'] = {
            'id': user.id,
            'employee_id': user.employee_id,
            'email': user.email
        } if user else None
        result.append(data)

    return jsonify({'attendance': result}), 200
