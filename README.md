# Gust House Management System

A full-stack guest house management platform built for handling bookings, guest records, room assignments, expenses, payments, and operational reporting in a clean admin dashboard.

This project combines a FastAPI backend with a React + TypeScript frontend to provide a modern hotel/guest-house operations experience for staff and administrators.

## Overview

The system is designed for small to medium guest house operations where staff needs to:

- Manage room availability and booking status
- Track guest check-ins, stays, and departures
- Handle reservations and occupancy
- Record expenses and payment activity
- Review daily and financial reports
- Support multiple user roles such as staff, admin, and super admin

## Key Features

- Dashboard overview with occupancy and revenue insights
- Room management and status tracking
- Guest profile and stay management
- Reservation lifecycle management
- Expense and payment tracking
- Finance and report generation
- Audit trail support for key operational actions
- Role-based access for staff, admin, and super admin
- FastAPI public API with PostgreSQL persistence
- Modern Vite + React frontend

## Technology Stack

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic + Pydantic Settings
- JWT-based authentication support
- pytest for backend testing

### Frontend

- React 18+
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS

## Project Structure

```text
Gust_House_Management_System/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       └── router.py
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── cli.py
│   │   ├── main.py
│   │   └── __init__.py
│   ├── tests/
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── seed_dev.py
│   └── pytest.ini
├── frontend/
│   ├── public/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── docs/
│   └── screenshots/
├── .env.example
├── requirements.txt
├── render.yaml
├── vercel.json
├── README.md
└── .gitignore
```

## Screenshots

The screenshots below are UI preview mockups generated for documentation purposes to illustrate the platform experience.




## Feature Modules

### 1. Authentication and Access Control

The app includes authentication flow and role-based access routing. Users can be directed based on role:

- Staff users access core guest-house operations
- Admin users access room, reporting, and settings modules
- Super admin users access platform-level configuration and properties

### 2. Dashboard

The dashboard provides a quick operational summary of:

- Occupancy levels
- Revenue overview
- Booking activity
- Daily metrics
- Operational alerts

### 3. Rooms

Room management includes:

- Room inventory
- Room number and type handling
- Availability state
- Maintenance tracking
- Capacity and status monitoring

### 4. Guests

Guest operations include:

- Guest list and profiles
- Check-in and check-out workflows
- Stay tracking
- Guest history and notes

### 5. Reservations

Booking workflows cover:

- Reservation creation
- Check-in / check-out scheduling
- Date-based room allocation
- Stay status transitions

### 6. Expenses and Payments

Operations finance includes:

- Expense logging
- Payment tracking
- Folio updates
- Reporting and summarization

### 7. Reports and Admin Settings

Admin-level sections are designed for:

- Operational performance reviews
- Revenue and expense reports
- System configuration
- Audit and activity overview

## Prerequisites

Before running the project, make sure you have:

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ or compatible database service
- npm or yarn
- Git

## Environment Configuration

Create a root `.env` file based on `.env.example`:

```env
DATABASE_URL=postgresql+asyncpg://guest_house:change-me@localhost:5432/guest_house
SECRET_KEY=replace-with-a-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

For the frontend, create a `frontend/.env` file from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Backend Setup

From the project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

Create or configure your PostgreSQL database and update `DATABASE_URL` accordingly.

Run the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The application should be available at:

- API: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## Frontend Setup

Open a new terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite app in the browser:

- Frontend: `http://127.0.0.1:5173`

## Database and Migration Notes

This project includes Alembic configuration for schema migrations. You can use it to create and apply migrations as the model layer evolves.

Typical workflow:

```bash
cd backend
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

## Running Tests

```bash
cd backend
pytest
```

## Production / Deployment

The repository includes deployment configuration files such as:

- `render.yaml`
- `vercel.json`

These are useful for hosting the backend and frontend in a production environment. You may need to update environment variables and database connection settings for your platform.

## Default Roles and Access

The application is organized around a role-based workflow:

- `STAFF`: operational access to daily guest-house work
- `ADMIN`: management of core operational settings and reports
- `SUPER_ADMIN`: platform configuration and advanced administrative access

## Suggested Enhancements

Potential improvements for future versions:

- Email notifications for reservations and check-ins
- Mobile responsive refinements
- File upload for guest documents
- Advanced analytics and charts
- Multi-property support
- Better reporting export features (PDF/CSV)

## License

This project is intended for educational, internal, or operational prototype use. Add your preferred license if you plan to publish or distribute it publicly.

## Project Status

This repository is a functional full-stack starter for a guest house management system and is suitable for customization, extension, and deployment.

## Contact

For questions or customization requests related to this project, reach out to the repository owner or maintainers.

---

This README was expanded and adapted to present the project clearly for onboarding, setup, and demo use.
