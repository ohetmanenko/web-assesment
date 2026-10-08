# Daily Ledger frontend

React 18, Ant Design 5, Vite. See the [root README](../README.md) for setup and commands.

Active entry point: `src/index.jsx`. Screens: sign in and the transaction diary. The shared transaction modal handles both creating and editing entries.

The sign-in and diary headers include an English/Italian selector. `src/helpers/core/i18n.jsx` activates the original i18next architecture and saves the choice locally. Original `common`/`core` namespaces remain available; the active diary uses matching `public/locales/en/diary.json` and `it/diary.json` dictionaries. Ant Design and dayjs share the selected locale. API category values remain canonical; user-defined category names and descriptions are not translated. Amount uses cents-first digits (1564 → 15.64), supports decimal paste with dot/comma and preserves range validation.

Desktop uses a sortable table; below 768 px, full cards show type, amount, category/date and the entire description. Edit/Delete live in a three-dot menu. Calendar dates remain separate from record timestamps: focus or tap a date to see its creation time (`HH:mm:ss`). Date ordering uses creation time to break ties within a day, and the mobile menu also supports date/amount sorting.

Unused original template components remain outside the active dependency graph.

`npm test` runs 19 tests with Node's native runner: 7 session cases against actual Axios interceptors, 8 amount-input cases and 4 shortcut cases. Session coverage includes concurrent refresh, business errors after refresh, invalid/transient refresh failures, logout ordering, stale checks and cleanup. Input coverage includes incremental cents, backspace, pasted decimals, invalid characters and boundaries. Shortcut cases cover mappings, modifiers, composition and editable targets.

Outside editable fields, `-` / `_` opens Expense and `+` / `=` opens Income. The shared form focuses Amount after animation and category loading; its prefix shows direction without changing the positive stored value. Add transaction appears immediately after Refresh in the list header. Refresh/logout use POST, superseded list requests are cancelled after writes, and submission uses a synchronous in-flight guard.
