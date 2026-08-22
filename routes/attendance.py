from flask import Blueprint, request, jsonify
from app import db
from models import User, Attendance
from auth import token_required, role_required
from datetime import datetime, date, timedelta, time

attendance_bp = Blueprint('attendance', __name__)


def serialize_attendance(record):
    return {
        'id': record.id,
        'user_id': record.user_id,
        'date': str(record.date),
        'check_in': str(record.check_in) if record.check_in else None,
        'check_out': str(record.check_out) if record.check_out else None,
        'status': record.status,
        'remarks': record.remarks
    }


def parse_date(date_str):
    """Parse YYYY-MM-DD string to date object. Returns None on failure."""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


# POST /api/attendance/checkin — record check-in for today
@attendance_bp.route('/api/attendance/checkin', methods=['POST'])
@token_required
def checkin(current_user):
    today = date.today()
    now = datetime.now().time()

    existing = Attendance.query.filter_by(
        user_id=current_user.id, date=today
    ).first()

    if existing and existing.check_in:
        return jsonify({'error': 'Already checked in today'}), 409

    status = 'half-day' if now > time(10, 0) else 'present'

    try:
        record = Attendance(
            user_id=current_user.id,
            date=today,
            check_in=now,
            status=status
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({'attendance': serialize_attendance(record)}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Check-in failed'}), 500


# POST /api/attendance/checkout — record check-out for today
@attendance_bp.route('/api/attendance/checkout', methods=['POST'])
@token_required
def checkout(current_user):
    today = date.today()
    now = datetime.now().time()

    record = Attendance.query.filter_by(
        user_id=current_user.id, date=today
    ).first()

    if not record or not record.check_in:
        return jsonify({'error': 'No check-in found for today'}), 404

    if record.check_out:
        return jsonify({'error': 'Already checked out today'}), 409

    try:
        record.check_out = now
        db.session.commit()
        return jsonify({'attendance': serialize_attendance(record)}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Check-out failed'}), 500


# GET /api/attendance/my — my attendance, default last 7 days
@attendance_bp.route('/api/attendance/my', methods=['GET'])
@token_required
def my_attendance(current_user):
    start_str = request.args.get('start_date')
    end_str = request.args.get('end_date')

    end_date = parse_date(end_str) if end_str else date.today()
    start_date = parse_date(start_str) if start_str else end_date - timedelta(days=7)

    if end_date is None or start_date is None:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    records = Attendance.query.filter(
        Attendance.user_id == current_user.id,
        Attendance.date >= start_date,
        Attendance.date <= end_date
    ).order_by(Attendance.date.desc()).all()

    return jsonify({
        'attendance': [serialize_attendance(r) for r in records],
        'start_date': str(start_date),
        'end_date': str(end_date)
    }), 200


# GET /api/attendance/all — HR/Admin only, all attendance with nested user
@attendance_bp.route('/api/attendance/all', methods=['GET'])
@token_required
@role_required('hr', 'admin')
def all_attendance(current_user):
    query = Attendance.query

    date_str = request.args.get('date')
    if date_str:
        filter_date = parse_date(date_str)
        if filter_date is None:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        query = query.filter(Attendance.date == filter_date)

    user_id = request.args.get('user_id')
    if user_id:
        try:
            query = query.filter(Attendance.user_id == int(user_id))
        except ValueError:
            return jsonify({'error': 'Invalid user_id'}), 400

    records = query.order_by(Attendance.date.desc()).all()

    result = []
    for record in records:
        data = serialize_attendance(record)
        user = User.query.get(record.user_id)
        data['user'] = {
            'id': user.id,
            'employee_id': user.employee_id,
            'email': user.email
        } if user else None
        result.append(data)

    return jsonify({'attendance': result}), 200
