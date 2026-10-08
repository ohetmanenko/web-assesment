# Daily Ledger

An authenticated expense and income diary built with React 18, Ant Design 5, Express and MongoDB/Mongoose.

Users can create, read, edit and delete their own transactions. The UI uses a table on desktop and full transaction cards below 768 px. Edit/Delete are available from each entry's three-dot menu, with confirmation before deletion. It includes a shared create/edit form with loading skeletons and type-specific colors/icons, category search, type filters and income/expense/balance totals. The category selector separates suggested categories from the user's saved custom categories.

The language control on sign-in and in the diary switches between English (default) and Italian, using the template's i18next architecture. The choice persists in browser storage. Labels, validation, Ant Design controls, calendar dates and USD formatting follow the selected language. Preset category labels are translated; the API retains canonical category values and user-defined names are preserved.

## Run locally

Requirements: Node.js **20.19+ (20.x)** or **22.12+**, and npm; tested with **Node 22.23.2**. Docker Desktop must be running in Linux containers mode. On Windows, finish its WSL 2 setup and restart Windows if requested. `docker version` must show both Client and Server.

From the repository root:

```sh
npm run setup
npm run db
npm run seed
```

Setup installs locked dependencies with lifecycle scripts disabled and creates local `Api/.env` / `FrontEnd/.env` files with random, distinct JWT secrets. It preserves existing env files. MongoDB 8.0 is published only on `127.0.0.1:27017`, with a persistent Docker volume.

Open two terminals at the repository root:

```sh
# Terminal 1: API
npm run api
```

```sh
# Terminal 2: frontend
npm run web
```

