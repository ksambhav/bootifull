# Bootifull

Bootifull is a reusable full-stack starter built with Spring Boot, Java, Postgres, React, shadcn/ui, and TanStack. It includes starter authentication flows for email/password registration, Google SSO, and WebAuthn/passkeys.

## Stack

- Backend: Spring Boot 4, Java 25, Spring Security, Spring Data JPA, Flyway
- Database: PostgreSQL 18
- Frontend: React 19, Vite, shadcn/ui, Tailwind CSS v4, TanStack Router/Query/Form
- Packaging: multi-stage Docker build with Spring Boot layered jar extraction

## Local development

### Prerequisites

- Java 25+
- Docker with Docker Compose
- pnpm 11+

### Backend

From the repository root:

```bash
./mvnw spring-boot:run
```

Spring Boot Docker Compose support uses `compose.yaml` to start a local Postgres 18 container for the backend. The compose file intentionally exposes Postgres on a random host port; let Spring Boot wire the datasource automatically.

Run backend tests:

```bash
./mvnw test
```

### Frontend

In another terminal:

```bash
cd bootui
pnpm install
pnpm dev
```

Open the Vite dev server URL, usually `http://localhost:5173`. Vite proxies `/api`, `/oauth2`, `/login`, and `/webauthn` to the backend on `http://localhost:8080`.

Useful frontend checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Google SSO setup

Create a Google OAuth client and add this redirect URI for local backend development:

```text
http://localhost:8080/login/oauth2/code/google
```

Set credentials before starting the backend:

```bash
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="your-client-id"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="your-client-secret"
./mvnw spring-boot:run
```

## Passkeys / WebAuthn

Localhost works for passkey development. For production, configure:

```bash
APP_SECURITY_WEBAUTHN_RP_ID=your-domain.com
APP_SECURITY_WEBAUTHN_ALLOWED_ORIGINS=https://your-domain.com
```

Passkeys require HTTPS outside localhost.

## Run the full stack with Docker Compose

Use the full-stack compose file explicitly:

```bash
docker compose -f docker-compose.yaml up --build
```

Then open:

```text
http://localhost:8080
```

Optional Google credentials for Docker Compose can be provided with Spring Boot's OAuth environment variables:

```bash
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID="your-client-id" \
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET="your-client-secret" \
docker compose -f docker-compose.yaml up --build
```

Stop and remove containers:

```bash
docker compose -f docker-compose.yaml down
```

Remove the database volume too:

```bash
docker compose -f docker-compose.yaml down -v
```

## Build the production image directly

```bash
docker build -t bootifull:local .
```

The Dockerfile builds the React app, copies `bootui/dist/` into Spring Boot static resources, packages the backend with tests skipped, extracts Spring Boot layers, and runs the layered application jar.
