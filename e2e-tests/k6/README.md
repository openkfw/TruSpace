# TruSpace k6 manual tests

These scripts are for manual API-focused load and performance checks against a
local or remote TruSpace instance.

They are not wired into CI and they work against real application data. Treat
them as an operator tool for exploratory and repeatable manual runs.

## Recommended local target

Use the backend API directly when you want to measure backend and IPFS behavior
without the Next.js proxy:

```bash
http://localhost:8000/api
```

If you want to include the Next.js proxy in the measurement, use:

```bash
http://localhost:3000/api
```

## Quick start

1. Start the stack, for example:

```bash
docker compose up -d backend ipfs0 cluster0 frontend
```

2. Create or identify a dedicated test user.

3. Create at least one workspace and one document for that user.

4. Export the required environment variables:

```bash
export K6_API_BASE_URL=http://localhost:8000/api
export K6_EMAIL=admin@example.com
export K6_PASSWORD=change-me
```

5. For repeatable manual runs, also pin the target workspace and document:

```bash
export K6_WORKSPACE_ID=<workspace-uuid>
export K6_DOC_ID=<document-uuid>
```

6. Run the smoke scenario first:

```bash
k6 run e2e-tests/k6/scenarios/smoke.js
```

7. Run the heavier scenario you want to inspect:

```bash
k6 run e2e-tests/k6/scenarios/browse.js
k6 run e2e-tests/k6/scenarios/chat.js
k6 run e2e-tests/k6/scenarios/upload.js
```

## Finding stable IDs

For manual testing, `K6_WORKSPACE_ID` and `K6_DOC_ID` are strongly recommended.
Without them, the scripts fall back to the first workspace and first document
returned by the API.

- `K6_WORKSPACE_ID`
  - easiest source: the workspace URL in the frontend
  - alternative: inspect the `GET /workspaces` response in your browser devtools
- `K6_DOC_ID`
  - easiest source: the document URL in the frontend
  - alternative: inspect the `GET /documents?workspace=...` response
- `K6_CID`
  - optional in most runs
  - use it only when you want to pin a specific document version
  - if omitted, the scripts will resolve the current CID from `GET /documents/detail/:docId`

## Scenarios

| Scenario | Purpose | Default load shape | Notes |
| --- | --- | --- | --- |
| `scenarios/smoke.js` | Sanity check for login, workspace list, document list, detail, download, and chats | `1` VU, `1` iteration | Best first run after setup changes |
| `scenarios/browse.js` | Read-heavy load for workspaces, document lists, details, and chats | `5` VUs for `5m` | Good for steady read traffic |
| `scenarios/chat.js` | Write load for `POST /chats` followed by a read | `2` VUs, `20` shared iterations | Creates persistent chat data |
| `scenarios/upload.js` | Low-volume upload load for `POST /documents` | `1` VU, `3` shared iterations | Creates persistent documents |

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

Example manual browse run with a larger think time:

```bash
K6_VUS=8 \
K6_DURATION=10m \
THINK_TIME_MS=500 \
k6 run e2e-tests/k6/scenarios/browse.js
```

Example manual chat run pinned to a known document:

```bash
K6_VUS=3 \
K6_ITERATIONS=30 \
K6_WORKSPACE_ID=<workspace-uuid> \
K6_DOC_ID=<document-uuid> \
k6 run e2e-tests/k6/scenarios/chat.js
```

## Configuration reference

| Variable | Required | Meaning |
| --- | --- | --- |
| `K6_API_BASE_URL` | Yes | API root such as `http://localhost:8000/api` |
| `K6_EMAIL` | Yes | Login email for the test user |
| `K6_PASSWORD` | Yes | Login password for the test user |
| `K6_WORKSPACE_ID` | Recommended | Pins the workspace instead of auto-selecting the first result |
| `K6_DOC_ID` | Recommended | Pins the document instead of auto-selecting the first result |
| `K6_CID` | Optional | Pins a specific document version CID |
| `K6_VUS` | Optional | Virtual users for the active scenario |
| `K6_DURATION` | Optional | Duration for `browse.js` |
| `K6_ITERATIONS` | Optional | Iterations for `smoke.js`, `chat.js`, and `upload.js` |
| `K6_MAX_DURATION` | Optional | Max runtime for `chat.js` and `upload.js` |
| `K6_SETUP_TIMEOUT` | Optional | Setup timeout for `smoke.js` |
| `THINK_TIME_MS` | Optional | Pause between iterations, default `250` ms |
| `K6_DOCUMENT_LIMIT` | Optional | Document list size used during discovery and smoke setup, default `10` |
| `K6_UPLOAD_FILENAME` | Optional | Fixture file name under `e2e-tests/k6/fixtures/`, default `sample-upload.txt` |

Note: `browse.js` currently uses `limit=10` internally for the document list
request, even if `K6_DOCUMENT_LIMIT` is set.

## What a good manual run looks like

For now, review the run manually instead of treating it as a strict pass/fail
gate.

- k6 exits with code `0`
- no threshold failures are reported
- the `checks` summary is all green, or close enough for the specific run you are evaluating
- the scenario does what you expect in the UI or API
  - `smoke.js`: can log in, list workspaces and documents, fetch detail, download, and read chats
  - `browse.js`: sustains repeated reads without obvious latency spikes or auth issues
  - `chat.js`: appends chat messages to the target document
  - `upload.js`: creates new documents in the target workspace

If a run exits successfully but the `checks` summary shows failures, treat that
as a result worth investigating.

## Data creation and cleanup

The write scenarios are intentionally non-destructive and create persistent
data.

- `chat.js`
  - appends chat messages to the target document
  - use a disposable test document or workspace when possible
- `upload.js`
  - creates new uploaded documents in the target workspace
  - delete those documents after the run if you do not want them to remain

Recommended cleanup practice:

- use a dedicated manual-test workspace
- use a dedicated manual-test document for `chat.js`
- delete uploaded test documents after `upload.js`
- delete and recreate the whole test workspace if you want a clean slate

## Troubleshooting

- Login fails immediately
  - verify `K6_API_BASE_URL`, `K6_EMAIL`, and `K6_PASSWORD`
- The script says no workspaces or no documents are available
  - create them first, or set `K6_WORKSPACE_ID` and `K6_DOC_ID`
- Writes fail while reads succeed
  - confirm the account can write to the selected workspace
- `k6` is not installed locally
  - use the Docker example above

## Useful extras

`upload.js` uses `fixtures/sample-upload.txt`, so it does not depend on a PDF
or DOCX fixture.

The scripts log in once per VU, then bootstrap the CSRF token via
`GET /workspaces`.

To observe the IPFS side before and after a run, use:

```bash
./scripts/ipfs-health.sh
```

To store a machine-readable summary, add:

```bash
--summary-export e2e-tests/k6/results/summary.json
```
