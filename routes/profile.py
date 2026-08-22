from flask import Blueprint, request, jsonify
from app import db
from models import User, Profile
from auth import token_required, role_required

profile_bp = Blueprint('profile', __name__)

ALLOWED_EMPLOYEE_FIELDS = {'phone', 'address', 'profile_picture'}


def serialize_profile(profile):
    return {
        'id': profile.id,
        'user_id': profile.user_id,
        'full_name': profile.full_name,
        'phone': profile.phone,
        'address': profile.address,
        'department': profile.department,
        'designation': profile.designation,
        'joining_date': str(profile.joining_date) if profile.joining_date else None,
        'profile_picture': profile.profile_picture,
        'documents': profile.documents
    }


def serialize_user_nested(user):
    return {
        'id': user.id,
        'employee_id': user.employee_id,
        'email': user.email
    }


# GET /api/profile — return current user's profile
@profile_bp.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    return jsonify({'profile': serialize_profile(profile)}), 200


# PUT /api/profile — employee can ONLY update phone, address, profile_picture
@profile_bp.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    disallowed = set(data.keys()) - ALLOWED_EMPLOYEE_FIELDS
    if disallowed:
        return jsonify({
            'error': f'Cannot update fields: {", ".join(sorted(disallowed))}'
        }), 400

    profile = Profile.query.filter_by(user_id=current_user.id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    try:
        for field in ALLOWED_EMPLOYEE_FIELDS:
            if field in data:
                setattr(profile, field, data[field])
        db.session.commit()
        return jsonify({'profile': serialize_profile(profile)}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Update failed'}), 500


# GET /api/profiles — HR/Admin only, return all profiles with nested user
@profile_bp.route('/api/profiles', methods=['GET'])
@token_required
@role_required('hr', 'admin')
def get_all_profiles(current_user):
    profiles = Profile.query.all()
    result = []
    for profile in profiles:
        user = User.query.get(profile.user_id)
        data = serialize_profile(profile)
        data['user'] = serialize_user_nested(user) if user else None
        result.append(data)
    return jsonify({'profiles': result}), 200


# PUT /api/profiles/<user_id> — HR/Admin only, can update any field
@profile_bp.route('/api/profiles/<int:user_id>', methods=['PUT'])
@token_required
@role_required('hr', 'admin')
def update_any_profile(current_user, user_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    profile = Profile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    updatable_fields = {
        'full_name', 'phone', 'address', 'department',
        'designation', 'joining_date', 'profile_picture', 'documents'
    }

    try:
        for key, value in data.items():
            if key in updatable_fields:
                setattr(profile, key, value)
        db.session.commit()
        return jsonify({'profile': serialize_profile(profile)}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Update failed'}), 500
