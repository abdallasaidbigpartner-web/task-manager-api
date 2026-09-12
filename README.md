# Task Manager API

![CI](https://github.com/abdallasaidbigpartner-web/task-manager-api/actions/workflows/ci.yml/badge.svg)

A type-safe REST API built with Express and TypeScript, using PostgreSQL for persistence, JWT for stateless authentication, and the Repository pattern to separate data access from route handling. Demonstrates TypeScript backend engineering as a standalone discipline - distinct from the Python backend work in a related repository.

## Architecture

    Client
        |
        v
    Express app (server.ts)
        |
        |-- POST /register  --> bcrypt hashing         --> PostgreSQL (ts_users)
        |-- POST /login     --> bcrypt verification    --> issues a JWT
        |-- /tasks/*         --> requireAuth middleware  --> TaskRepository (typed data-access class)
        |                                                --> PostgreSQL (tasks)
        |-- GET  /health     --> service status

## Tech Stack & Why

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | Express | Minimal, explicit, industry-standard for Node.js APIs |
| Language | TypeScript 5.7 (pinned) | TypeScript 7+ ships a Go-based compiler with no Android build target; 5.7 is fully cross-platform |
| Database | PostgreSQL (`pg`) | Relational integrity, matches the broader learning path's stack |
| Auth | JWT (`jsonwebtoken`) | Stateless sessions |
| Password hashing | bcrypt | Industry-standard, slow-by-design hashing |
| Testing | Vitest + Supertest | Real HTTP-level integration tests against the live Express app and database |

## Design Patterns

- **Repository pattern** (`taskRepository.ts`): all SQL lives in one class; route handlers never touch the database directly, making the data layer swappable and independently testable.
- **Typed contracts** (`types.ts`): shared interfaces (`Task`, `NewTaskInput`, `JwtPayload`) ensure the shape of data is consistent across the data layer, auth layer, and routes - errors surface at compile time, not runtime.
- **Middleware-based auth** (`auth.ts`): `requireAuth` is a reusable Express middleware, applied per-route, rather than duplicated auth-checking logic in every handler.

## Running Locally

    npm install
    export JWT_SECRET=a_long_random_secret_string
    export PGUSER=your_postgres_user
    npx ts-node server.ts

## Running Tests

    npx vitest run

## API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|----------------|-------------|
| `/health` | GET | No | Service status |
| `/register` | POST | No | Create a new user |
| `/login` | POST | No | Returns a JWT access token |
| `/tasks` | POST | Yes | Create a task |
| `/tasks` | GET | Yes | List the authenticated user's tasks |
| `/tasks/:id/complete` | PATCH | Yes | Mark a task complete |
| `/tasks/:id` | DELETE | Yes | Delete a task |

## Related Repositories

- [python-learning-journey](https://github.com/abdallasaidbigpartner-web/python-learning-journey)
- [typescript-learning-journey](https://github.com/abdallasaidbigpartner-web/typescript-learning-journey)
- [sql-learning-journey](https://github.com/abdallasaidbigpartner-web/sql-learning-journey)
- [ai-study-assistant](https://github.com/abdallasaidbigpartner-web/ai-study-assistant)
- [study-assistant-frontend](https://github.com/abdallasaidbigpartner-web/study-assistant-frontend)
- [ecommerce-database](https://github.com/abdallasaidbigpartner-web/ecommerce-database)
- [url-shortener-go](https://github.com/abdallasaidbigpartner-web/url-shortener-go)
