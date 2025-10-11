# Development Guide

## Quick Start

### 1. Start Development Environment

```bash
# Start frontend in Docker
docker compose up

# Frontend will be available at http://localhost:5173
```

The frontend runs in Docker and automatically connects to your API backend on `localhost:8888`.

### 2. Development Workflow

**All development commands run inside Docker:**

```bash
# Type checking
docker compose exec frontend npm run check

# Linting
docker compose exec frontend npm run lint
docker compose exec frontend npm run lint:fix

# Formatting
docker compose exec frontend npm run format
docker compose exec frontend npm run format:check
```

## Testing Strategy

### Unit Tests (Inside Docker)

Unit tests run inside the Docker container:

```bash
docker compose exec frontend npm run test:run       # Run once
docker compose exec frontend npm run test           # Watch mode
docker compose exec frontend npm run test:coverage  # With coverage
```

**Coverage:** 98.14% ✅

### E2E Tests (Outside Docker)

E2E tests run on your **host machine**, not in Docker:

```bash
# Prerequisites (one-time, requires sudo)
npm install
npx playwright install --with-deps

# Run tests
npm run test:e2e
```

**Why outside Docker?** Playwright needs full browsers (Chromium, Firefox, WebKit) with system dependencies that Alpine Linux doesn't provide.

See [E2E_TESTING.md](./E2E_TESTING.md) for full documentation.

## Architecture

### Docker Setup

```yaml
services:
  frontend:
    build: .
    ports:
      - '5173:5173'
    environment:
      - PUBLIC_API_URL=http://host.docker.internal:8888
    extra_hosts:
      - 'host.docker.internal:host-gateway'
```

**Why `host.docker.internal`?**

- Allows the Docker container to access services on your host machine
- Your API runs on `localhost:8888` (host)
- Docker container accesses it via `host.docker.internal:8888`

### Project Structure

```
src/
├── lib/
│   ├── api/              # API client and types
│   ├── components/       # Svelte components (tested via E2E)
│   └── domain/           # Business logic (tested via unit tests)
│       ├── error/        # Error formatting
│       ├── folder/       # Folder validation
│       ├── photo/        # Photo URL and file size
│       └── shared/       # Date, upload config
├── routes/               # SvelteKit pages
└── app.html             # HTML template

tests/
└── e2e/                  # Playwright E2E tests
```

### Domain-Driven Design

Business logic is in `src/lib/domain/`:

- ✅ Pure TypeScript (no Svelte)
- ✅ Easy to test (unit tests)
- ✅ Reusable across components

Example:

```typescript
// Domain service
import { PhotoFileSizeFormatter } from '$lib/domain/photo/PhotoFileSizeFormatter';

const sizeInMB = PhotoFileSizeFormatter.toMegabytes(1024000);
// "1.00 MB"
```

## Common Tasks

### Adding a New Feature

1. **Create domain services** (if needed):

   ```typescript
   // src/lib/domain/myfeature/MyService.ts
   export class MyService {
     static doSomething() { ... }
   }
   ```

2. **Write unit tests**:

   ```typescript
   // src/lib/domain/myfeature/MyService.test.ts
   describe('MyService', () => {
     it('should do something', () => { ... });
   });
   ```

3. **Create Svelte components**:

   ```svelte
   <!-- src/lib/components/MyComponent.svelte -->
   <script lang="ts">
   	import { MyService } from '$lib/domain/myfeature/MyService';
   </script>
   ```

4. **Write E2E tests**:

   ```typescript
   // tests/e2e/myfeature.spec.ts
   test('should do something', async ({ page }) => { ... });
   ```

5. **Run tests**:

   ```bash
   # Unit tests (in Docker)
   docker compose exec frontend npm run test:run

   # E2E tests (on host)
   npm run test:e2e
   ```

### Debugging

**Frontend logs:**

```bash
docker compose logs -f frontend
```

**Check API connectivity:**

```bash
docker compose exec frontend node -e "fetch('http://host.docker.internal:8888/api/folders').then(r => r.json()).then(console.log)"
```

**Svelte DevTools:**
Install the [Svelte DevTools](https://chrome.google.com/webstore/detail/svelte-devtools/ckolcbmkjpjmangdbmnkpjigpkddpogn) browser extension.

### Hot Reload

Changes to files trigger automatic reloads:

- ✅ `.svelte` files → HMR (instant)
- ✅ `.ts` files → Full reload (~1s)
- ❌ `package.json` → Restart Docker (`docker compose restart frontend`)

### Environment Variables

Create `.env` file (already done):

```env
PUBLIC_API_URL=http://host.docker.internal:8888
```

**Note:** For local development outside Docker, use:

```env
PUBLIC_API_URL=http://localhost:8888
```

## CI/CD

### GitHub Actions

The CI pipeline runs:

1. ✅ Linting (ESLint)
2. ✅ Formatting check (Prettier)
3. ✅ Unit tests with coverage (98.14%)
4. ✅ Type checking (svelte-check)
5. ✅ Build
6. ⚠️ E2E tests (disabled - requires API backend)
7. ⚠️ Mutation testing (main branch only)

### Enabling E2E in CI

To enable E2E tests in CI, add the API backend as a service in `.github/workflows/ci.yml`.

See [E2E_TESTING.md](./E2E_TESTING.md#cicd-configuration) for details.

## Troubleshooting

### Port 5173 already in use

```bash
docker compose down
# Find and kill process on 5173
lsof -ti:5173 | xargs kill -9
docker compose up
```

### Cannot connect to API

**Error:** `fetch failed` or `ECONNREFUSED`

**Check:**

1. Is API running? `curl http://localhost:8888/api/folders`
2. Is CORS configured? Check API logs
3. Is `host.docker.internal` working? Test with:
   ```bash
   docker compose exec frontend ping -c 1 host.docker.internal
   ```

### E2E tests fail with "browser not found"

**Solution:** Install Playwright browsers on host:

```bash
npx playwright install --with-deps  # Requires sudo
```

### Docker build fails

```bash
# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up
```

## Code Style

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Prefer interfaces over types for objects

### Svelte

- Use `<script lang="ts">` (TypeScript)
- Props at top: `export let prop: Type`
- Reactive statements: `$: computed = value * 2`
- Keep components small (<200 lines)

### Naming

- Components: `PascalCase.svelte`
- Files: `camelCase.ts`
- Domain services: `PascalCase` classes with static methods
- Tests: `*.test.ts` next to source files

### Commits

Simple, descriptive messages:

```
Add folder creation feature
Fix lightbox navigation bug
Update E2E testing documentation
```

## Resources

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Playwright Docs](https://playwright.dev)
- [Vitest Docs](https://vitest.dev)
