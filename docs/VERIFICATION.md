# Verification — 2026-10-08

## Automated checks

- `npm test`: 3 suites, **66 tests passed**, using Jest 30.5.2, Supertest and isolated MongoDB. Category tests cover Title Case, duplicate prevention, type changes, optional Other names, legacy values, persistence after deletion and user isolation.
- `npm run lint`: API and frontend passed.
- `npm run format:check`: active API/frontend files passed.
- `npm run build`: passed with Vite 8.3.3; one bundle-size warning remains (about 392 KB gzipped).
- `docker compose config --quiet`: passed; configuration syntax is valid.
- `git diff --check`: passed.
- Original evidence SHA-256 still matches the recorded original.
- Local env files and evidence are ignored; env files have been removed from the Git index.
- The earlier 61-file allowlisted clean export passed `npm run setup`, `npm run build` and `npm run seed`. Its API started on a temporary port 4001 and returned HTTP 200; that temporary process was stopped after verification. Existing demo records were preserved. A new 66-file source export was generated after the category additions, including the API/model/tests and form skeleton.

## Manual app checks

Using the local MongoDB fallback:

1. Seed twice: user created once; second run preserved existing data.
2. Login and incorrect-password feedback.
3. Create an expense; verify its exact $12.34 value.
4. Reject $12.345 in the form before saving.
5. Edit the same record to income, $2,500.01 and February 29, 2024.
6. Reload, restart API and MongoDB, and verify the same record and date persist.
7. Sign out and sign in again.
8. Category/description search and unmatched-results empty state.
9. Confirm deletion and remove only the QA record created during verification.
10. Inspect desktop and 390 px mobile layouts, including the shared form and horizontal table scrolling.
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

## Before submission

Finish Docker setup and rerun `npm run db`, then seed and check the app using that database. Use `npm run export:clean` to create a fresh source-only snapshot and follow the README in it. Record Loom, create a new Git history and publish/submit only after the user's final authorization.
