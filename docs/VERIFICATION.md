# Verification — 2026-10-08

## Automated checks

- `npm test`: **69 API tests in 3 suites + 15 frontend tests (7 session + 8 amount-input) passed**. API tests use Jest 30.5.2, Supertest and isolated MongoDB. Session tests use Node's native runner, actual Axios interceptors and a controlled adapter; eight amount-input tests exercise the parsing/formatting helpers.
- `npm run test:coverage --prefix Api`: **94.84% statements, 89.28% branches, 100% functions, 95.41% lines** in the explicit active scope from `Api/jest.config.js`. Model definitions, startup, dormant modules and the UI are outside these percentages.
- `npm run lint`: API and frontend passed.
- `npm run format:check`: active API/frontend files passed.
- `npm run build`: passed with Vite 8.3.3; one bundle-size warning remains (about 408 KB gzipped).
- `docker compose config --quiet`: passed; configuration syntax is valid.
- `git diff --check`: passed.
- Original evidence SHA-256 still matches the recorded original.
- Local env files and evidence are ignored; env files have been removed from the Git index.
- The final-review 77-file clean application export passed `npm run setup`, `npm run build` and the complete `npm test` command independently. Its actual `Api/index.js` started on temporary port 4001 with a separate temporary MongoDB; `/` returned 200 and unauthenticated `/transactions` returned 401. Both temporary processes were stopped; the development database was never used. All 70 app/config/source files matched the working checkout byte-for-byte. Final report sources and diagrams are added to the delivery allowlist separately.
- Verified export: `.local/submission/2026-10-08T11-27-00-281Z-f0a008`. Application-source signature: `a6b97f9bdbf8b8f3b5f2a61f553a2f59836476c3dbfda81456f9702b6c70919d` (sorted relative path, NUL, bytes, NUL; excludes READMEs, docs and export script).
- The English/Italian diary dictionaries contain matching sets of **136 keys**, with no empty Italian values.

## Manual app checks

Using the local MongoDB fallback. These checks record successive iterations; earlier decimal-entry checks 4 and 24 are superseded by the cents-first editor in check 31:

1. Seed twice: user created once; second run preserved existing data.
2. Login and incorrect-password feedback.
3. Create an expense; verify its exact $12.34 value.
4. Reject $12.345 in the form before saving.
5. Edit the same record to income, $2,500.01 and February 29, 2024.
6. Reload, restart API and MongoDB, and verify the same record and date persist.
7. Sign out and sign in again.
8. Category/description search and unmatched-results empty state.
9. Confirm deletion and remove only the QA record created during verification.
10. Inspect desktop and 390 px mobile layouts, including the shared form. The later card layout below 768 px removes the need for mobile table scrolling.
11. Stop the API briefly: the table shows a useful error and Try again action; restart and retry restores the list.
12. Reload after dependency upgrades: routing, authentication and the diary render correctly.
13. Demo auto-fill populates both login inputs, clears validation errors and leaves sign-in to the submit button.
14. The transaction form displays a loading skeleton while requesting categories and enables submission once ready.
15. Selecting Transport then Income clears the incompatible category, shows an explanation and changes the form's color/icons.
16. Custom categories appear in a separate Your categories group. Selecting Other reveals the optional name with a Title Case preview; Clear removes the selection and custom-name field.
17. Editing an older income record with Food & drinks clears its incompatible category and prompts for a replacement. Cancelling preserves the saved record.
18. The extended form stacks amount/date at 390 px width and keeps its footer buttons reachable by scrolling or keyboard focus.
19. At 1024 px, Category and the optional Other name share one row; at 390 px, they stack without overflowing the form. Typing `pEt` suggests the user's existing `Pet Care` expense category, and selecting it shows the same Title Case name. Switching to Income clears the draft and excludes that expense-only suggestion.
20. The current mobile list uses full transaction cards below 768 px. Type comes first, followed by category/date on one line; descriptions wrap. At 390 px, the card list and page have no horizontal overflow. Edit opens the shared form from the three-dot menu; Delete opens a confirmation that can be cancelled with Keep it.
21. Date sorting changes entries within the same calendar day by their creation timestamps. The desktop Date header switches between descending/ascending order, and the selected order carries into the mobile list. The mobile sort menu switches back to newest first and resets pagination.
22. Focusing/tapping a date shows the record's creation time. The calendar date remains separate from record timestamps. The latest tooltip refinement displays just `HH:mm:ss`.
23. Clear is absent when Category is empty. Switching to Income updates the form's colors/icons, while keyboard focus on the inactive Expense option retains its own brown outline.
24. The Amount input accepts `12,34` as `12.34`. Typing letters or inserting `123.45abc` leaves the prior numeric value unchanged. `12.345` is still rejected by precision validation before an API write.
25. Switch to Italian, reload, and verify the selected language and HTML `lang` persist. The diary, form, calendar dates, USD formatting, preset categories and pagination follow the language; user-defined names and descriptions remain unchanged. The Italian login screen also includes the control. Return to English after verification.
26. In the Italian Other autocomplete, `tras` suggests `Trasporti`; selecting it reuses canonical `Transport` in Category and hides the optional name. Clear removes the value and its own button. A malformed amount and missing category produce Italian validation messages.
27. At 320 and 390 px, the localized header and mobile list have no horizontal document overflow. Focusing/tapping a date produces only the local creation time, such as `13:32:34`.
28. After the final session review, sign out, fill demo credentials, sign in, open/cancel the transaction form and reload. The authenticated diary returns, all existing records remain present and the inspected tab reports no console errors or warnings. This smoke check does not replace the controlled concurrency tests.
29. Move Add transaction into the transaction panel heading, immediately after Refresh. The relocated button opens the same form. At 390 px the actions occupy a separate row below the title without horizontal overflow. Frontend lint, formatting and build pass after this layout-only change.
30. The demo seed inserts 28 fictional fixtures, with $7,136.17 income, $2,462.25 expenses and $4,673.92 balance. Its second local run inserts zero duplicates. A separate temporary MongoDB check confirms repeat-run preservation of dates/manual edits, unrelated and other-user records, stable custom categories and restoration of a missing fixture. API lint/format checks pass. Browser checks confirm the 28-record diary, three `Weekly groceries` results, two `payroll` incomes and no payroll expenses. The 14 recording cases in `docs/DEMO_CASES.md` are prepared manual scenarios, not 14 newly executed automated tests.
31. Cents-first typing in the browser produces 0.01 → 0.15 → 1.56 → 15.64 for 1/5/6/4. Backspace reverses the final step; letters leave the amount unchanged. Editing opens the original $5.75 unchanged; pasting 15,64 gives 15.64, while pasting 12.345 preserves the previous value. Mobile layout checked at 390 px. All drafts cancelled; no user records modified. Eight new helper tests and all seven session tests pass, as do frontend lint/format/build.

