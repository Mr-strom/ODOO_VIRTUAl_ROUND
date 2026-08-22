# Dayflow — HR Management System

A full-stack HRMS built with Flask and vanilla JavaScript for the Odoo x NMIT Hackathon 2026.

## Features

- Role-based authentication (Employee / HR)
- Employee profile management
- Attendance tracking with check-in/check-out
- Leave application and approval workflow
- Payroll management with auto net salary calculation
- Responsive dashboard with role-based views

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, Flask, SQLAlchemy |
| Database | PostgreSQL |
| Auth | JWT (PyJWT) |
| Password Hashing | Werkzeug |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| API Style | REST JSON |

## Setup

### 1. Clone and enter

```bash
git clone <repo-url>
cd Odoo
```

### 2. Create virtual environment

```bash
python -m venv venv
venv\Scripts\activate     # Windows
source venv/bin/activate  # Mac/Linux
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

Copy `.env.example` to `.env` and update:

```
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/dayflow
```

### 5. Create database

```bash
createdb dayflow
```

### 6. Seed test data

```bash
python seed_data.py
```

### 7. Run the server

```bash
python run.py
```

Open `http://127.0.0.1:5000` in your browser.

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| HR | hr@dayflow.com | hrpass123 |
| Employee | emp1@dayflow.com | emppass123 |

## API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| /api/auth/signup | POST | Register | Public |
| /api/auth/login | POST | Login | Public |
| /api/auth/me | GET | Current user | JWT |
| /api/dashboard | GET | Role-based dashboard | JWT |
| /api/profile | GET/PUT | Own profile | JWT |
| /api/profiles | GET | All profiles | HR |
| /api/profiles/\<id\> | PUT | Edit any profile | HR |
| /api/attendance/checkin | POST | Check in | JWT |
| /api/attendance/checkout | POST | Check out | JWT |
| /api/attendance/my | GET | My attendance | JWT |
| /api/attendance/all | GET | All attendance | HR |
| /api/leaves | POST | Apply for leave | JWT |
| /api/leaves/my | GET | My leaves | JWT |
| /api/leaves/all | GET | All leaves | HR |
| /api/leaves/\<id\>/status | PUT | Approve/Reject | HR |
| /api/payroll/my | GET | My payroll | JWT |
| /api/payroll/all | GET | All payrolls | HR |
| /api/payroll/\<id\> | PUT | Update payroll | HR |
| /api/health | GET | Health check | Public |

## Project Structure

```
Odoo/
├── run.py                  # Entry point
├── seed_data.py            # Test data seeder
├── requirements.txt
├── .env.example
├── app/
│   ├── __init__.py         # App factory
│   ├── config.py           # Config from .env
│   ├── auth_utils.py       # JWT decorators
│   ├── models.py           # 5 SQLAlchemy models
│   └── routes/
│       ├── auth.py         # Signup, Login, Me
│       ├── dashboard.py    # Role-based dashboard
│       ├── profile.py      # Profile CRUD
│       ├── attendance.py   # Check-in/out
│       ├── leaves.py       # Leave workflow
│       ├── payroll.py      # Payroll management
│       └── analytics.py    # HR analytics
├── templates/
│   └── index.html          # Single-page frontend
└── static/
    ├── css/style.css
    └── js/app.js
```

## Team

- **Bhumesh** — Backend Architecture
- **Rishik** — API Development & Integration
- **Adithya** — Frontend Design

Built for the 8-Hour Hackathon Qualifier Round.
