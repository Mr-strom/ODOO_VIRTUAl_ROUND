# routes/payroll.py — Employee read own payroll, HR read all and update
from flask import Blueprint, request, jsonify, g
from datetime import datetime
from .. import db
from ..models import Payroll, User
from ..auth_utils import jwt_required, hr_required

payroll_bp = Blueprint('payroll', __name__)


@payroll_bp.route('/my', methods=['GET'])
@jwt_required
def my_payroll():
    """GET /api/payroll/my — Employee reads their own payroll. net_salary is computed."""
    user = g.current_user
    payroll = user.payroll
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404

    return jsonify(payroll.to_dict()), 200


@payroll_bp.route('/all', methods=['GET'])
@hr_required
def all_payroll():
    """GET /api/payroll/all — HR only: all payroll records with nested user object."""
    payrolls = Payroll.query.all()
    result = []
    for p in payrolls:
        data = p.to_dict()
        user = User.query.get(p.user_id)
        data['user'] = {
            'id': user.id,
            'employee_id': user.employee_id,
            'email': user.email
        } if user else None
        # Also include employee info for backwards compat
        if user:
            data['employee'] = {
                'id': user.id,
                'employee_id': user.employee_id,
                'email': user.email,
                'role': user.role,
                'full_name': user.profile.full_name if user.profile else None,
                'department': user.profile.department if user.profile else None
            }
        result.append(data)
    return jsonify({'payrolls': result}), 200


@payroll_bp.route('/<int:user_id>', methods=['PUT'])
@hr_required
def update_payroll(user_id):
    """PUT /api/payroll/<user_id> — HR only: update salary. Uses user_id NOT payroll record id."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    payroll = Payroll.query.filter_by(user_id=user_id).first()

    # Upsert — create if doesn't exist
    if not payroll:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        payroll = Payroll(user_id=user_id, basic_salary=0)
        db.session.add(payroll)

    if 'basic_salary' in data:
        try:
            payroll.basic_salary = float(data['basic_salary'])
        except (ValueError, TypeError):
            return jsonify({'error': 'basic_salary must be a number'}), 400

    if 'hra' in data:
        try:
            payroll.hra = float(data['hra'])
        except (ValueError, TypeError):
            return jsonify({'error': 'hra must be a number'}), 400

    if 'deductions' in data:
        try:
            payroll.deductions = float(data['deductions'])
        except (ValueError, TypeError):
            return jsonify({'error': 'deductions must be a number'}), 400

    payroll.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(payroll.to_dict()), 200
