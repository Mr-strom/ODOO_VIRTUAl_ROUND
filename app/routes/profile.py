# routes/profile.py — Own profile and HR admin profile management
from flask import Blueprint, request, jsonify, g
from .. import db
from ..models import User, Profile
from ..auth_utils import jwt_required, hr_required

profile_bp = Blueprint('profile', __name__)

# Fields employees are allowed to update on their own profile
EMPLOYEE_EDITABLE_FIELDS = {'phone', 'address', 'profile_picture'}


@profile_bp.route('/profile', methods=['GET'])
@jwt_required
def get_own_profile():
    """GET /api/profile — Return current user's own profile."""
    user = g.current_user
    profile = user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify(profile.to_dict()), 200


@profile_bp.route('/profile', methods=['PUT'])
@jwt_required
def update_own_profile():
    """PUT /api/profile — Employee can only update phone, address, profile_picture."""
    user = g.current_user

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    # Reject any keys that aren't in the allowed set
    disallowed = set(data.keys()) - EMPLOYEE_EDITABLE_FIELDS
    if disallowed:
        return jsonify({'error': f'Cannot update fields: {", ".join(sorted(disallowed))}'}), 400

    profile = user.profile
    if not profile:
        profile = Profile(user_id=user.id)
        db.session.add(profile)

    for field in EMPLOYEE_EDITABLE_FIELDS:
        if field in data:
            setattr(profile, field, data[field])

    db.session.commit()
    return jsonify(profile.to_dict()), 200


@profile_bp.route('/profiles', methods=['GET'])
@hr_required
def get_all_profiles():
    """GET /api/profiles — HR only: return all profiles with nested user object."""
    profiles = Profile.query.all()
    result = []
    for p in profiles:
        data = p.to_dict()
        user = User.query.get(p.user_id)
        data['user'] = {
            'id': user.id,
            'employee_id': user.employee_id,
            'email': user.email
        } if user else None
        result.append(data)
    return jsonify({'profiles': result}), 200


@profile_bp.route('/profiles/<int:user_id>', methods=['PUT'])
@hr_required
def update_profile_by_hr(user_id):
    """PUT /api/profiles/<id> — HR only: edit any profile field for any user."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    profile = user.profile
    if not profile:
        profile = Profile(user_id=user_id)
        db.session.add(profile)

    # All profile fields HR can edit
    allowed_fields = ['full_name', 'phone', 'address', 'department', 'designation',
                      'joining_date', 'profile_picture', 'documents']

    for field in allowed_fields:
        if field in data:
            if field == 'joining_date' and data[field]:
                from datetime import datetime
                try:
                    setattr(profile, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                except ValueError:
                    return jsonify({'error': 'joining_date must be YYYY-MM-DD'}), 400
            else:
                setattr(profile, field, data[field])

    db.session.commit()
    return jsonify(profile.to_dict()), 200
