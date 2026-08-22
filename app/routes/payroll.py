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
    if user.role != 'employee':
        return jsonify({'error': 'Forbidden'}), 403

    payroll = user.payroll
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404

    return jsonify(payroll.to_dict()), 200


@payroll_bp.route('/all', methods=['GET'])
@hr_required
def all_payroll():
    """GET /api/payroll/all — HR only: all payroll records with employee info + net_salary."""
    payrolls = Payroll.query.all()
    result = []
    for p in payrolls:
        data = p.to_dict()
        user = User.query.get(p.user_id)
        if user:
            data['employee'] = {
                'id': user.id,
                'employee_id': user.employee_id,
                'email': user.email,
                'role': user.role
            }
            if user.profile:
                data['employee']['full_name'] = user.profile.full_name
                data['employee']['department'] = user.profile.department
        result.append(data)
    return jsonify(result), 200


@payroll_bp.route('/<int:payroll_id>', methods=['PUT'])
@hr_required
def update_payroll(payroll_id):
    """PUT /api/payroll/<id> — HR only: update basic_salary, hra, deductions."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    payroll = Payroll.query.get(payroll_id)
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404

    # Update only provided fields
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
