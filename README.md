# Family Guest House Management System

An internal web application for managing guest-house operations. Staff use the
system to manage rooms, guests, reservations, stays, payments, expenses, and
financial reports. Guests are records in the system; they do not sign in.

## Features

- Manage rooms, guest records, and reservations.
- Check guests in and out, and extend stays.
- Record payments in ETB or USD, with each currency tracked separately.
- Record expenses and review financial summaries and income details.
- Review audit events for account and operational changes.
- Use the interface in English or Amharic, with light and dark themes.

## Roles and sign-in

The application supports three staff roles:

- **Super Admin** manages platform-level properties and administration.
- **Admin** manages guest-house operations and can access administrative
  financial reports.
- **Receptionist** handles front-desk guest, reservation, and stay operations.

Staff sign in with their account username (often a phone number), password,
and selected role. Usernames may be shared across roles, but each role uses
its own account and password. Passwords are stored as hashes and cannot be
viewed by other users. Signed-in users can update their own account details.

## Requirements

- Python 3.11
- Node.js and npm
- PostgreSQL

## Local development

### 1. Configure the backend

Create a PostgreSQL database, then open PowerShell in the repository's
`backend` directory:

```powershell
py -3.11 -m venv .venv311
.\.venv311\Scripts\python.exe -m pip install --upgrade pip
.\.venv311\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item ..\.env.example .env }
notepad .env
```

Set `DATABASE_URL` to a PostgreSQL connection string for your database, and
replace `SECRET_KEY` with a long, random value. Keep `.env` private and do not
commit it.

Apply database migrations and create the first administrator. The password
will be entered interactively and will not appear on screen:

```powershell
.\.venv311\Scripts\python.exe -m alembic upgrade head
.\.venv311\Scripts\python.exe -m app.cli create-admin --phone-number 0908296773 --full-name "System Administrator"
```

The `create-admin` command only bootstraps an administrator if no users exist.
Choose the phone number and password for your deployment; the example number
above is not a default credential.

To create a platform Super Admin, use the following command when appropriate.
This command also prompts for a password:

```powershell
.\.venv311\Scripts\python.exe -m app.cli create-super-admin --phone-number 0908296774 --full-name "Platform Administrator"
```

The examples use different phone numbers for clarity; choose usernames that
fit your deployment. Create receptionist accounts through the application's
user-management interface.

Start the API from the `backend` directory:

```powershell
.\.venv311\Scripts\python.exe -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000`; interactive API
documentation is at `http://127.0.0.1:8000/docs`.

### 2. Start the frontend

Open a second PowerShell window in the repository's `frontend` directory:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

The frontend's `.env.example` points to
`http://127.0.0.1:8000/api/v1`. If you change `VITE_API_BASE_URL`, restart the
Vite development server. The frontend is available at
`http://localhost:3000`.

## macOS and Linux

From the repository root, create the backend environment file and install
dependencies:

```bash
cp .env.example backend/.env
cd backend
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Set `DATABASE_URL` and `SECRET_KEY` in `backend/.env`, then migrate the
database and create the first administrator:

```bash
python -m alembic upgrade head
python -m app.cli create-admin --phone-number 0908296773 --full-name "System Administrator"
python -m uvicorn app.main:app --reload
backend command ............. 
Set-Location "C:\Users\FSC CORE i5\Downloads\guest-house-management-master\backend"
.\.venv311\Scripts\python.exe -m uvicorn app.main:app --reload
```

In a second terminal, start the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Production notes

- Use a unique, strong `SECRET_KEY` and protect environment files and database
  credentials.
- Serve the frontend and API over HTTPS in production.
- Set `CORS_ORIGINS` to the trusted frontend origin or origins; do not use a
  wildcard for a public deployment.
- Back up the PostgreSQL database regularly and restrict access to authorized
  staff.
