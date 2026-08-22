# config.py — App configuration loaded from .env
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dayflow.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
