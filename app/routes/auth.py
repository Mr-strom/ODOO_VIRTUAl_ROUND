# routes/auth.py — Signup, Login, Me endpoints
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from .. import db
from ..models import User, Profile, Payroll
from ..auth_utils import generate_token, jwt_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """POST /api/auth/signup — Register a new employee user.
    Public registration is strictly restricted to employee accounts.
    Administrative / HR accounts cannot be registered publicly.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    employee_id = data.get('employee_id', '').strip().upper()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    requested_role = data.get('role', 'employee').strip().lower() if data.get('role') else 'employee'

    # Security check: Prevent public privilege escalation to HR/admin
    if requested_role in {'hr', 'admin'}:
        return jsonify({
            'error': 'HR and Administrative accounts cannot be registered publicly. Please contact your organization administrator.'
        }), 403

    if requested_role != 'employee':
        return jsonify({'error': 'Invalid role requested. Public signup is limited to employee accounts.'}), 400

    # Validate required fields
    if not employee_id or not email or not password:
        return jsonify({'error': 'employee_id, email, and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    # Check for duplicate
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(employee_id=employee_id).first():
        return jsonify({'error': 'Employee ID already taken'}), 400

    # Create employee user (always role="employee")
    user = User(
        employee_id=employee_id,
        email=email,
        password_hash=generate_password_hash(password),
        role='employee'
    )
    db.session.add(user)
    db.session.flush()  # Get user.id before committing

    # Auto-create empty profile and payroll records
    profile = Profile(user_id=user.id)
    payroll = Payroll(user_id=user.id, basic_salary=0.00)
    db.session.add(profile)
    db.session.add(payroll)
    db.session.commit()

    token = generate_token(user.id)
    return jsonify({'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """POST /api/auth/login — Login with email + password."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user.id)
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required
def me():
    """GET /api/auth/me — Return current authenticated user + profile."""
    user = g.current_user
    result = user.to_dict()
    result['profile'] = user.profile.to_dict() if user.profile else None
    return jsonify({'user': result}), 200
