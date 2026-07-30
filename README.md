# TechKraft Recruitment Dashboard

Internal candidate scoring and review dashboard for the TechKraft recruitment workflow.

## Overview

This project is a full-stack internal tool for reviewing candidates, submitting scores, and viewing AI-generated candidate summaries. It supports JWT-based authentication, role-based access control, candidate filtering, pagination, and Dockerized deployment.

## Features

- Register and log in users with JWT authentication
- Hardcoded reviewer role on registration
- Admin and reviewer role-based access control
- List candidates with filters and pagination
- View candidate detail with scores and AI summary
- Submit scores with category, rating, and optional note
- Admin-only internal notes editing
- Soft delete candidates
- Mock AI summary endpoint with async loading state
- Docker Compose setup for backend and frontend
- nginx-based frontend serving and API proxying

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- python-jose
- Passlib bcrypt

### Frontend

- React
- Vite
- TypeScript
- React Router
- Axios
- Material UI
- React Hook Form
- Yup

### Deployment

- Docker
- Docker Compose
- nginx

## Architecture

The backend is split into layers:

- `app/main.py` bootstraps the FastAPI app, CORS, routers, and startup lifecycle
- `app/database.py` configures SQLAlchemy and request-scoped DB sessions
- `app/models.py` defines the ORM tables
- `app/schemas.py` defines request validation and response shapes
- `app/auth.py` handles hashing, JWT creation, token decoding, and admin checks
- `app/routers/` contains HTTP endpoints
- `app/services/` contains query and filtering logic
- `app/seed.py` loads demo users, candidates, and scores on startup

The frontend:

- stores the access token in `localStorage`
- injects the token into API requests through Axios
- protects candidate pages with `ProtectedRoute`
- uses the logged-in user role to show admin-only UI
- displays loading and error states for async actions such as AI summary generation

## Project Structure

```text
/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── seed.py
│   │   ├── routers/
│   │   └── services/
│   ├── tests/
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── types/
│   ├── package.json
│   └── vite.config.js
└── .env.example
```

## Setup And Run

### Prerequisites

- Python 3.12+
- Node.js 20+
- Docker and Docker Compose

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker Compose

```bash
docker-compose up --build
```

## URLs

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Environment Variables

Use `.env.example` as the template. Do not commit real credentials.

```env
DATABASE_URL=sqlite:///./data/recruitment.db
SECRET_KEY=verry-verryy-top-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## API Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Candidates

- `GET /candidates/`
- `POST /candidates/`
- `GET /candidates/{id}`
- `PATCH /candidates/{id}`
- `DELETE /candidates/{id}`
- `POST /candidates/{id}/scores`
- `POST /candidates/{id}/summary`
- `GET /candidates/{id}/stream`

## Test Users

Seeded users:

- `admin@techkraft.com` / `password123`
- `reviewer@techkraft.com` / `password123`
- `reviewer2@techkraft.com` / `password123`

## Design Decisions

### 1. FastAPI backend

- **Context:** The assignment required a Python API with authentication, validation, and an async mock AI endpoint.
- **Decision:** I implemented the backend with FastAPI, SQLAlchemy, and Pydantic.
- **Trade-off:** I had to define the application wiring and schemas explicitly.

### 2. SQLite persistence

- **Context:** The project needed a database that runs reliably in local development and Docker without extra setup.
- **Decision:** I used SQLite with SQLAlchemy and persisted the file through a Docker volume.
- **Trade-off:** I accepted that SQLite is not the best production database for large-scale workloads, but it keeps the assignment simple, portable, and easy to verify.

### 3. nginx frontend serving

- **Context:** The React app needed to run as a production build and still forward API requests to the backend.
- **Decision:** I used nginx to serve the built frontend and proxy `/api` requests to the backend container.
- **Trade-off:** It added deployment configuration, but it gave a realistic containerized setup and preserved client-side routing.

## Debugging Signal

The buggy version loads every candidate into memory and filters in Python:

```python
def search_candidates(status: str, keyword: str, page: int, page_size: int):
    all_candidates = db.execute("SELECT * FROM candidates").fetchall()
    filtered = [c for c in all_candidates if c["status"] == status]
    # ... also filter by keyword in Python ...
    offset = (page - 1) * page_size
    return filtered[offset : offset + page_size]
```

The problem is:

- it fetches all rows even when only a few are needed
- it bypasses database indexes
- it paginates after filtering instead of in SQL

The correct approach is to push filtering and pagination into the database:

```python
query = db.query(Candidate).filter(Candidate.deleted_at.is_(None))

if status:
    query = query.filter(Candidate.status == status)

if keyword:
    query = query.filter(
        or_(
            Candidate.name.ilike(f"%{keyword}%"),
            Candidate.email.ilike(f"%{keyword}%"),
            Candidate.role_applied.ilike(f"%{keyword}%"),
        )
    )

total = query.count()
items = query.order_by(Candidate.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
```

## Learning Reflection

This was my first time building a full-stack project with FastAPI. I learned how to structure the backend into routes, services, schemas, and auth helpers, and how Docker Compose can connect the services cleanly. Given more time, I would make the application more modular and scalable.
