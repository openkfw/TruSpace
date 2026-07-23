Knex seed files for TruSpace belong in this directory.

The Playwright smoke workflow does not require database seeds because the test
suite provisions and cleans up its own users, workspaces, and documents via the
application API.

If a future CI scenario needs deterministic reference data, add one or more
Knex seed files here and run the backend with `RUN_SEEDS=true`.
