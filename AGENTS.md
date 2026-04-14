# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Wardrowbe is a self-hosted wardrobe management app with AI-powered outfit recommendations. It has a **Next.js 14 frontend** (`/frontend`) and a **FastAPI backend** (`/backend`) with a background worker (arq), PostgreSQL, and Redis.

### Running services

All services run via Docker Compose in dev mode:

```bash
cp .env.example .env
# Enable DEBUG=true and ensure SECRET_KEY=change-me-in-production for dev login
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker compose exec backend alembic upgrade head
```

- **Frontend**: http://localhost:3000 (Next.js dev server with hot reload)
- **Backend API**: http://localhost:8000 (FastAPI with hot reload)
- **API Docs**: http://localhost:8000/docs
- **Health check**: `curl http://localhost:8000/api/v1/health`

### Dev login

Dev credential login requires **both** `DEBUG=true` **and** `SECRET_KEY=change-me-in-production` (the docker-compose default). If you override `SECRET_KEY`, dev login silently deactivates. The login form in dev mode accepts any name/email.

### Lint

- Backend: `ruff check backend/app/ && ruff format --check backend/app/`
- Frontend: `cd frontend && npm run lint`

### Tests

- Backend (runs inside Docker, uses aiosqlite so no Postgres dependency for unit tests): `docker compose exec backend python -m pytest tests/ -v --tb=short`
- Frontend: `cd frontend && npm test`

### Gotchas

- The frontend Docker volume mount may create a `.next` directory owned by root. If `npm run lint` fails with `EACCES`, run `sudo chown -R $(whoami) frontend/.next`.
- After rebuilding Docker images, always re-run `docker compose exec backend alembic upgrade head` to apply any pending migrations.
- AI features (auto-tagging, outfit suggestions) require an external AI service (Ollama or OpenAI). The app functions without it, but AI-specific features will not work.
