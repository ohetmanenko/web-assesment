# Loom walkthrough (3–5 minutes)

## Before recording

Run MongoDB, seed, API and frontend using the README. Run `npm test`, `npm run lint` and `npm run build`. Use invented demo records, close unrelated tabs and keep env files/secrets off-screen.

## 0:00–0:30 — Goal and sign-in

“This is Daily Ledger, a small expense and income diary. The API uses Express and Mongoose; the interface uses React and Ant Design. The demo account is seeded idempotently.”

Sign in with `test@meblabs.com / testtest`. Show the first-entry empty state.

## 0:30–1:30 — Create and read

Create an expense: $12.34, Food & drinks, today's date, Lunch.
Expected: exactly one new expense row, income unchanged, expenses increased by $12.34.
Show the actual row and totals.

Create an income: $2,500.01, Salary, today's date, Monthly pay.
Expected: both rows visible and the balance equals income minus expenses.
Show the type filter and category/description search.

## 1:30–2:20 — Edit, validate and delete

Open the expense's three-dot menu, choose Edit, then change Lunch to $15.50 and update its description.
Expected: same record updated, no duplicate, recalculated totals.

Enter `12.345` in the form.
Expected: validation error and no API write. Show the error, then cancel.

Open the expense's three-dot menu and choose Delete.
Expected: confirmation first, then the row disappears and totals update. Show both stages.

## 2:20–2:50 — Persistence and mobile

Reload the page. Expected: income still present and session retained.
Show a narrow browser viewport: transaction cards show type first, then category/date on one line, with a full wrapped description and a three-dot actions menu. Show the date tooltip with the creation time, switch between newest/oldest sorting, and confirm the form fits without horizontal scrolling.
Sign out and sign back in. Expected: same saved records.

## 2:50–3:40 — API tests and structure

Show `npm test` and the three suites: auth, transactions and categories.
Explain the 66 tests: real MongoDB CRUD, invalid sums/dates, missing records, token/password failures, type/category validation, Title Case normalization and user isolation.

Show the active route/controller/model/validation files. Explain:

- Money is stored as integer cents.
- Calendar dates are strings to avoid timezone shifts.
- Every query scopes records to the authenticated user.
- Database connection completes before the API listens.

## 3:40–4:20 — Tradeoffs

“For the MVP, the list, filters and totals run on the loaded records. The next steps would be server pagination and reporting, refresh rotation and browser automation tests. I kept the UI in English and the currency in USD. I used the existing components and focused on complete CRUD and useful errors.”

Mention the security cleanup only if it has already been discussed with the company; do not display or run the original payload. Use a fresh clean source export and new Git history for eventual publication.

End with a brief view of the app. Review the video before sharing. Uploading and submission are separate steps.
