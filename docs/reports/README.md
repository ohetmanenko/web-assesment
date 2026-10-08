# Final delivery reports

Reviewed on **2026-10-08**, against application snapshot **3b54644**. Each report has 15 sections and an equivalent 15-page PDF in the local delivery package.

- [Український звіт і підготовка до співбесіди](FINAL_REPORT_UK.md)
- [English implementation and interview report](FINAL_REPORT_EN.md)

The reports cover the same implementation and evidence. They distinguish requirements, template reuse, later enhancements, final review fixes, verified behavior and remaining limits. Generated PDFs contain navigation bookmarks and selectable text. Source architecture diagrams are in [assets](assets).

## Як підготуватися за 15–20 хвилин

1. Прочитай розділи **1–2**: що було в шаблоні, що вимагав PDF і що додано пізніше.
2. Розбери **3–7**: шлях запиту, цілі центи, календарна дата, owner isolation, cookies, refresh і категорії. Повтори приклади своїми словами.
3. Вивчи **9–10**: конкретні помилки, виправлення та межі перевірок. Важливо розрізняти 69 API-тестів, 19 frontend-тестів (7 session + 8 amount-input + 4 shortcut) та ручні browser checks.
4. Проговори відповіді **13–14** вголос. Підготуйся відкрити відповідні файли з карти коду в **15**.
5. Виконай короткий сценарій **15** на власних тестових даних. Межі MVP пояснюй за **12**.

Якщо часу зовсім мало: **1 → 3 → 9 → 13 → 14 → 15**. Для інтерв’ю англійською використовуй ті самі розділи англійської версії.

## Interviewer reading map

| Sections | Purpose |
| --- | --- |
| 1–2 | Delivered scope, assessment traceability and original scaffold |
| 3–5 | Architecture, data invariants and authentication |
| 6–8 | API, category behavior, responsive UX and localization |
| 9–10 | Final review corrections, regression cases and verification |
| 11–12 | Reproduction, clean handoff, tradeoffs and remaining work |
| 13–15 | Technical questions, demonstration and source navigation |

## Delivery status

- Verified: 69 API tests, 19 frontend tests, active-code lint/format checks, production build, clean source installation and isolated API startup.
- Docker Compose configuration validates, but Docker Engine does not start on the development machine. Local MongoDB was used; Docker-backed execution is not claimed as verified.
- Source export contains only the explicit allowlist. It excludes the original Git history, local evidence, `.env` files, databases, dependencies and inactive modules.
- GitHub publication, Loom recording/upload and submission remain external steps. No external delivery was performed.
- Both reports explain AI assistance and the absence of an audited two-hour completion claim.

See [verification](../VERIFICATION.md), [security notes](../SECURITY.md), [Loom script](../LOOM.md), and the root [startup instructions](../../README.md).

The reports include the final cents-first editor, keyboard shortcuts, autofocus, Add transaction placement and demo preparation. [DEMO_CASES.md](../DEMO_CASES.md) contains 14 manual recording cases. `npm run seed:demo` inserts 28 fictional transactions without overwriting existing edits. The final API review and earlier cold-export run are distinguished from later frontend checks; no browser E2E or Docker-backed run is claimed.
