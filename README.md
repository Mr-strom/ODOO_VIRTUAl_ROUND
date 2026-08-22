# Dayflow HRMS — Backend

Flask + PostgreSQL REST API for the Dayflow Human Resource Management System.

## Tech Stack

- **Flask** (Python web framework)
- **PostgreSQL** (database)
- **SQLAlchemy** (ORM)
- **Flask-Migrate** (Alembic migrations)
- **PyJWT** (auth tokens)
- **flask-cors** (cross-origin requests)

## Setup

### 1. Clone and enter the project

```bash
git clone <repo-url>
cd dayflow-backend
```

### 2. Create virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

Copy `.env.example` to `.env` and update with your PostgreSQL credentials:

```bash
cp .env.example .env
```

```
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/dayflow
```

### 5. Create the database

```bash
createdb dayflow
# or via psql:
psql -U postgres -c "CREATE DATABASE dayflow;"
```

### 6. Run migrations

```bash
flask db init
flask db migrate -m "initial schema"
flask db upgrade
```

### 7. Run the server

```bash
flask run
```

Server starts at `http://127.0.0.1:5000`

## API Overview

| Module     | Base Path         | Access          |
|------------|-------------------|-----------------|
| Auth       | /api/auth         | Public + JWT    |
| Dashboard  | /api/dashboard    | JWT             |
| Profile    | /api/profile      | JWT             |
| Attendance | /api/attendance   | JWT             |
| Leaves     | /api/leaves       | JWT             |
| Payroll    | /api/payroll      | JWT             |

## Roles

- `employee` — can view own data, check in/out, apply for leave
- `hr` — can manage all employees, approve leaves, set payroll

## Auth

All protected routes require:
```
Authorization: Bearer <token>
```

Token is returned on signup and login.

## Notes

- `net_salary` is computed (basic_salary + hra - deductions), not stored in DB
- Password hashing uses werkzeug.security
- No email verification logic — `is_verified` is a plain boolean field
