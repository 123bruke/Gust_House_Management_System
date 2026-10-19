# Gust Guest House Management System

A polished, production-ready internal web application for managing guest-house operations. Designed for hotel and guest-house staff, the system makes it easy to manage rooms, guests, reservations, stays, payments, expenses and generate financial reports. The UI supports English and Amharic, and includes light/dark themes.

> Note: This repository contains only the application code. Staff users sign in; guests do not have accounts.


## Key Features

- Room management (types, availability, rates)
- Guest records (personal data and stay history)
- Reservation creation, modification and cancellation
- Check-in / check-out flows and stay extensions
- Payments in multiple currencies (ETB, USD) with separate tracking
- Expense tracking and financial summaries (income reports, ledgers)
- Audit logs for account and operational changes
- Role-based access control: Super Admin, Admin, Receptionist
- Bilingual UI: English and Amharic; light and dark themes


## Roles & Authentication

- Super Admin: Platform-level administration and configuration
- Admin: Operational management and finance reporting
- Receptionist: Front-desk operations (reservations, check-ins, payments)

Staff sign in using their account username (commonly a phone number), password, and selected role. Usernames may be reused across roles but each role has a separate account and password. Passwords are stored securely as hashes.


## Tech Stack

- Backend: Python 3.11, FastAPI
- Frontend: Vite + React (or your chosen framework) — served from `frontend`
- Database: PostgreSQL
- Dev tooling: Alembic for migrations, Uvicorn for local API server


## Quick Start — Development (Windows PowerShell)

1. Clone the repository and open PowerShell in the repo root.

2. Backend setup

```powershell
cd backend
py -3.11 -m venv .venv311
.\.venv311\Scripts\python.exe -m pip install --upgrade pip
.\.venv311\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item ..\.env.example .env }
notepad .env
```

- Set DATABASE_URL to your PostgreSQL connection string and set a strong SECRET_KEY in `backend/.env`.

3. Apply database migrations and create an administrator (password is prompted securely):

```powershell
.\.venv311\Scripts\python.exe -m alembic upgrade head
.\.venv311\Scripts\python.exe -m app.cli create-admin --phone-number +251900000000 --full-name "System Administrator"
```

To create a platform Super Admin (if needed):

```powershell
.\.venv311\Scripts\python.exe -m app.cli create-super-admin --phone-number +251900000001 --full-name "Platform Administrator"
```

4. Start the API:

```powershell
.\.venv311\Scripts\python.exe -m uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs


5. Frontend setup (new PowerShell window)

```powershell
cd frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Frontend dev server: http://localhost:3000


## Quick Start — macOS / Linux

```bash
# from repo root
cp .env.example backend/.env
cd backend
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
# set DATABASE_URL and SECRET_KEY in backend/.env
python -m alembic upgrade head
python -m app.cli create-admin --phone-number +251900000000 --full-name "System Administrator"
python -m uvicorn app.main:app --reload
```

In another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```


## Environment variables

Important variables (set in `backend/.env` or the deployment environment):

- DATABASE_URL — PostgreSQL connection string
- SECRET_KEY — long random secret for session/crypto
- CORS_ORIGINS — allowed frontend origin(s)
- Other variables used by your deployment (see `.env.example` files)


## Running migrations & creating users

- Migrations: `alembic upgrade head`
- Create admin: `python -m app.cli create-admin --phone-number <phone> --full-name "Name"`
- Create super admin: `python -m app.cli create-super-admin --phone-number <phone> --full-name "Name"`


## Production & Deployment Notes

- Use a strong, unique SECRET_KEY and do not commit `.env` files.
- Serve frontend and backend over HTTPS in production.
- Configure CORS_ORIGINS to exactly the frontend origin — do not use `*`.
- Regularly back up your PostgreSQL database and restrict access.

Recommended hosting setup:
- Frontend: Vercel (set Project Root to the repository root `.` so `vercel.json` builds `frontend` correctly)
- Backend: Render (use the provided `render.yaml` Blueprint or follow the Render instructions in this README)

If deploying both on Vercel, create a separate Vercel project for the backend and set its Root Directory to `backend`.


## Troubleshooting

- If Vercel is trying to install dependencies from `backend/frontend/package.json`, the Vercel project Root Directory is likely set to `backend` instead of the repository root — set it to `.` for the static frontend project.
- Check `https://<your-render-service>.onrender.com/health` to confirm API health; it should return `{"status":"ok"}`.
- Production builds will fail if `VITE_API_BASE_URL` is missing.


## Contributing

Contributions are welcome. Please open issues for bugs or feature requests, and create pull requests for fixes. Follow these guidelines:

- Write clear, focused PRs with a description of the change and motivation
- Run tests and linters before submitting
- Keep environment secrets out of commits


## License

This project does not include a license file. Add a license (MIT, Apache-2.0, etc.) if you intend to make the project open source.


## Contact

If you need help or want to collaborate, open an issue or contact the repository owner.


---

Thank you for using Gust Guest House Management System — built to make guest-house operations simple, auditable and multilingual.
