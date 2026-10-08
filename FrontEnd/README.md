# Daily Ledger frontend

React 18, Ant Design 5, Vite. See the [root README](../README.md) for setup and commands.

Active entry point: `src/index.jsx`. Screens: sign in and the transaction diary. The shared transaction modal handles both creating and editing entries.

Desktop uses a sortable table; below 768 px, full cards show type, amount, category/date and the entire description. Edit/Delete live in a three-dot menu. Calendar dates remain separate from record timestamps: focus or tap a date to see its creation time (`HH:mm:ss`). Date ordering uses creation time to break ties within a day, and the mobile menu also supports date/amount sorting.

Unused original template components remain outside the active dependency graph.
