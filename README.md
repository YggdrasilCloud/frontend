# YggdrasilCloud Frontend

[![CI/CD Pipeline](https://github.com/YggdrasilCloud/frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/YggdrasilCloud/frontend/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YggdrasilCloud/frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/YggdrasilCloud/frontend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Modern photo management web application built with SvelteKit.

## Features

- 🚀 **Fast**: Built with SvelteKit for optimal performance
- 📦 **Smart Caching**: TanStack Query for efficient API data management
- 📤 **Powerful Upload**: Uppy integration with drag & drop, progress tracking, and chunked uploads
- 🎨 **Modern UI**: Clean interface inspired by FileRun and Nextcloud
- 📱 **Responsive**: Works on desktop and mobile devices
- 🔐 **Secure**: JWT authentication support

## Tech Stack

- **Framework**: SvelteKit
- **State Management**: TanStack Query (Svelte Query)
- **File Upload**: Uppy
- **Drag & Drop**: svelte-dnd-action
- **Virtualization**: svelte-virtual-list
- **Language**: TypeScript
- **Styling**: CSS (scoped)

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 22+ (if running locally without Docker)

### With Docker (Recommended)

1. Clone the repository:

```bash
git clone git@github.com:YggdrasilCloud/frontend.git
cd frontend
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
docker compose up
```

4. Open your browser at `http://localhost:5173`

### Without Docker

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PUBLIC_API_URL=http://localhost:8888
```

## Development

**Quick Start:**

```bash
# Start development server (in Docker)
docker compose up

# Frontend available at http://localhost:5173
```

**Common Commands:**

```bash
# Type checking
docker compose exec frontend npm run check

# Linting
docker compose exec frontend npm run lint

# Unit tests
docker compose exec frontend npm run test:run

# E2E tests (run on HOST, not in Docker)
npm run test:e2e
```

**Important:** E2E tests run on your host machine, not in Docker. See [E2E_TESTING.md](./E2E_TESTING.md) for setup.

For detailed development workflow, troubleshooting, and architecture, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Testing

This project has comprehensive test coverage:

### Unit Tests

```bash
# Run unit tests
docker compose exec frontend npm run test:run

# Run tests with coverage
docker compose exec frontend npm run test:coverage

# Run tests in watch mode
docker compose exec frontend npm test
```

**Current Coverage: 97.39%** 🎉

### E2E Tests

**Important:** E2E tests run on your **host machine**, not in Docker.

```bash
# Prerequisites (one-time setup)
npm install
npx playwright install --with-deps  # Requires sudo

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific browser only
npm run test:e2e -- --project=chromium
```

**Why not in Docker?** Playwright requires full browser installations and system dependencies that are not available in Alpine Linux containers.

**No sudo access?** E2E tests will run automatically in GitHub Actions CI/CD where sudo is available (currently disabled until API backend is configured in CI).

See [E2E_TESTING.md](./E2E_TESTING.md) for detailed setup and troubleshooting.

### Mutation Testing

```bash
# Run mutation tests (slow, recommended on CI only)
docker compose exec frontend npm run test:mutation
```

## Project Structure

```
src/
├── lib/
│   ├── api/              # API client and queries
│   ├── components/       # Reusable components
│   └── domain/           # Domain services (business logic)
├── routes/               # SvelteKit routes (pages)
└── app.html             # HTML template
tests/
└── e2e/                  # Playwright E2E tests
```

## API Integration

This frontend consumes the YggdrasilCloud API. Make sure the API is running and accessible at the URL specified in `PUBLIC_API_URL`.

API Repository: [YggdrasilCloud/api](https://github.com/YggdrasilCloud/api)

## Documentation

For detailed architecture and technical decisions, see [CLAUDE.md](./CLAUDE.md).

## License

MIT
