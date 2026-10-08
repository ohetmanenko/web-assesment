# Daily Ledger API

See the [root README](../README.md) for setup, API endpoints, tests and implementation choices.

Active entry points: `app.js` (testable Express app), `index.js` (connect database, then listen), `db/seed.js` (idempotent demo user).

The original template's unrelated companies, registration, uploads and history helpers remain inactive. The current app mounts auth, transaction and category routes; Jest and ESLint explicitly target the active files.
