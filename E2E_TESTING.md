# E2E Testing Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Host Machine (your computer)                           │
│                                                          │
│  ┌──────────────────┐        ┌──────────────────────┐  │
│  │ Playwright Tests │───────▶│  Frontend (Docker)   │  │
│  │  (localhost)     │        │  host.docker.internal│  │
│  └──────────────────┘        │  :5173               │  │
│           │                  └──────────────────────┘  │
│           │                            │                │
│           │                            │                │
│           └────────────────────────────┼────────────────┤
│                                        │                │
│                   ┌────────────────────▼─────┐          │
│                   │  API Backend (Docker)    │          │
│                   │  host.docker.internal    │          │
│                   │  :8888                   │          │
│                   └──────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## Problem

Playwright tests **cannot run inside the Docker container** because:

1. Alpine Linux (node:22-alpine) doesn't have the required system dependencies
2. Playwright needs full browser installations (Chromium, Firefox, WebKit)
3. These browsers require GUI libraries not available in Alpine

## Solution

**Run E2E tests from the HOST machine**, not from Docker.

### Step 1: Install Dependencies on Host

```bash
# On your host machine (outside Docker)
npm install
npx playwright install --with-deps
```

### Step 2: Configure Environment

The frontend Docker container is configured to use `host.docker.internal` to access the host's API:

**docker-compose.yaml:**

```yaml
environment:
  - PUBLIC_API_URL=http://host.docker.internal:8888
  - DOCKER_ENV=true
extra_hosts:
  - 'host.docker.internal:host-gateway'
```

This allows the frontend running in Docker to call the API on your host machine at `localhost:8888`.

### Step 3: Run Tests

```bash
# Make sure both services are running:
# 1. API backend on localhost:8888
# 2. Frontend Docker on localhost:5173

# Run E2E tests from HOST machine
npm run test:e2e

# Run specific browser only
npm run test:e2e -- --project=chromium

# Run in UI mode
npm run test:e2e:ui

# Run with debug
npm run test:e2e:debug
```

## Configuration Files

### playwright.config.ts

The config automatically detects if running in Docker:

```typescript
use: {
  // Use host.docker.internal when running in Docker, localhost otherwise
  baseURL: process.env.DOCKER_ENV ? 'http://host.docker.internal:5173' : 'http://localhost:5173',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure'
},
webServer: {
  command: 'npm run dev',
  url: process.env.DOCKER_ENV ? 'http://host.docker.internal:5173' : 'http://localhost:5173',
  reuseExistingServer: true, // Reuse Docker dev server
  timeout: 120000
}
```

## Troubleshooting

### Test Timeout / Connection Refused

**Error:** `connect ECONNREFUSED 127.0.0.1:8888`

**Solution:** Make sure the API backend is running on `localhost:8888`

```bash
# Check if API is running
curl http://localhost:8888/api/folders

# If not, start the API backend
cd ../api
docker compose up -d
```

### Frontend Not Accessible

**Error:** `waiting for http://localhost:5173 failed`

**Solution:** Make sure the frontend Docker container is running

```bash
# Check frontend status
docker compose ps

# Start frontend if not running
docker compose up -d

# Check logs
docker compose logs -f frontend
```

### Tests Pass Locally but Fail in CI

In CI, both frontend and API need to be started. See `.github/workflows/ci.yml` for the CI configuration.

## Why host.docker.internal?

- `localhost` inside a Docker container refers to the container itself
- `host.docker.internal` is a special DNS name that resolves to the host machine
- This allows containers to access services running on the host (your API at localhost:8888)

## Running Full Test Suite

```bash
# All browsers (195 tests)
npm run test:e2e

# Single browser (39 tests)
npm run test:e2e -- --project=chromium

# Failed tests only
npm run test:e2e -- --last-failed

# Specific test file
npm run test:e2e tests/e2e/lightbox.spec.ts
```

## Test Coverage

- **Folder Creation:** 8 tests
- **Folders Management:** 5 tests
- **Lightbox Feature:** 19 tests
- **Photos Display:** 8 tests

**Total:** 39 test scenarios × 5 configurations = **195 tests**

**Browsers:**

- Chromium (Desktop)
- Firefox (Desktop)
- WebKit (Safari)
- Mobile Chrome (Android)
- Mobile Safari (iOS)
