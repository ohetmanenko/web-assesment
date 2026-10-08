# Demo data and recording cases / Демодані та сценарії запису

Усі дані вигадані. Суми й описи імітують особистий бюджет у USD; це не банківські дані й не рекомендації щодо бюджету. Набір складається з **28 записів: 5 доходів і 23 витрат** за останні 29 календарних днів, включно із сьогоднішнім.

## Підготовка

1. Запусти MongoDB і виконай у корені `npm run seed:demo`.
2. Запусти API/frontend за README; увійди як `test@meblabs.com / testtest`.
3. Натисни Refresh. Залиш English для англомовного запису, фільтр All і порожній пошук.
4. Перед записом запам’ятай поточні totals. Наявні записи збережено, тому абсолютні підсумки можуть відрізнятися від таблиці нижче.
5. Для CRUD створюй окремий запис із описом `Recording demo - coffee`; видаляй лише цей створений для запису тестовий запис.

Seed використовує сталі ID: повторний запуск не дублює записи й не переписує редагування. Видалений запис набору буде створено знову при наступному seed. Новий reference date застосовується лише до нових записів; дати існуючих не пересуваються. Користувачі й транзакції інших акаунтів не змінюються. Custom categories: Pet Care, Gym Membership (expense), Refunds (income).

Календарні дати відраховуються від UTC-дня першого запуску. `createdAt`/`updatedAt` демозаписів — вигадані timestamps тієї ж дати, потрібні для показу часу й сортування; вони не засвідчують реальний час створення або покупки. Це стосується лише seed fixtures; звичайні операції застосунку використовують системні timestamps.

| Підсумок лише початкових 28 fixtures | USD |
| --- | ---: |
| Income | 7,136.17 |
| Expenses | 2,462.25 |
| Balance | 4,673.92 |

Після ручного редагування fixtures ці контрольні суми більше не описують їх фактичний стан. Вивід seed містить суми початкового набору, а не поточні totals бази.

## Сценарії та критерії

| ID | Дії | Очікуваний результат | Навіщо показувати |
| --- | --- | --- | --- |
| D01 Login | Sign out → Fill demo credentials → Sign in. | Обидва поля заповнені; після входу видно збережені записи. | Вхід працює з реальним API; autofill не відправляє форму самостійно. |
| D02 Read/search | Ввести `Weekly groceries` у пошук. | Три початкові grocery записи: $96.42, $78.65, $112.37. | Знайти запис за описом і показати різні дати без довгого скролу. |
| D03 Type filter | Ввести `payroll`, обрати Income; потім Expense. | Income: два payroll по $3,200.00. Expense: empty results. Очистити пошук. | Фільтр і пошук працюють разом; відсутність результатів має окремий стан. |
| D04 Create | Add transaction справа від Refresh → Expense → $5.75 → Food & drinks → today → `Recording demo - coffee` → Save. | Один новий запис; expenses +$5.75, balance -$5.75, income без змін. | Створення, цілі центи та перерахунок totals після успіху API. |
| D05 Edit | Знайти `Recording demo`, меню ⋮ → Edit → $6.25 → Save. | Той самий запис; expenses ще +$0.50, balance ще -$0.50; дубліката немає. | Одна форма create/edit і точне збереження змін. |
| D06 Invalid amount | Edit демозапис → очистити Amount → ввести `0` → спробувати Save. | Помилка мінімальної суми; успішного запису немає. Cancel. | Нуль не є валідною додатною сумою. Вставка `12.345` окремо відхиляється й залишає попереднє значення. |
| D07 Dependent category | У новій чернетці обрати Expense/Transport, потім Income. | Category очищується з поясненням; іконка й кольори стають income. Cancel. | Категорія повинна відповідати типу операції; UI запобігає несумісній парі. |
| D08 Other/autocomplete | Expense → Other → додаткове поле `pEt`. | Підказка Pet Care; вибір повторно використовує назву. Clear очищує поля й приховує себе. Cancel. | Autocomplete зменшує дублювання назв, пов’язані поля очищуються разом. |
| D09 Title Case | Новий Expense $8.90 → Other → `  office   supplies  ` → description `Recording demo - supplies` → Save. | Категорія Office Supplies; при наступному відкритті є в Your categories для Expense. | Сервер нормалізує власні назви; вони доступні для повторного використання. Після показу видалити лише цей тестовий запис. |
| D10 Ordering/time | Очистити пошук; змінити сортування Date. Для прикладу пошук `Morning`; навести/сфокусувати дату. | Порядок newest/oldest змінюється; timestamp розрізняє записи одного дня. Tooltip містить тільки локальний HH:mm:ss. | Дата бізнес-операції та час створення є різними полями; seed timestamps вигадані. |
| D11 Persistence | Reload; sign out/sign in; знайти `Recording demo - coffee`. | Зберігається відредаговане $6.25. | Дані зберігаються в MongoDB; це не лише React state. |
| D12 Delete | Для власного `Recording demo - coffee` → ⋮ → Delete → Keep it; повторити й підтвердити Delete. | Спершу запис лишається; після підтвердження зникає. Expenses -$6.25, balance +$6.25. | Захист від випадкового видалення; після cleanup totals повертаються до початкових, якщо інших змін не було. |
| D13 Mobile | Відкрити viewport 390 px; перевірити список і форму. | Картки замість таблиці, без горизонтального скролу; type перший, category/date наступні, меню ⋮ доступне. | Адаптація контенту, а не лише зменшення desktop-таблиці. |
| D14 Locale | English → Italiano → Reload → English. | Вибір мови зберігається; UI/дати/USD змінюють формат. Власні назви й описи не перекладаються. | Локалізація не змінює бізнес-дані та canonical API values. |

