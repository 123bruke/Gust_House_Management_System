# Family Guest House Management System

This is an internal staff system with exactly two actors: `ADMIN` and `RECEPTION`.
Guests are database records and do not have accounts or login access. The system
supports room operations, reservations, check-in/check-out, stay extensions,
manual payments, credit balances, expenses, reports, and audit logging.

Guests have no external account access. Payments are entered manually by staff
using Cash, Telebirr, CBE Birr, Bank Transfer, or Credit.

# CTRL + C
cd "C:\Users\FSC CORE i5\Downloads\guest-house-management-master\backend"

.\.venv311\Scripts\Activate.ps1

python -m alembic upgrade head

python -m uvicorn app.main:app --reload

## Phase 1 backend

Copy `.env.example` to `backend/.env` and set the values, then install dependencies and run the PostgreSQL migration:

### Windows PowerShell

Run these commands from the repository's `backend` directory. Python 3.11 is used here because the current `psycopg2-binary` dependency may not have a prebuilt wheel for newer/free-threaded Python versions:

```powershell
py -3.11 -m venv .venv311
.\.venv311\Scripts\python.exe -m pip install --upgrade pip
.\.venv311\Scripts\python.exe -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item ..\.env.example .env }
notepad .env
.\.venv311\Scripts\python.exe -m alembic upgrade head
.\.venv311\Scripts\python.exe -m app.cli create-admin --phone-number 0908296773 --full-name "System Administrator"
.\.venv311\Scripts\python.exe -m uvicorn app.main:app --reload
```

If PowerShell says `py -3.11` is unavailable, install Python 3.11 first. Set a valid PostgreSQL `DATABASE_URL` in `.env` and make sure PostgreSQL is running before the migration. When creating the administrator, the password prompt does not display typed characters; type the password and press Enter, then type exactly the same password at the confirmation prompt. Keep the Uvicorn command running while using the API.

### macOS / Linux

```bash
cp .env.example backend/.env
cd backend
python3 -m pip install -r requirements.txt
python3 -m alembic upgrade head
```

Create the first administrator interactively. The command refuses to run if any user already exists:

```bash
python3 -m app.cli create-admin --phone-number 0908296773 --full-name "System Administrator"
```

Start the API with:

```bash
python3 -m uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for the OpenAPI documentation.

## Frontend

For local development on Windows PowerShell, open a second terminal (leave the backend running) and run:

```powershell
cd "C:\Users\FSC CORE i5\Downloads\guest-house-management-master\frontend"
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
.\.venv311\Scripts\python.exe -m uvicorn app.main:app --reload
```

The local `.env.example` points `VITE_API_BASE_URL` to `http://127.0.0.1:8000/api/v1`, matching the backend command above. If you already have a `frontend/.env`, check that its `VITE_API_BASE_URL` uses this address. After changing the frontend environment variable, restart the Vite server. The frontend runs at `http://localhost:3000`. Staff sign in using their account phone number and password. The Reports navigation opens the finance dashboard, which is available to administrators and platform administrators only. It provides daily, weekly, monthly, and yearly summaries, income sources, transaction timestamps, table/chart views, and a browser-local ETB-per-USD conversion rate. Data refreshes every 30 seconds while the page is open.
