# routes/auth.py — Signup, Login, Me endpoints
from flask import Blueprint, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
from .. import db
from ..models import User, Profile, Payroll
from ..auth_utils import generate_token, jwt_required

auth_bp = Blueprint('auth', __name__)

VALID_ROLES = {'employee', 'hr'}


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """POST /api/auth/signup — Register a new user."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    employee_id = data.get('employee_id', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', '').strip().lower()

    # Validate required fields
    if not employee_id or not email or not password or not role:
        return jsonify({'error': 'employee_id, email, password, and role are required'}), 400

    # Validate role
    if role not in VALID_ROLES:
        return jsonify({'error': 'role must be "employee" or "hr"'}), 400

    # Check for duplicate
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(employee_id=employee_id).first():
        return jsonify({'error': 'Employee ID already taken'}), 400

    # Create user
    user = User(
        employee_id=employee_id,
        email=email,
        password_hash=generate_password_hash(password),
        role=role
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
    """GET /api/auth/me — Return current user + profile."""
    user = g.current_user
    result = user.to_dict()
    result['profile'] = user.profile.to_dict() if user.profile else None
    return jsonify(result), 200
