# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev        # Start with file watch
npm run build            # Compile TypeScript

# Testing
npm run test             # Run all unit tests
npm run test -- src/path/to/file.spec.ts  # Run a single test file
npm run test:watch       # Watch mode
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests

# Code quality
npm run lint             # ESLint
npm run format           # Auto-format with Prettier
npm run checkFormat      # Verify formatting
```

## Architecture

This is a NestJS REST service for controlling irrigation devices. It connects to a [Maker API](https://community.hubitat.com/t/release-maker-api/49) for device control, stores events and programs in CouchDB, and runs a cron scheduler every minute to trigger irrigation based on configured programs.

**Data flow:**
1. Irrigation programs define when/what to water (stored in CouchDB)
2. `IrrigationSchedulerService` runs every minute via `@Cron`, fetching current device states from the Maker API and active programs from CouchDB
3. Scheduler calculates which devices should be on/off based on program intervals and sunrise/sunset times
4. Maker API calls update physical device states
5. State changes are recorded as irrigation events in CouchDB

**Modules:**
- `irrigation-programs` — CRUD for watering schedules
- `irrigation-scheduler` — Cron-based logic; `IrrigationProgram` class encapsulates per-program timing decisions
- `irrigation-events` — Event recording and querying via CouchDB Mango queries
- `rain-delay` — Temporarily pauses irrigation
- `sunrise-sunset` — Fetches sunrise/sunset times from an external API and caches them in CouchDB
- `maker-api` — HTTP client wrapping the Hubitat Maker API for device state get/set
- `database` — CouchDB connection via the Nano driver with cookie auth and periodic refresh

**Key patterns:**
- Services use `OnModuleInit` to obtain their CouchDB `DocumentScope` from `DatabaseService`
- `ConfigService` provides typed env vars via the `EnvironmentVariables` interface (`src/environment-variables.ts`)
- The scheduler is disabled during tests via `NODE_ENV` check
- Path alias `@/*` maps to `src/*`
- Tests use JSON fixture files in `mocks/` subdirectories alongside each module

## Code Style

- No semicolons, single quotes, 120-char line width (Prettier enforced)
- ESLint: airbnb-base + TypeScript rules
- Strict TypeScript: `strictNullChecks` enabled
- No comments unless the reasoning is non-obvious

## Environment

Copy `.env.local` for local development and `.env.testing` for tests. Required vars include CouchDB connection details, Maker API base URL/access token, and lat/lng coordinates for sunrise-sunset calculations. See `src/environment-variables.ts` for the full interface.