Open **[http://127.0.0.1:3000](http://127.0.0.1:3000)**.

- Email: `test@meblabs.com`
- Password: `testtest`
- API: `http://127.0.0.1:4000`
- Seed creates the demo user only when absent. Repeating it preserves users and transactions.

Use **127.0.0.1 consistently** for the browser, API URL and CORS origin: mixing it with `localhost` can break cookie authentication. Configure alternatives together in both env files. `.env.example` files document the variables; `npm run setup:env` creates missing local files.

The API connects to MongoDB before listening. An unavailable database produces a startup error instead of a partially running API.

### Docker is not ready yet?

For development and UI checks, a real local MongoDB process can be used while completing Docker/WSL setup:

```sh
# Keep this third terminal open, then run seed/API/frontend as above.
npm run db:local
```

This optional fallback uses MongoDB **8.2.6** downloaded from MongoDB's official distribution by `mongodb-memory-server`. The first download is large on Windows. It binds to `127.0.0.1:27017` and persists data in ignored `.local/mongodb-data`. It is separate from the Docker volume; data does not migrate automatically between them. Run one database option at a time.

### Stop and restart

Stop API/frontend/local MongoDB with Ctrl+C. For Docker:

```sh
docker compose stop mongo
docker compose up -d mongo --wait
```

The Docker volume preserves records. `docker compose down` also preserves the volume; adding `-v` deletes its data.

## Checks

```sh
npm test
npm run lint
npm run format:check
npm run build
```

The root test command runs **69 API integration tests** with Jest + Supertest against isolated MongoDB processes and **7 frontend session tests** with Node's native runner and actual Axios interceptors. They never use the development database or Docker. API cases include password hashing/login, invalid/expired tokens, POST refresh/logout, complete CRUD, exact cents, leap dates, malformed/missing IDs, category normalization/type consistency, ownership, deterministic ordering and concurrent reclassification. Frontend cases cover shared refresh, retry failures, transient refresh errors, logout ordering, stale bootstrap and disposal. First API test execution downloads a MongoDB binary; later runs reuse its cache.

Production output is `FrontEnd/dist`. The Vite build reports a large chunk warning; bundle splitting is a possible follow-up for this small MVP.

Current Jest, ESLint and Prettier commands target the active app files. Unrelated original template files remain in the working checkout and are inactive. They are omitted from the clean export below.

See the [verification report](docs/VERIFICATION.md) for manual checks, Docker readiness and dependency audit results. Frontend and API runtime audit reports are clear; the API test toolchain retains 19 moderate advisories.

## API contract

Authentication uses HttpOnly, SameSite=Lax cookies. Responses never expose password hashes or transaction owners.

| Method | Endpoint            | Result                                                  |
| ------ | ------------------- | ------------------------------------------------------- |
| POST   | `/auth/login`       | Public profile and access/refresh cookies               |
| GET    | `/auth/check`       | Current public profile, or 401                          |
| POST   | `/auth/rt`          | Refresh access cookie using a valid persisted session   |
| POST   | `/auth/logout`      | Revoke refresh session and clear cookies                |
| GET    | `/transactions`     | Current user's transactions, newest calendar date first |
| GET    | `/categories`       | Suggested and custom categories grouped by type         |
| POST   | `/transactions`     | Create a transaction (201)                              |
| GET    | `/transactions/:id` | Read one owned transaction                              |
| PATCH  | `/transactions/:id` | Update allowed fields, leaving omitted fields unchanged |
| DELETE | `/transactions/:id` | Delete one owned transaction (200)                      |

Example create body:

```json
{
  "type": "expense",
  "amountCents": 1234,
  "category": "Food & drinks",
  "date": "2026-10-08",
  "description": "Lunch"
}
```

`type`, `amountCents`, `category` and `date` are required at creation. `description` is optional.

- Money: positive safe integers, **1–999,999,999 cents** ($0.01–$9,999,999.99); USD only. The Amount input rejects letters and accepts digits with one decimal separator (`.` or `,`). The frontend converts decimal strings to cents without floating-point multiplication and validates the range and two-decimal precision.
- Date: a real calendar date in exact `YYYY-MM-DD` format, year 1900–9999. It is stored as a string rather than a timestamp to avoid timezone shifts.
- Creation/edit timestamps are stored separately. The date tooltip shows only the local creation time (`HH:mm:ss`). Sorting by date uses the transaction's calendar day, then its creation timestamp and ID to order entries consistently within a day. Desktop date/amount columns and the mobile sort menu support both directions.
- Category: trimmed, 1–64 characters; presets must match the transaction type. Custom names are normalized to Title Case, with repeated spaces collapsed. Custom categories are stored per user and type in a separate collection with a unique index, and remain available after deleting transactions.
- Choosing **Other** reveals an optional name field. Send `"category": "Other", "customCategoryName": "pet care"` to save the transaction as **Pet Care** and register that name for reuse. An omitted or blank name saves **Other**. `customCategoryName` is accepted only alongside **Other** and is not included in the stored transaction or its response. Entering a same-type preset name reuses that preset.
- Changing transaction type clears an incompatible selected category and any unfinished custom name in the form. **Other** is shared; a custom name can be retained if it is already registered for both types. The API rejects type changes that silently retain incompatible categories. Legacy custom values remain available; editing an incompatible legacy preset prompts for a valid category.
- Description: trimmed, at most 500 characters.
- Owner comes exclusively from the verified session. Client-supplied owners, unknown properties and MongoDB operators are rejected.
- Errors: 400 for invalid input; 401 for missing/invalid authentication; 404 for missing or foreign records; 409 when type/category changes concurrently between validation and update. Shape: `{ "error": 400, "message": "...", "data": { "field": "..." } }` (field is optional).

Created records include `_id`, all transaction fields, `createdAt` and `updatedAt`. List returns an array; create/read/update return a single record.

## Implementation choices and MVP limits

The app mounts explicit auth, transaction and category routes. Mongoose provides persistence, model constraints and owner-scoped indexes; request validation returns useful errors before database access. PATCH checks its original type/category in the atomic update predicate to protect classification-dependent validation. This is not full versioned conflict detection for stale browser forms. UI changes follow successful API responses and surface failures; stale list requests are cancelled so they cannot replace newer saved/deleted state. The form displays a skeleton while fetching categories, with a retry action on failure; saving keeps the entered fields visible and disables controls until the response arrives. Synchronous submit guards avoid duplicate login/form requests from repeated clicks.

Access tokens live for 15 minutes; refresh tokens live for 7 days and are stored as SHA-256 hashes with an expiry index. The frontend retries an authenticated request once after a shared refresh request. An error from the retried business request does not invalidate a successfully refreshed session. Logout waits for any pending refresh, revokes refresh and removes browser cookies; a copied access token remains valid until its 15-minute expiry. Secure cookies are enabled with `NODE_ENV=production`, which requires HTTPS.

Totals and filters run over the user's loaded records. Pagination is client-side (8 entries per page). This is suitable for the MVP; server pagination, filter endpoints, aggregate reporting, refresh-token rotation, accessibility review and browser automation tests are follow-up work. Registration, password reset, uploads, multiple currencies and legacy company/admin features are outside this implementation.

## PhpStorm

The installed PhpStorm 2026.2.3 already contains JavaScript/TypeScript, Node.js, JavaScript Debugger, React, Vite, Docker and dotenv plugins. No additional plugin installation is needed for this project.

1. Select the installed Node runtime under **Settings → Languages & Frameworks → JavaScript Runtime** (Node.js settings in older versions). On this machine it is `C:\Users\oleks\AppData\Local\hermes\node\node.exe`.
2. Set **ESLint** to automatic configuration. Each app has its own local package and `.eslintrc.js`.
3. Set **Prettier** to automatic configuration and optionally enable formatting on save. Each app has a local Prettier package and `.prettierrc.js`; an extra third-party plugin is unnecessary.
4. Shared `.run` configurations provide **API · port 4000**, **Frontend · port 3000** and **API tests**. Start MongoDB and seed before running the API.
5. Add a Docker connection to Docker Desktop once its Engine is available.

See [JetBrains React](https://www.jetbrains.com/help/phpstorm/react.html), [Node.js](https://www.jetbrains.com/help/phpstorm/developing-node-js-applications.html), [ESLint](https://www.jetbrains.com/help/phpstorm/eslint.html) and [Prettier](https://www.jetbrains.com/help/phpstorm/prettier.html).

## Security cleanup and eventual submission

An obfuscated remote-code loader in the original `Api/middlewares/swagger.js` has been preserved as a non-executable local evidence file, removed from the working app and disconnected from startup. Local env files are no longer tracked. See [security notes](docs/SECURITY.md).

**The original Git history still contains that loader.** Do not publish this checkout's existing history. Create a source-only clean export first:

```sh
npm run export:clean
```

This copies an explicit allowlist of current source/config/docs into a new timestamped folder under `.local/submission`; it excludes old Git history, evidence, secrets, dependencies, build output, database data and inactive template files. The export has the same setup/run commands.

GitHub publication, creating a new Git history, sharing access, recording/uploading Loom and submitting the company's form require a separate final decision. A [3–5 minute Loom script](docs/LOOM.md) is ready.
