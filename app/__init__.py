# app/__init__.py - Flask application factory
import os
from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    # Serve built React from dist/public/
    static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dist', 'public')
    app = Flask(__name__, static_folder=static_dir, static_url_path='')

    # Load config
    from .config import Config
    app.config.from_object(Config)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Configure CORS with explicit allowed origins
    cors_origins = app.config.get('CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000'])
    CORS(app, origins=cors_origins, supports_credentials=True, allow_headers=['Content-Type', 'Authorization'])

    # Import models so Flask-Migrate picks them up
    from . import models  # noqa

    # Register all route blueprints
    from .routes.auth import auth_bp
    from .routes.dashboard import dashboard_bp
    from .routes.profile import profile_bp
    from .routes.attendance import attendance_bp
    from .routes.leaves import leaves_bp
    from .routes.payroll import payroll_bp
    from .routes.analytics import analytics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(leaves_bp, url_prefix='/api/leaves')
    app.register_blueprint(payroll_bp, url_prefix='/api/payroll')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    # Health check - registered before catch-all
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'message': 'Dayflow API is running'}), 200

    # Catch-all: serve built React SPA for all non-API routes
    # MUST come after all blueprint registrations
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_react(path):
        # /api/* paths not matched by blueprints -> 404 JSON
        if path.startswith('api/'):
            return jsonify({'error': 'Not found'}), 404
        # Serve static assets (JS/CSS/images) if file exists in dist/public
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # All other paths -> index.html (React Router handles client routing)
        return send_from_directory(app.static_folder, 'index.html')

    # Global JSON error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method not allowed'}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500

    # Create tables if they don't exist (dev convenience)
    with app.app_context():
        db.create_all()

    return app