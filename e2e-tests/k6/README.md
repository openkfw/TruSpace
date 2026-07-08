# TruSpace k6 tests

These scripts run API-focused load and performance tests against a local or remote TruSpace instance.

## Recommended local target

Use the backend API directly:

```bash
http://localhost:8000/api
```

If you want to include the Next.js proxy in the measurement, use:

```bash
http://localhost:3000/api
```

## Prerequisites

1. Start the stack, for example:

```bash
docker compose up -d backend ipfs0 cluster0 frontend
```

2. Seed a test user, at least one workspace, and at least one document.

3. Export the required environment variables:

```bash
export K6_API_BASE_URL=http://localhost:8000/api
export K6_EMAIL=admin@example.com
export K6_PASSWORD=change-me
```

Optional but recommended for stable test runs:

```bash
export K6_WORKSPACE_ID=<workspace-uuid>
export K6_DOC_ID=<document-uuid>
export K6_CID=<document-version-cid>
```

## Scenarios

- `scenarios/smoke.js`
  - sanity check for login, workspace list, document list, detail, download, and chats
- `scenarios/browse.js`
  - read-heavy load for workspaces, document lists, details, and chats
- `scenarios/chat.js`
  - write load for `POST /chats`
- `scenarios/upload.js`
  - low-volume upload load for `POST /documents`

## Running

Native k6:

```bash
k6 run e2e-tests/k6/scenarios/smoke.js
k6 run e2e-tests/k6/scenarios/browse.js
k6 run e2e-tests/k6/scenarios/chat.js
k6 run e2e-tests/k6/scenarios/upload.js
```

From the `e2e-tests` directory with the helper scripts in `package.json`:

```bash
npm run k6:smoke
npm run k6:browse
npm run k6:chat
npm run k6:upload
```

Using the official Docker image:

```bash
docker run --rm -i --network host \
  -e K6_API_BASE_URL \
  -e K6_EMAIL \
  -e K6_PASSWORD \
  -e K6_WORKSPACE_ID \
  -e K6_DOC_ID \
  -e K6_CID \
  -v "$PWD:/app" -w /app \
  grafana/k6 run e2e-tests/k6/scenarios/smoke.js
```

## Important notes

- `chat.js` and `upload.js` create persistent test data.
- `upload.js` uses `fixtures/sample-upload.txt`, so it does not depend on a PDF or DOCX fixture.
- The scripts log in once per VU, then bootstrap the CSRF token via `GET /workspaces`.
- To observe the IPFS side before and after a run, use:

```bash
./scripts/ipfs-health.sh
```

- To store a machine-readable summary, add:

```bash
--summary-export e2e-tests/k6/results/summary.json
```
