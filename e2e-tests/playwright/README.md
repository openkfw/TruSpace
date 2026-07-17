# Playwright BDD tests

This folder contains the manual-first Playwright BDD suite for TruSpace.
Smoke coverage also runs in GitHub Actions on pushes to `dev`.

## Current scope

- Uses `playwright-bdd` on top of the Playwright test runner
- Intended to stay manual-first while smoke coverage runs in CI
- Currently generates 45 executable scenarios across 7 feature files
- Covers these user journeys:
  - authentication
  - workspace management
  - document management
  - document detail and insights
  - account management
  - workspace access and permissions
  - application experience

Broader feature drafts still live in `/temp/gherking`. Scenarios that are
not yet stable or not yet fully automatable are kept as `@wip` and excluded
from generation by default.

## Install

From `e2e-tests`:

```bash
npm install
npm run pw:install
```

## Run

Generate Playwright tests from Gherkin:

```bash
npm run pw:bdd:gen
```

Run the manual Playwright BDD tests:

```bash
npm run pw:test
```

Run the smoke subset used on `dev` pushes:

```bash
npm run pw:test:smoke
```

Run the broader CI-candidate subset locally:

```bash
npm run pw:test:ci
```

Run headed:

```bash
npm run pw:test:headed
```

Open Playwright UI mode:

```bash
npm run pw:test:ui
```

Open the latest Playwright HTML report:

```bash
npm run pw:report
```

## Environment

The tests read from `e2e-tests/.env` when present.

Useful variables:

- `BASE_URL`
- `USERNAME`
- `PASSWORD`
- `PLAYWRIGHT_WORKSPACE_PREFIX`
- `PLAYWRIGHT_UPLOAD_FILE`
- `PLAYWRIGHT_AVATAR_FILE`

## Notes

- Scenario data is cleaned up automatically with an `After` hook
- Document and workspace scenarios use dedicated per-scenario workspaces
- `@wip` scenarios are excluded in `playwright.config.ts` via `grepInvert`
- Available tags include `@smoke`, `@ci-candidate`, `@destructive`, `@sharing`, and domain tags such as `@auth` or `@document`
- `npm run pw:bdd:gen` should be run after changing feature or step files
- `npm run pw:test -- --list` is a quick way to validate generated coverage
- Smoke CI does not require backend database seeds because the suite creates and
  cleans up its own scenario data through the API
- If future CI scenarios need fixed reference data, add Knex seeds under
  `backend/src/shared/db/seeds` and start the backend with `RUN_SEEDS=true`

## Next steps

- Decide which `@wip` scenarios should be made executable next
- Expand CI from `@smoke` to the broader `@ci-candidate` set as confidence grows
- Add deterministic seed data only if a future scenario genuinely needs fixed fixtures
