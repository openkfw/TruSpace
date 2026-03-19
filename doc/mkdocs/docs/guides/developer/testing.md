---
title: Testing
description: Testing TruSpace
icon: material/test-tube
---

# Testing

Test your TruSpace changes.

## Running Tests

### Backend Tests

```bash
cd backend
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:e2e  # E2E tests
```

## Writing Tests

### Unit Tests

Use Jest for unit testing:

```typescript
describe('MyService', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Test API endpoints with supertest:

```typescript
import request from 'supertest';

describe('GET /api/workspaces', () => {
  it('returns workspaces', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
```

## E2E Tests

Playwright tests in `e2e-tests/`:

```bash
cd e2e-tests
npm test
```
