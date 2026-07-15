# Playwright BDD tests

This folder contains the manual-first Playwright BDD suite for TruSpace.

## Current scope

- Uses `playwright-bdd` on top of the Playwright test runner
- Intended to run manually for now
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

## Next steps

- Decide which `@wip` scenarios should be made executable next
- Introduce a broader regression tag set once the suite is stable enough
- Add CI execution once the environment and selectors are stable enough
