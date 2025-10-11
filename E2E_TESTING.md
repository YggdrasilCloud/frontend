# E2E Testing Guide

> **Important:** E2E tests run **OUTSIDE Docker** on your host machine, not inside the Docker container.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Host Machine (your computer)                           │
│                                                          │
│  ┌──────────────────┐        ┌──────────────────────┐  │
│  │ Playwright Tests │───────▶│  Frontend (Docker)   │  │
│  │  (localhost)     │        │  localhost:5173      │  │
│  └──────────────────┘        └──────────────────────┘  │
│           │                            │                │
│           │  Browser accesses:         │                │
│           │  localhost:5173 (frontend) │                │
│           │  localhost:8888 (API)      │                │
│           │                            │                │
│           └────────────────────────────┼────────────────┤
│                                        │                │
│                   ┌────────────────────▼─────┐          │
│                   │  API Backend             │          │
│                   │  localhost:8888          │          │
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

# Install Playwright browsers (requires sudo for system dependencies)
npx playwright install --with-deps

# If you don't have sudo access, install without dependencies:
npx playwright install
# Note: Tests may fail if system dependencies are missing
```

**Why sudo?** Playwright needs to install system libraries (libgbm, libgtk, etc.) for the browsers to work.

**Alternative: Run E2E tests in CI only** - If you can't install Playwright locally, the tests will run automatically in GitHub Actions where sudo is available.

### Step 2: Configure Environment

The frontend Docker container is configured to access the API on the host machine:

**docker-compose.yaml:**

```yaml
environment:
  - PUBLIC_API_URL=http://localhost:8888
  - DOCKER_ENV=true
```

**Important:** We use `localhost:8888` because the JavaScript code runs in YOUR browser (on the host), not inside the Docker container. The browser needs to access the API directly on the host.

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

## Why localhost instead of host.docker.internal?

When you open the frontend in your browser:

- The browser runs on YOUR computer (the host), not inside Docker
- The JavaScript code executes in the browser context
- Therefore, `localhost` in API calls refers to your host machine, where the API runs on port 8888

**Note:** `host.docker.internal` only works INSIDE Docker containers, not in your browser.

## CI/CD Configuration

### Current Status

**E2E tests are currently DISABLED in CI** (`if: false` in `.github/workflows/ci.yml`)

**Reason:** The tests require the API backend to be running, which is not currently configured in CI.

### To Enable E2E Tests in CI

You need to add the API backend as a service. Example configuration:

```yaml
test-e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  services:
    api:
      image: your-api-image:latest
      ports:
        - 8888:8888
      env:
        DATABASE_URL: sqlite:///:memory:
        # Add other API environment variables
  steps:
    # ... existing steps
```

Or use Docker Compose in CI:

```yaml
- name: Start services
  run: |
    # Start API backend
    cd ../api && docker compose up -d

    # Wait for API to be ready
    npx wait-on http://localhost:8888/api/health
```

### CI Test Results

Once enabled, E2E test results will be:

- ✅ Visible in the Actions tab
- 📊 HTML reports uploaded as artifacts
- 📝 Available for download for 30 days

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
