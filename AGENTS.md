# AGENTS.md

## Project shape
- Root is the Spring Boot backend (`com.samsoft.bootifull`); `bootui/` is a separate Vite/React app, not a Maven module or pnpm workspace package.
- This is intended as a reusable full-stack starter; keep auth/SSO/passkey/dashboard work template-friendly rather than project-specific.
- TanStack Router/Query/Form are installed in `bootui/`.

## Backend
- Use `./mvnw` from the repo root; the wrapper resolves Maven 3.9.16 and the POM targets Java 25.
- Run all backend tests with `./mvnw test`; they require Docker because `BootifullApplicationTests` imports `TestcontainersConfiguration` and starts `postgres:18`.
- Run one backend test with `./mvnw -Dtest=BootifullApplicationTests test`.
- `docker build -t bootifull:local .` builds `bootui` first, copies its `dist/` into `src/main/resources/static/`, packages with tests skipped, then extracts Spring Boot jar layers with `-Djarmode=tools`.
- `docker compose -f docker-compose.yaml up --build` runs the packaged app plus Postgres 18; plain Spring Boot dev uses DB-only `compose.yaml`.
- The backend has no checked-in datasource settings; runtime DB wiring comes from Spring Boot Docker Compose support (`compose.yaml`) and tests use Testcontainers.
- `compose.yaml` exposes Postgres container port `5432` without a fixed host port; use Spring Boot service connections or `docker compose port postgres 5432` instead of assuming localhost:5432.
- Flyway migrations live under `src/main/resources/db/migration/`; `V1__auth_schema.sql` owns user, OAuth identity, and WebAuthn tables.

## Frontend (`bootui/`)
- Use pnpm from `bootui/` (`pnpm-lock.yaml` is the lockfile); there is no root frontend script.
- Useful checks: `pnpm typecheck`, `pnpm build`, `pnpm lint`, and `pnpm format`.
- Vite dev server proxies `/api`, `/oauth2`, `/login`, and `/webauthn` to `http://localhost:8080`; `/oauth2` and `/login` use `changeOrigin: false` so Spring OAuth computes the local dev callback as `http://localhost:5173/login/oauth2/code/google`.
- Google OAuth local credentials are read from root `.env` keys `CLIENT_ID` and `CLIENT_SECRET`; `application.yaml` imports `.env` with a non-empty placeholder client id because Spring Security rejects an empty OAuth client id during startup.
- Vite uses `@` as `bootui/src` (`vite.config.ts`, `tsconfig*.json`); prefer `@/...` imports for app code.
- shadcn/ui is configured in `components.json` with `style: base-nova`, `@base-ui/react`, lucide icons, Tailwind CSS v4, and CSS variables in `src/index.css` (no `tailwind.config.*`).
- Prettier is configured for no semicolons, double quotes, Tailwind class sorting, and `src/index.css` as the Tailwind stylesheet.

## Local agent resources
- Repo-local skills exist for Spring Boot (`.agents/skills/java-springboot`) and for shadcn/TanStack inside `bootui/.agents/skills/`; consult them before making framework-specific changes.
