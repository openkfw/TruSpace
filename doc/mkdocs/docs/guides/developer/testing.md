---
title: Testing
description: How to run and write tests for TruSpace — unit, integration, E2E, and CI/CD
icon: material/test-tube
tags:
  - testing
  - developer
  - ci
---

# Testing

TruSpace uses a multi-layer testing strategy: unit tests and integration tests in Jest, and end-to-end tests in Cypress.

---

## Prerequisites

The application must be running before you can execute E2E tests. If you haven't set up your dev environment yet, see the [Development Setup](setup.md) guide.

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test                # Run all tests once
npm run test:watch      # Watch mode — re-runs on file change
npm run test:coverage   # With coverage report
```

### Frontend Tests

```bash
cd frontend
npm test
```

### End-to-End Tests (Cypress)

```bash
# 1. Start the full application first
./start.sh

# 2. Move into the test folder
cd e2e-tests

# 3. Run the test suite
npm run test
```

!!! tip "WSL users"
    Cypress requires a display server on WSL. Follow the [Cypress on WSL2 setup guide](https://nickymeuleman.netlify.app/blog/gui-on-wsl2-cypress/) before running E2E tests.

!!! warning "Environment variables"
    Make sure your `.env` file is correctly configured before running E2E tests — incorrect values will cause test failures that are unrelated to your code changes.

---

## Writing Tests

### Unit Tests (Jest)

```typescript
describe('MyService', () => {
  it('should return the correct value', () => {
    const result = myService.compute(42);
    expect(result).toBe(84);
  });
});
```

### Integration Tests (supertest)

Test API endpoints end-to-end through the Express app:

```typescript
import request from 'supertest';
import app from '../app';

describe('GET /api/workspaces', () => {
  it('returns a list of workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Cookie', `session=${validSessionCookie}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

### E2E Tests (Cypress)

Cypress tests live in `e2e-tests/`. A few conventions worth noting:

- Use `data-cy` attributes on elements for stable selectors — avoid CSS classes and text-based selectors
- Scope `data-cy` attributes to the specific card or component to avoid multi-match failures
- For state-dependent UI (e.g. search results → accordion expand), respect interaction order — search first, then expand accordions last to preserve `userExpanded` state

---

## Continuous Integration / CD

TruSpace uses GitHub Actions for its CI/CD pipeline.

### Static Analysis — CodeQL

Every push and pull request runs [CodeQL](https://github.com/openkfw/TruSpace/blob/main/.github/workflows/codeql.yml), which performs static analysis to identify potential security vulnerabilities. A failing CodeQL check must be resolved before merging.

### Docker Image Build & Security Scan

On successful builds, the pipeline:

1. Builds the Docker images for all services
2. Runs **Trivy** container security scans against the built images
3. Generates **SARIF** reports that are uploaded to GitHub's Security tab

### Running Checks Locally Before Push

```bash
# Lint
npm run lint

# Type check
npm run typecheck

# Build (catches compile-time errors)
npm run build

# Unit tests
npm test
```

---

## Debugging Test Failures

For runtime errors in the running application during E2E tests, check container logs:

```bash
docker logs truspace-backend
docker logs frontend
docker logs webui
```

For more detailed debugging tips, see the [Troubleshooting guide](../../reference/troubleshooting.md).
