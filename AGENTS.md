# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Wardrowbe is a self-hosted AI-powered wardrobe management app (Next.js 14 frontend + FastAPI backend + arq worker + PostgreSQL + Redis). See `README.md` for full architecture.

### Starting the dev environment

```bash
# Start all services with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run DB migrations (required after first start or schema changes)
docker compose exec backend alembic upgrade head

# Verify backend health
curl http://localhost:8000/api/v1/health
```

- Frontend: http://localhost:3000
- Backend API / Swagger: http://localhost:8000/docs
- Dev login requires `SECRET_KEY=change-me-in-production` **and** `DEBUG=true` in `.env`. If you override `SECRET_KEY`, dev credential login will not activate — this is a known gotcha.

### Running lint

- **Backend:** `ruff check backend/app/ && ruff format --check backend/app/`
- **Frontend:** `cd frontend && npm run lint`

### Running tests

- **Backend:** `docker compose exec backend python -m pytest tests/ -v --tb=short` (runs inside the container where `TEST_DATABASE_URL` is set by `docker-compose.dev.yml`)
- **Frontend:** `cd frontend && npm test` (vitest, runs locally — no Docker needed)

### Gotchas

- Backend tests **cannot** run outside Docker without manually exporting `TEST_DATABASE_URL` pointing to the dev PostgreSQL instance.
- The `.env` file is gitignored. Copy `.env.example` to `.env` and set `DEBUG=true` (it's commented out by default) to enable dev credential login.
- Docker daemon must be started with `sudo dockerd` in the cloud VM (it does not auto-start). After starting, `chmod 666 /var/run/docker.sock` allows non-root Docker access.
- Node.js 20 is required for the frontend (use nvm: `nvm use 20`).
- The `AI_BASE_URL` in `.env.example` points to Ollama on the host (`host.docker.internal:11434`). AI features won't work without a configured AI service, but the app runs fine without it.
