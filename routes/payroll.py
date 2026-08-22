from flask import Blueprint, request, jsonify
from app import db
from models import User, Payroll
from auth import token_required, role_required
from datetime import datetime

payroll_bp = Blueprint('payroll', __name__)


def serialize_payroll(payroll):
    return {
        'id': payroll.id,
        'user_id': payroll.user_id,
        'basic_salary': payroll.basic_salary,
        'hra': payroll.hra,
        'deductions': payroll.deductions,
        'net_salary': payroll.net_salary,
        'updated_at': str(payroll.updated_at) if payroll.updated_at else None
    }


# GET /api/payroll/my — return my payroll
@payroll_bp.route('/api/payroll/my', methods=['GET'])
@token_required
def my_payroll(current_user):
    payroll = Payroll.query.filter_by(user_id=current_user.id).first()
    if not payroll:
        return jsonify({'error': 'Payroll record not found'}), 404
    return jsonify({'payroll': serialize_payroll(payroll)}), 200


# GET /api/payroll/all — HR/Admin only, all payrolls with nested user
@payroll_bp.route('/api/payroll/all', methods=['GET'])
@token_required
@role_required('hr', 'admin')
def all_payrolls(current_user):
    payrolls = Payroll.query.all()
    result = []
    for payroll in payrolls:
        data = serialize_payroll(payroll)
        user = User.query.get(payroll.user_id)
        data['user'] = {
            'id': user.id,
            'employee_id': user.employee_id,
            'email': user.email
        } if user else None
        result.append(data)
    return jsonify({'payrolls': result}), 200


# PUT /api/payroll/<user_id> — HR/Admin only, update or create payroll
@payroll_bp.route('/api/payroll/<int:user_id>', methods=['PUT'])
@token_required
@role_required('hr', 'admin')
def update_payroll(current_user, user_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # Validate required fields
    basic_salary = data.get('basic_salary')
    hra = data.get('hra', 0)
    deductions = data.get('deductions', 0)

    if basic_salary is None:
        return jsonify({'error': 'basic_salary is required'}), 400

    try:
        basic_salary = float(basic_salary)
        hra = float(hra)
        deductions = float(deductions)
    except (ValueError, TypeError):
        return jsonify({'error': 'Salary fields must be numeric'}), 400

    net_salary = basic_salary + hra - deductions

    try:
        payroll = Payroll.query.filter_by(user_id=user_id).first()

        if payroll:
            payroll.basic_salary = basic_salary
            payroll.hra = hra
            payroll.deductions = deductions
            payroll.net_salary = net_salary
            payroll.updated_at = datetime.utcnow()
        else:
            payroll = Payroll(
                user_id=user_id,
                basic_salary=basic_salary,
                hra=hra,
                deductions=deductions,
                net_salary=net_salary,
                updated_at=datetime.utcnow()
            )
            db.session.add(payroll)

        db.session.commit()
        return jsonify({'payroll': serialize_payroll(payroll)}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Failed to update payroll'}), 500
