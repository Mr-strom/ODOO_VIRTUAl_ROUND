# config.py â€” App configuration loaded from .env
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Determine environment
    _flask_env = os.getenv('FLASK_ENV', 'development').lower()
    _is_dev = _flask_env in {'development', 'dev'} or os.getenv('FLASK_DEBUG') == '1'

    # In production, require SECRET_KEY from environment; fail startup if missing
    _secret = os.getenv('SECRET_KEY')
    if not _secret:
        if _is_dev:
            _secret = 'dayflow-dev-secret-key-32chars-minimum!!'
        else:
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION ERROR: 'SECRET_KEY' environment variable is required in production. "
                "Set a secure random SECRET_KEY (minimum 32 characters) in your environment."
            )

    SECRET_KEY = _secret
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dayflow.db')
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
    }
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_EXPIRY_HOURS = int(os.getenv('JWT_EXPIRY_HOURS', '24'))

    # CORS Origins (comma-separated list in env)
    _raw_cors = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173,http://127.0.0.1:4173')
    CORS_ORIGINS = [origin.strip() for origin in _raw_cors.split(',') if origin.strip()]
