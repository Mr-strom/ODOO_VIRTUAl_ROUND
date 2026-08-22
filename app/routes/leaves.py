# routes/leaves.py — Leave application and HR approval workflow
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from .. import db
from ..models import LeaveRequest, User
from ..auth_utils import jwt_required, hr_required

leaves_bp = Blueprint('leaves', __name__)

VALID_LEAVE_TYPES = {'paid', 'sick', 'unpaid'}
VALID_LEAVE_STATUSES = {'approved', 'rejected'}


def leave_with_user(leave):
    """Serialize leave with nested user object for HR views."""
    data = leave.to_dict()
    user = User.query.get(leave.user_id)
    data['user'] = {
        'id': user.id,
        'employee_id': user.employee_id,
        'email': user.email
    } if user else None
    return data


@leaves_bp.route('', methods=['POST'])
@jwt_required
def apply_leave():
    """POST /api/leaves — Employee applies for a leave."""
    user = g.current_user
    if user.role != 'employee':
        return jsonify({'error': 'Forbidden'}), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    leave_type = data.get('leave_type', '').strip().lower()
    start_date_str = data.get('start_date', '')
    end_date_str = data.get('end_date', '')
    remarks = data.get('remarks', '')

    if not leave_type or not start_date_str or not end_date_str:
        return jsonify({'error': 'leave_type, start_date, and end_date are required'}), 400

    # Validate leave_type
    if leave_type not in VALID_LEAVE_TYPES:
        return jsonify({'error': 'leave_type must be "paid", "sick", or "unpaid"'}), 400

    # Parse dates
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'start_date and end_date must be YYYY-MM-DD'}), 400

    if end_date < start_date:
        return jsonify({'error': 'end_date cannot be before start_date'}), 400

    total_days = (end_date - start_date).days + 1

    leave = LeaveRequest(
        user_id=user.id,
        leave_type=leave_type,
        start_date=start_date,
        end_date=end_date,
        remarks=remarks,
        status='pending'
    )
    # Set total_days if the model column exists
    if hasattr(leave, 'total_days'):
        leave.total_days = total_days

    db.session.add(leave)
    db.session.commit()

    result = leave.to_dict()
    result['total_days'] = total_days
    return jsonify(result), 201


@leaves_bp.route('/my', methods=['GET'])
@jwt_required
def my_leaves():
    """GET /api/leaves/my — Employee's own leave requests."""
    user = g.current_user
    leaves = LeaveRequest.query.filter_by(user_id=user.id).order_by(LeaveRequest.created_at.desc()).all()
    result = []
    for l in leaves:
        data = l.to_dict()
        data['total_days'] = (l.end_date - l.start_date).days + 1 if l.start_date and l.end_date else 0
        result.append(data)
    return jsonify({'leaves': result}), 200


@leaves_bp.route('/all', methods=['GET'])
@hr_required
def all_leaves():
    """GET /api/leaves/all — HR only: all leave requests. Optional ?status= filter."""
    query = LeaveRequest.query

    status_filter = request.args.get('status')
    if status_filter:
        if status_filter not in {'pending', 'approved', 'rejected'}:
            return jsonify({'error': 'Invalid status filter'}), 400
        query = query.filter(LeaveRequest.status == status_filter)

    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    result = []
    for l in leaves:
        data = leave_with_user(l)
        data['total_days'] = (l.end_date - l.start_date).days + 1 if l.start_date and l.end_date else 0
        result.append(data)
    return jsonify({'leaves': result}), 200


@leaves_bp.route('/<int:leave_id>/status', methods=['PUT'])
@hr_required
def update_leave_status(leave_id):
    """PUT /api/leaves/<id>/status — HR only: approve or reject a leave request."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    new_status = data.get('status', '').strip().lower()
    admin_comment = data.get('admin_comment', '')

    if new_status not in VALID_LEAVE_STATUSES:
        return jsonify({'error': 'status must be "approved" or "rejected"'}), 400

    leave = LeaveRequest.query.get(leave_id)
    if not leave:
        return jsonify({'error': 'Leave request not found'}), 404

    leave.status = new_status
    leave.admin_comment = admin_comment
    leave.approved_by = g.current_user.id
    leave.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(leave.to_dict()), 200