Local browser screenshots are under ignored `.local/screenshots`. Real user records are not exported. Screenshots from the QA cycle are local verification evidence, not submission assets.

## Dependency audit

- Frontend: **0** reported vulnerabilities, including dev dependencies.
- API runtime: `npm audit --omit=dev` reports **0**.
- API full tree: **19 moderate**, **0 high**, **0 critical** reports remain in the Jest/Babel coverage configuration chain, originating from `sprintf-js`. These are development/test dependencies, absent from runtime-only installs.
- Compatible dependency fixes were applied; React Router, Vite and Jest were updated to patched major versions after checking their compatibility and rerunning checks.
- The remaining automatic fix proposes downgrading Jest to version 25. It was not applied. Review upstream fixes or a tested replacement for the coverage configuration chain separately.

An npm audit result is a dependency advisory check, not proof that all application security issues have been eliminated.

Upgrade references: [Jest 30 guide](https://jestjs.io/docs/upgrading-to-jest30), [Vite migration](https://vite.dev/guide/migration), [React Router changelog](https://reactrouter.com/changelog).

## Environment limitation

Docker CLI and Compose are installed, but Engine reports “Docker Desktop is unable to start”; WSL is not installed. The attempted non-admin WSL command could not install it in this session. Complete WSL setup from an administrator terminal and restart Windows if prompted.

Docker-backed startup and Docker-volume persistence **have not been verified on this machine**. The app, database connection ordering, seed and persistence were verified using the local MongoDB fallback. The fallback uses MongoDB 8.2.6; Compose specifies 8.0.

Final recheck: Docker CLI 29.8.2 is installed at the per-user Docker Desktop path; Engine still reports that Docker Desktop is unable to start. Compose configuration validation passes. npm audit was rerun during final review and confirmed the counts above.

## Final code review

- Refresh/logout use POST. Regression tests confirm GET returns 404 without setting cookies or revoking a refresh session.
- Malformed JSON receives a fixed message instead of parser text containing submitted fragments.
- PATCH atomically checks the type/category snapshot used during validation; a concurrent reclassification returns 409. This does not implement general stale-browser-form versioning.
- Same-day sorting is regression-tested with date, createdAt and ID, including after an edit.
- A business request failing after successful refresh no longer signs the user out. Concurrent 401s share refresh; temporary refresh failures preserve the current session; logout waits for a pending refresh; old bootstrap/provider callbacks cannot overwrite newer state.
- Superseded transaction loads are cancelled and cannot replace newer saved/deleted state. This list race is reviewed in code; no browser timing automation was added.
- Login and transaction forms use synchronous duplicate-submit guards. These are client-page guards, not server-side idempotency keys.
- Removed obsolete default-theme/stylelint commands that depended on absent tools/files.

## Before submission

Finish Docker setup and rerun `npm run db`, then seed and check the app using that database. Use `npm run export:clean` to create a fresh source-only snapshot and follow the README in it. Record Loom, create a new Git history and publish/submit only after the user's final authorization.
