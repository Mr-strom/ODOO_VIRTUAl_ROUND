from flask import Blueprint, request, jsonify
from app import db
from models import User, LeaveRequest
from auth import token_required, role_required
from datetime import datetime, date

leaves_bp = Blueprint('leaves', __name__)

VALID_LEAVE_TYPES = {'paid', 'sick', 'unpaid'}
VALID_STATUSES = {'approved', 'rejected'}


def serialize_leave(leave):
    return {
        'id': leave.id,
        'user_id': leave.user_id,
        'leave_type': leave.leave_type,
        'start_date': str(leave.start_date),
        'end_date': str(leave.end_date),
        'total_days': leave.total_days,
        'remarks': leave.remarks,
        'status': leave.status,
        'admin_comment': leave.admin_comment,
        'approved_by': leave.approved_by,
        'created_at': str(leave.created_at) if leave.created_at else None,
        'updated_at': str(leave.updated_at) if leave.updated_at else None
    }


def parse_date(date_str):
    """Parse YYYY-MM-DD string to date object. Returns None on failure."""
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


# POST /api/leaves — apply for leave
@leaves_bp.route('/api/leaves', methods=['POST'])
@token_required
def apply_leave(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Validate leave_type
    leave_type = data.get('leave_type')
    if not leave_type or leave_type not in VALID_LEAVE_TYPES:
        return jsonify({'error': f'Invalid leave_type. Must be one of: {", ".join(sorted(VALID_LEAVE_TYPES))}'}), 400

    # Parse and validate dates
    start_date = parse_date(data.get('start_date'))
    end_date = parse_date(data.get('end_date'))

    if not start_date or not end_date:
        return jsonify({'error': 'Invalid or missing dates. Use YYYY-MM-DD format'}), 400

    if start_date < date.today():
        return jsonify({'error': 'start_date cannot be in the past'}), 400

    if end_date < start_date:
        return jsonify({'error': 'end_date must be after or equal to start_date'}), 400

    total_days = (end_date - start_date).days + 1

    try:
        leave = LeaveRequest(
            user_id=current_user.id,
            leave_type=leave_type,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            remarks=data.get('remarks'),
            status='pending',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(leave)
        db.session.commit()
        return jsonify({'leave': serialize_leave(leave)}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to create leave request'}), 500


# GET /api/leaves/my — my leave requests, newest first
@leaves_bp.route('/api/leaves/my', methods=['GET'])
@token_required
def my_leaves(current_user):
    leaves = LeaveRequest.query.filter_by(
        user_id=current_user.id
    ).order_by(LeaveRequest.created_at.desc()).all()

    return jsonify({
        'leaves': [serialize_leave(l) for l in leaves]
    }), 200


# GET /api/leaves/all — HR/Admin only, optional ?status= filter
@leaves_bp.route('/api/leaves/all', methods=['GET'])
@token_required
@role_required('hr', 'admin')
def all_leaves(current_user):
    query = LeaveRequest.query

    status_filter = request.args.get('status')
    if status_filter:
        if status_filter not in {'pending', 'approved', 'rejected'}:
            return jsonify({'error': 'Invalid status filter. Must be: pending, approved, or rejected'}), 400
        query = query.filter(LeaveRequest.status == status_filter)

    leaves = query.order_by(LeaveRequest.created_at.desc()).all()

    result = []
    for leave in leaves:
        data = serialize_leave(leave)
        user = User.query.get(leave.user_id)
        data['user'] = {
            'id': user.id,
            'employee_id': user.employee_id,
            'email': user.email
        } if user else None
        result.append(data)

    return jsonify({'leaves': result}), 200


# PUT /api/leaves/<leave_id>/status — HR/Admin approve/reject
@leaves_bp.route('/api/leaves/<int:leave_id>/status', methods=['PUT'])
@token_required
@role_required('hr', 'admin')
def update_leave_status(current_user, leave_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    new_status = data.get('status')
    if not new_status or new_status not in VALID_STATUSES:
        return jsonify({'error': 'Invalid status. Must be: approved or rejected'}), 400

    leave = LeaveRequest.query.get(leave_id)
    if not leave:
        return jsonify({'error': 'Leave request not found'}), 404

    if leave.status != 'pending':
        return jsonify({'error': f'Leave request already {leave.status}'}), 409

    try:
        leave.status = new_status
        leave.admin_comment = data.get('admin_comment')
        leave.approved_by = current_user.id
        leave.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'leave': serialize_leave(leave)}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update leave status'}), 500
