# routes/notifications.py — In-app notification CRUD for all users
from flask import Blueprint, jsonify, g
from .. import db
from ..models import Notification
from ..auth_utils import jwt_required

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('/my', methods=['GET'])
@jwt_required
def my_notifications():
    """GET /api/notifications/my — Return current user's notifications, newest first."""
    notifs = (
        Notification.query
        .filter_by(user_id=g.current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return jsonify({'notifications': [n.to_dict() for n in notifs]}), 200


@notifications_bp.route('/<int:notif_id>/read', methods=['PUT'])
@jwt_required
def mark_read(notif_id):
    """PUT /api/notifications/<id>/read — Mark a single notification as read."""
    notif = Notification.query.filter_by(
        id=notif_id, user_id=g.current_user.id
    ).first()
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify(notif.to_dict()), 200


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required
def mark_all_read():
    """PUT /api/notifications/read-all — Mark all current user's notifications as read."""
    Notification.query.filter_by(
        user_id=g.current_user.id, is_read=False
    ).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required
def unread_count():
    """GET /api/notifications/unread-count — Return unread count for bell badge."""
    count = Notification.query.filter_by(
        user_id=g.current_user.id, is_read=False
    ).count()
    return jsonify({'count': count}), 200
