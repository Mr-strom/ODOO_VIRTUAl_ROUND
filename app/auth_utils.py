# auth_utils.py — JWT helpers and role decorators
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from flask import request, g, jsonify, current_app
from .models import User


def generate_token(user_id):
    """Generate a JWT token encoding the user's ID with iat and exp claims."""
    expiry_hours = current_app.config.get('JWT_EXPIRY_HOURS', 24)
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'iat': now,
        'exp': now + timedelta(hours=expiry_hours)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')


def jwt_required(f):
    """Decorator: require a valid JWT Bearer token. Sets g.current_user."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header missing or invalid'}), 401
        token = auth_header.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token. Please log in again.'}), 401

        user = User.query.get(payload.get('user_id'))
        if not user:
            return jsonify({'error': 'User not found or deactivated'}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def hr_required(f):
    """Decorator: require JWT AND role == 'hr'."""
    @wraps(f)
    @jwt_required
    def decorated(*args, **kwargs):
        if g.current_user.role != 'hr':
            return jsonify({'error': 'Forbidden: HR role required'}), 403
        return f(*args, **kwargs)
    return decorated
