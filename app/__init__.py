# app/__init__.py — Flask application factory
from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(
        __name__,
        template_folder='../templates',
        static_folder='../static'
    )

    # Load config
    from .config import Config
    app.config.from_object(Config)

    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

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

    # Serve frontend
    @app.route('/')
    def index():
        return render_template('index.html')

    # Health check
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok', 'message': 'Dayflow API is running'}), 200

    # Global JSON error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404

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
