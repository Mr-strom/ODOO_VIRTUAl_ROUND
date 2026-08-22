# Dayflow — HR Management System

A decoupled full-stack HRMS built with a React frontend and Flask REST API for the Odoo Hackathon.

🚀 **Live Demo:** https://dayflow-hrms-3vyh.onrender.com/

---

## System Architecture

Dayflow utilizes a modern decoupled two-service architecture:
- **Frontend**: React SPA styled with the Dayflow Editorial Workbench design system (Vanilla CSS, Lucide icons, responsive layout, local SVG branding assets).
- **Backend**: Python Flask REST API with SQLAlchemy ORM, JWT authentication (PyJWT with `iat`/`exp` claims), role-based access control, and configurable CORS origins.

```
┌──────────────────────────────────────┐       JSON REST API (/api)       ┌──────────────────────────────────────┐
│        React Frontend (SPA)          │ ───────────────────────────────> │           Flask REST API             │
│   (Vite / Port 3000 / Static Host)   │ <─────────────────────────────── │     (Port 5000 / Gunicorn WSGI)      │
└──────────────────────────────────────┘      Bearer JWT Authorization    └──────────────────┬───────────────────┘
                                                                                             │
                                                                                  SQLAlchemy ORM (5 tables)
                                                                                             │
                                                                                  ┌──────────▼──────────┐
                                                                                  │ PostgreSQL / SQLite │
                                                                                  └─────────────────────┘
```

---

## Features

- **Authentication & RBAC**: Secure JWT token generation with expiration (`iat`/`exp`), strict role boundary between Employee and HR/Admin.
- **Public Registration Guard**: Public signup is restricted strictly to Employee accounts. Administrative HR accounts are provisioned via administrative CLI.
- **Employee Workspace**: Dashboard overview, attendance recording (check-in / check-out), leave application, read-only payroll structure, and salary statement HTML download.
- **HR Operations Console**: Team roster, directory profile management, attendance oversight, leave approval queue, payroll salary adjustments, and 30-day analytics charts.
- **Client-Side Data Exports**: Activity attendance CSV export, payroll summary CSV export, and printable HTML payslip statements.

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| HR | `hr@dayflow.com` | `hrpass123` |
| Employee | `emp1@dayflow.com` | `emppass123` |
| Employee | `emp2@dayflow.com` | `emppass123` |
| Employee | `emp3@dayflow.com` | `emppass123` |
| Employee | `emp4@dayflow.com` | `emppass123` |
| Employee | `emp5@dayflow.com` | `emppass123` |
| Employee | `emp6@dayflow.com` | `emppass123` |
| Employee | `emp7@dayflow.com` | `emppass123` |
| Employee | `emp8@dayflow.com` | `emppass123` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Lucide React, Space Grotesk typography |
| **Backend** | Python 3.11, Flask 3, Flask-SQLAlchemy, Flask-CORS |
| **WSGI Server** | Gunicorn (Production) |
| **Database** | PostgreSQL (Production) / SQLite (Development) |
| **Auth** | PyJWT (HS256 with timestamp validation), Werkzeug Security |

---

## Local Development Setup

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup

```bash
# Enter project root and activate virtual environment
cd Odoo
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # Mac/Linux

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run local development backend (listens on port 5000)
python run.py
```

### 3. Frontend Setup

```bash
# In a separate terminal
cd Odoo/client

# Install frontend dependencies
npm install --legacy-peer-deps

# Run local development server (listens on port 3000, proxies /api -> :5000)
npm run dev
```

Open `http://localhost:3000` to interact with the Dayflow workspace.

---

## Administrative Account Provisioning

To safely create an HR / Administrator account without exposing public signup privilege escalation:

```bash
python create_admin.py --emp-id HR001 --email hr@company.com --password YourSecurePassword123 --name "Operations Lead"
```

---

## Production Deployment

The application is deployed as a **unified Render Web Service**: Flask serves the React production build as static files from `dist/public`, while API routes are mounted under `/api`.

### Render Web Service Configuration
* **Environment**: Python 3
* **Build Command**: `pip install -r requirements.txt && cd client && npm install --legacy-peer-deps && npm run build && cd ..`
* **Start Command**: `gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
* **Environment Variables**:
  * `FLASK_ENV`: `production`
  * `SECRET_KEY`: Random 32+ character string (e.g. generated via `openssl rand -hex 32`) *(Required: server will fail to start if missing)*
  * `DATABASE_URL`: PostgreSQL connection string with `sslmode=require` (e.g. `postgresql://user:pass@host:5432/dayflow?sslmode=require`)
  * `JWT_EXPIRY_HOURS`: `24`
  * `CORS_ORIGINS`: Deployed frontend domain (e.g. `https://dayflow-hrms-3vyh.onrender.com`)

### Database Seeding (Production)

To populate the production PostgreSQL database with demo users, profiles, attendance, leave requests, and payroll records:

```bash
# Option 1: Run from Render Shell (recommended)
# Go to Render Dashboard → dayflow-hrms → Shell → run:
python seed_data.py

# Option 2: Run locally with production DATABASE_URL
$env:DATABASE_URL = "postgresql://user:pass@host:5432/dbname?sslmode=require"
python seed_data.py
```

Use `--clear` only if you want to wipe existing data first.

---

## API Route Inventory

All endpoints reside under `/api`:

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Service health probe |
| `POST` | `/api/auth/signup` | Public | Employee registration (HR restricted) |
| `POST` | `/api/auth/login` | Public | Account authentication & JWT issue |
| `GET` | `/api/auth/me` | Authenticated | Session validation & user payload |
| `GET` | `/api/dashboard` | Authenticated | Role-branching summary metrics |
| `GET` | `/api/profile` | Authenticated | Own user profile data |
| `PUT` | `/api/profile` | Authenticated | Employee updates personal details |
| `GET` | `/api/profiles` | HR Only | Team directory & user accounts |
| `PUT` | `/api/profiles/<user_id>` | HR Only | HR modifies employee details |
| `POST` | `/api/attendance/checkin` | Authenticated | Record check-in |
| `POST` | `/api/attendance/checkout` | Authenticated | Record check-out |
| `GET` | `/api/attendance/my` | Authenticated | Personal attendance history |
| `GET` | `/api/attendance/all` | HR Only | Team attendance registry |
| `POST` | `/api/leaves` | Employee | Apply for leave (`paid`/`sick`/`unpaid`) |
| `GET` | `/api/leaves/my` | Authenticated | Personal leave history |
| `GET` | `/api/leaves/all` | HR Only | Team leave queue |
| `PUT` | `/api/leaves/<id>/status` | HR Only | Approve or reject leave request |
| `GET` | `/api/payroll/my` | Authenticated | Own salary structure |
| `GET` | `/api/payroll/all` | HR Only | Team salary structures |
| `PUT` | `/api/payroll/<user_id>` | HR Only | Update salary components |
| `GET` | `/api/analytics/attendance` | HR Only | 30-day attendance metrics & breakdown |
| `GET` | `/api/analytics/leaves` | HR Only | Leave categories & 6-month trends |
