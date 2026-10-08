# Daily Ledger API

See the [root README](../README.md) for setup, API endpoints, tests and implementation choices.

Active entry points: `app.js` (testable Express app), `index.js` (connect database, then listen), `db/seed.js` (idempotent demo user).

`db/seed-demo.js` adds 28 fictional transactions via `npm run seed:demo` from the repository root. Stable user-scoped IDs and insert-only writes preserve existing edits and unrelated records; rerunning restores missing fixtures. Dates are anchored at first insertion, and fixture timestamps are synthetic demonstration metadata. See [recording cases](../docs/DEMO_CASES.md) for inputs, expected results and fixture-only totals.

The original template's unrelated companies, registration, uploads and history helpers remain inactive. The current app mounts auth, transaction and category routes; Jest and ESLint explicitly target the active files.
