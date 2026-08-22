# Dayflow - Human Resource Management System

A full-stack HRMS built for the 8-hour hackathon qualifier. Digitizes core HR operations: employee onboarding, profile management, attendance tracking, leave management, and payroll visibility.

> This is the **main branch** — just the project skeleton. All features are being built on separate branches.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python, Flask, SQLAlchemy |
| Database | SQLite (dev) |
| Auth | JWT (PyJWT) |
| Password Hashing | Werkzeug |
| API Style | REST JSON |

---

## Setup & Run

### Prerequisites
- Python 3.10+
- `pip`

### 1. Clone & Enter
```bash
git clone <your-repo-url>
cd Odoo
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Server
```bash
python app.py
```

Server starts at `http://127.0.0.1:5000`

Hit `/api/health` to check if everything's working.

---

## Project Structure

```
Odoo/
├── app.py
├── requirements.txt
├── .gitignore
├── README.md
├── routes/
│   └── __init__.py
├── templates/
│   └── index.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

---

## Team

| # | Name |
|---|------|
| 1 | Bhumesh  |
| 2 | Rishik |
| 3 | Adithya|

Built for the 8-Hour Hackathon Qualifier Round.

---

## License

Internal / Hackathon Submission