D02–D03 описують незмінені seed fixtures; після редагування результат може відрізнятися. D10 порівнює саме календарну дату та час створення, не час фактичної покупки. Totals показують усі завантажені записи й не звужуються разом із пошуком/фільтром.

Amount тепер вводиться від центів: для $5.75 набери `575`, для $6.25 — `625`, для $8.90 — `890`. Backspace прибирає останню цифру. Готову десяткову суму можна вставити як `15.64` або `15,64`; plain digits `1564` означають $15.64. Вставка понад двох десяткових знаків відхиляється. Для повної заміни суми спочатку виділи все або очисти поле.

## Компактний маршрут запису на 4–5 хвилин

| Час | Сценарії | Англійська репліка |
| --- | --- | --- |
| 0:00–0:30 | D01; огляд реалістичного набору | “The demo contains fictional everyday income and expenses, persisted in MongoDB.” |
| 0:30–1:00 | D02–D03 | “Search and type filters help find an entry. Totals continue to describe the whole diary.” |
| 1:00–2:10 | D04–D07 | “Amounts are stored as integer cents. Editing updates the same record, and incompatible categories are cleared when the type changes.” |
| 2:10–2:45 | D08; D09 за наявності часу | “Custom categories are normalized and reusable. Autocomplete helps avoid duplicate names.” |
| 2:45–3:25 | D10–D11 | “The calendar date stays timezone-neutral; the tooltip adds the record creation time. Reloading preserves the saved entry.” |
| 3:25–4:00 | D12–D13 | “Deletion requires confirmation, and mobile uses cards with the same actions.” |
| 4:00–4:40 | D14 коротко; тести | “The app supports English and Italian. API tests cover CRUD, validation and user isolation; session tests cover refresh and logout races.” |

Не намагайся вмістити всі 14 кейсів у 5 хвилин. Обов’язковий маршрут: D01 → D02 → D04 → D05 → D06 → D07 → D11 → D12 → D13. Решта — резервні відповіді або окремий rehearsal. Перед зовнішнім показом переглянь відео та закрий env/секрети й приватні вкладки.

## English handoff notes

Run `npm run seed:demo` from the repository root with MongoDB running, then refresh the diary. This adds 28 fictional entries to the supplied demo account. Existing records and edits are preserved; repeat runs insert only missing fixture IDs. Deleted fixtures are restored on a later run. Fixture dates remain anchored to their first insertion, and seeded timestamps are fictional demonstration metadata.

The initial fixture-only totals are income **$7,136.17**, expenses **$2,462.25**, balance **$4,673.92**. Existing account data is additive, so the actual dashboard may show different totals. Recording cases above use explicit descriptions to isolate disposable records; perform deletion only on records created during the recording.

The seed is preparation tooling, not part of the HTTP transaction API. Script: `Api/db/seed-demo.js`; editable fixture source: `Api/db/demo-transactions.json`. Recording/upload/submission remain separate actions.
