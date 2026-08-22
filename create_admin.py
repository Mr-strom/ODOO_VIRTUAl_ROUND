#!/usr/bin/env python3
"""
create_admin.py — Secure Administrative CLI tool to provision HR/Admin accounts.
Usage:
    python create_admin.py --email hr@company.com --emp-id HR001 --password MySecurePassword123
"""
import argparse
import sys
from werkzeug.security import generate_password_hash
from app import create_app, db
from app.models import User, Profile, Payroll

def create_admin(employee_id, email, password, full_name="HR Administrator"):
    app = create_app()
    with app.app_context():
        # Check if already exists
        if User.query.filter_by(email=email).first():
            print(f"Error: Email '{email}' is already registered.")
            sys.exit(1)
        if User.query.filter_by(employee_id=employee_id).first():
            print(f"Error: Employee ID '{employee_id}' is already registered.")
            sys.exit(1)

        user = User(
            employee_id=employee_id.strip().upper(),
            email=email.strip().lower(),
            password_hash=generate_password_hash(password),
            role='hr',
            is_verified=True
        )
        db.session.add(user)
        db.session.flush()

        profile = Profile(
            user_id=user.id,
            full_name=full_name,
            department="People Operations",
            designation="People Operations Lead"
        )
        payroll = Payroll(
            user_id=user.id,
            basic_salary=100000.00,
            hra=25000.00,
            deductions=5000.00
        )
        db.session.add(profile)
        db.session.add(payroll)
        db.session.commit()

        print(f"Successfully provisioned HR administrator account: {email} (ID: {employee_id})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a Dayflow HR Administrator Account")
    parser.add_argument("--emp-id", required=True, help="Employee ID (e.g. HR001)")
    parser.add_argument("--email", required=True, help="Admin Email address")
    parser.add_argument("--password", required=True, help="Account password")
    parser.add_argument("--name", default="HR Administrator", help="Full name")

    args = parser.parse_args()
    create_admin(args.emp_id, args.email, args.password, args.name)
