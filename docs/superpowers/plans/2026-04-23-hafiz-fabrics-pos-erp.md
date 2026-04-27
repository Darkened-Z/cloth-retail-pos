# Hafiz Fabrics POS/ERP — Implementation Plan

> **For agentic workers:** Execute task-by-task. Each task ends with `npm run build` (or `npm run dev` visual check) + a commit. This is a vibe-coded UI demo with mock data — TDD is intentionally skipped per user instruction; verification is build-success + browser eyeball.

**Goal:** Deliver a keyboard-first, neo-brutalism POS/ERP frontend demo for Hafiz Fabrics (Faisalabad) using Vite + React + TS + shadcn + Tailwind, deployable to Vercel and later wrappable in Electron.

**Architecture:** Single-page Vite app with TanStack Router, Zustand domain stores, localStorage persistence, `@react-pdf/renderer` for invoices, Recharts for dashboards. Mock data layer in `src/mock/` is the only thing the backend will replace later.

**Tech Stack:** Vite, React 18, TypeScript, shadcn/ui, Tailwind, TanStack Router, TanStack Table, Zustand, React Hook Form, Zod, Recharts, `@react-pdf/renderer`, lucide-react, `@faker-js/faker`, Google Fonts (Archivo Black, Space Grotesk, JetBrains Mono).

**Total tasks:** 26. Target: ship in 1–2 days of focused work.

---

## Task 1: Scaffold Vite + React + TS + Tailwind + shadcn

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `components.json`, `.gitignore`, `README.md`

**Steps:**

- [ ] Init git repo (`git init`), add sensible `.gitignore` (node_modules, dist, .env, .DS_Store, .vercel).
- [ ] `npm create vite@latest . -- --template react-ts` (accept overwrite prompt).
- [ ] Install deps: `npm i react-router-dom zustand @tanstack/react-router @tanstack/react-table react-hook-form zod @hookform/resolvers recharts @react-pdf/renderer lucide-react @faker-js/faker date-fns clsx tailwind-merge class-variance-authority`
- [ ] Install devDeps: `npm i -D tailwindcss@3 postcss autoprefixer @types/node`
- [ ] Init Tailwind: `npx tailwindcss init -p`
- [ ] Init shadcn: `npx shadcn@latest init` (answer: TypeScript, default style, Slate base color, CSS vars yes, `src/components/ui`, `@/` alias).
- [ ] Add shadcn components we'll use: `npx shadcn@latest add button input label dialog dropdown-menu command popover select table tabs toast tooltip separator badge`
- [ ] Configure `tsconfig.json` + `vite.config.ts` with `@/` path alias to `src/`.
- [ ] Add `index.html` `<link>` tags for Google Fonts (Archivo Black, Space Grotesk 400/500/700, JetBrains Mono 400/500).
- [ ] `src/App.tsx` renders a simple "Hafiz Fabrics POS — booting" h1 for sanity.
- [ ] Verify: `npm run build` → success. `npm run dev` → page loads.
- [ ] Commit: `chore: scaffold vite + react + ts + tailwind + shadcn`

---

## Task 2: Design tokens + global styles (neo-brutalism baseline)

**Files:**
- Modify: `tailwind.config.ts`, `src/index.css`
- Create: `src/lib/cn.ts`

**Steps:**

- [ ] Extend Tailwind theme in `tailwind.config.ts`:
  ```ts
  theme: {
    extend: {
      colors: {
        accent: '#FFB800',
        danger: '#E63946',
        success: '#2D6A4F',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '0' },
      boxShadow: {
        brutal: '4px 4px 0 #000',
        'brutal-sm': '2px 2px 0 #000',
        'brutal-lg': '6px 6px 0 #000',
      },
    },
  },
  ```
- [ ] In `src/index.css`: `@tailwind` directives, set `html,body` font-sans, bg-white, text-black, disable border-radius globally (`* { border-radius: 0 !important; }` scoped carefully — only override shadcn internals).
- [ ] `src/lib/cn.ts` → standard shadcn `cn()` helper.
- [ ] Verify: dev server shows black-on-white with new fonts.
- [ ] Commit: `feat(design): add neo-brutalism tokens and global styles`

---

## Task 3: Core UI primitives (BrutalCard, Button, Input, Select, NumberInput, ComboBox, ShortcutFooter)

**Files:**
- Create: `src/components/ui/brutal-card.tsx`, `brutal-button.tsx`, `brutal-input.tsx`, `brutal-select.tsx`, `number-input.tsx`, `combobox.tsx`, `shortcut-footer.tsx`, `kpi-tile.tsx`

**Steps:**

- [ ] `BrutalCard`: div with `border-2 border-black shadow-brutal bg-white`.
- [ ] `BrutalButton` variants: primary (bg-accent), ghost (bg-white), danger (bg-danger text-white); inverts on hover (`hover:bg-black hover:text-white`); active state removes shadow + translates (`active:shadow-none active:translate-x-[4px] active:translate-y-[4px]`).
- [ ] `BrutalInput`: wraps shadcn Input with border-2, focus:ring-accent, font-mono for numeric inputs.
- [ ] `BrutalSelect`: shadcn Select styled same way.
- [ ] `NumberInput`: BrutalInput with Pakistani-format-on-blur formatter (30,00,000 style), keeps raw number in form state.
- [ ] `ComboBox`: shadcn Command + Popover — type-to-search; arrow-key nav; Enter selects; F4 opens.
- [ ] `ShortcutFooter`: sticky bottom bar, bg-black text-white, renders array of `{key, label}` pairs.
- [ ] `KpiTile`: BrutalCard with big display font number, small caption, trend arrow (▲/▼) colored success/danger.
- [ ] Render each in an ad-hoc `/sandbox` route to eyeball.
- [ ] Commit: `feat(ui): add core neo-brutalism primitives`

---

## Task 4: TypeScript types + i18n label map

**Files:**
- Create: `src/types/index.ts` (all interfaces from spec §9), `src/types/i18n.ts`
- Create: `src/lib/i18n.ts` (t() function + EN/UR maps)

**Steps:**

- [ ] Copy all interfaces from spec §9 verbatim into `src/types/index.ts`.
- [ ] `src/lib/i18n.ts`:
  ```ts
  export const labels = {
    en: { customer: 'Customer', sales: 'Sales', dues: 'Dues', /* … ~80 keys */ },
    ur: { customer: 'گاہک', sales: 'فروخت', dues: 'واجبات', /* … */ },
  };
  export function t(key: string, mode: 'en'|'ur'|'dual' = 'dual') { /* … */ }
  ```
- [ ] Verify: `npm run build` → no type errors.
- [ ] Commit: `feat(types): add domain types and i18n label map`

---

## Task 5: Formatting + storage + shortcuts utilities

**Files:**
- Create: `src/lib/formatNumber.ts`, `formatDate.ts`, `numberToWords.ts`, `storage.ts`, `shortcuts.ts`

**Steps:**

- [ ] `formatNumber.ts` → `formatPKR(n: number): string` → `PKR 30,00,000` (Pakistani grouping).
- [ ] `formatDate.ts` → `formatDate(d: Date|string): string` → `23/04/2026`.
- [ ] `numberToWords.ts` → `toWords(n: number): string` → `"One Lakh Twenty Thousand Rupees Only"` (supports lakh/crore up to 9 digits).
- [ ] `storage.ts` → typed wrapper: `getItem<T>(key)`, `setItem(key, val)`, `clear()`.
- [ ] `shortcuts.ts` → `useKeyboardShortcuts(map: Record<string, () => void>)` hook; auto-cleans up on unmount.
- [ ] Unit-test in browser console with a throwaway test page.
- [ ] Commit: `feat(lib): add format, storage, shortcut utilities`

---

## Task 6: Mock data seed

**Files:**
- Create: `src/mock/shop.ts`, `users.ts`, `accounts.ts`, `items.ts`, `parties.ts`, `invoices.ts`, `vouchers.ts`, `employees.ts`, `attendance.ts`, `index.ts` (barrel + `seedAll()`)

**Steps:**

- [ ] `shop.ts`: Hafiz Fabrics, Faisalabad, owner Ejaz, address, phone, terms: "Goods once sold will not be returned. Exchange possible within 7 days.", invoicePrefix `120`, language `dual`.
- [ ] `users.ts`: `[{ username: 'ejaz', passwordHash: 'admin123', role: 'admin', displayName: 'Ejaz' }]`.
- [ ] `accounts.ts`: 5 natures × 2 masters each (matches screenshots: OWNER CAPITAL 1210, CURRENT LIABILITIES 1220, NON CURRENT LIABILITIES 1221, CURRENT ASSETS 1230, NON CURRENT ASSETS 1231, INCOMES 1240, COST OF SALES 1250), 2–3 subs each, ~25 leaf accounts total.
- [ ] `items.ts`: 6 masters (GREY FABRICS, DYED FABRICS, DELIVERY, PACKING, SUN SHINE, RADDO), 3–4 subs each, ~50 items total with unit / purchase / sale prices / gazana / stock / minStock.
- [ ] `parties.ts`: ~20 customers + 5 suppliers + 4 dyers (NAZAKAT, RS, HQ, FAZAL-E-RABBI). Faker-generated Pakistani names (Urdu-Latin) for the rest. Opening balances seeded so total receivable ≈ PKR 30,00,000.
- [ ] `invoices.ts`: ~30 sales, spread across last 90 days, realistic line items.
- [ ] `vouchers.ts`: ~20 purchase, ~15 dyeing, ~25 expense vouchers.
- [ ] `employees.ts`: 8 employees (Cashier, Salesman×2, Helper×2, Accountant, Loader, Cleaner) with realistic salaries 25k–60k PKR, mix of deductForAbsence on/off.
- [ ] `attendance.ts`: `generateAttendance(days=90)` → 95% present, 3% absent, 1% half, 1% leave.
- [ ] `index.ts`: `export function seedAll()` → writes everything to localStorage via `storage` wrapper if not already seeded.
- [ ] Commit: `feat(mock): seed hafiz fabrics realistic demo data`

---

## Task 7: Zustand stores

**Files:**
- Create: `src/stores/useAuth.ts`, `useShop.ts`, `useAccounts.ts`, `useItems.ts`, `useParties.ts`, `useInvoices.ts`, `useVouchers.ts`, `useEmployees.ts`, `useAttendance.ts`, `usePayroll.ts`, `index.ts`

**Steps:**

- [ ] Each store: state + CRUD actions + `hydrate()` that reads from localStorage.
- [ ] `useAuth`: `{ user, login(username, password), logout() }`; compares against mock users.
- [ ] Stores persist mutations via `storage.setItem` on every action.
- [ ] `main.tsx`: call `seedAll()` then hydrate stores before rendering.
- [ ] Verify: in browser devtools, inspect localStorage → see seeded data.
- [ ] Commit: `feat(stores): add zustand domain stores with localStorage persistence`

---

## Task 8: TanStack Router setup + route tree

**Files:**
- Create: `src/router.tsx`, `src/routes/_shell.tsx`, `src/routes/login.tsx`, and stub route files for all 20+ routes (empty components returning `<div>[route name] placeholder</div>`).
- Modify: `src/main.tsx` to mount RouterProvider.

**Steps:**

- [ ] Use TanStack Router's code-based route tree (faster than file-based for now).
- [ ] Define root route → `_shell` (auth guard + layout) → children for all routes from spec §7.
- [ ] `/login` is public.
- [ ] `_shell`: if `!useAuth().user` → redirect to `/login`.
- [ ] Verify: navigate to every route manually, see placeholder text. No crashes.
- [ ] Commit: `feat(router): add tanstack router tree with stub routes`

---

## Task 9: App shell + top navigation

**Files:**
- Create: `src/components/layout/TopNav.tsx`, `Shell.tsx`, `QuickActionBar.tsx`

**Steps:**

- [ ] `Shell`: header (shop name + user badge + logout) + TopNav + `<Outlet/>` + `ShortcutFooter` (reads current route's shortcut map from context).
- [ ] `TopNav`: Home / Basic Data / Transactions / Reports / Settings / Log Out. "Basic Data" and "Transactions" are dropdown triggers (shadcn DropdownMenu) listing their sub-routes. `Alt+1..5` switches tabs.
- [ ] `QuickActionBar`: shown on dashboard — `[N] New Invoice`, `[D] New Dyeing`, `[E] New Expense`, `[C] New Customer`. Each is a BrutalButton + keyboard shortcut.
- [ ] Commit: `feat(layout): add shell, top nav, quick action bar`

---

## Task 10: Login page

**Files:**
- Create: `src/features/auth/LoginPage.tsx`

**Steps:**

- [ ] Centered BrutalCard, shop name in display font, username + password fields, F9 button "Sign In".
- [ ] On submit: `useAuth().login(username, password)` → if success navigate `/`, else show error.
- [ ] Pre-fill username `ejaz` placeholder hint.
- [ ] Verify: login with `ejaz` / `admin123` → dashboard. Wrong password → error.
- [ ] Commit: `feat(auth): add login page`

---

## Task 11: Dashboard

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`, `KpiRow.tsx`, `SalesBarChart.tsx`, `TopCustomersBar.tsx`, `TopItemsTable.tsx`, `ExpenseDonut.tsx`, `RecentTransactions.tsx`, `AlertsStrip.tsx`, `DateRangePicker.tsx`

**Steps:**

- [ ] `KpiRow`: 4 KpiTiles reading from stores — today's sales, today's collection, total dues (danger color), cash-in-hand (success color). Compute deltas vs. yesterday.
- [ ] `SalesBarChart`: Recharts BarChart, last 30 days, overlay 7-day moving average as a LineChart.
- [ ] `TopCustomersBar`: horizontal bar chart, top 5 customers by `currentBalance` (dues).
- [ ] `TopItemsTable`: compute top-5 items by qty sold in last 30 days from invoices store.
- [ ] `ExpenseDonut`: donut chart grouped by accountId from expenses.
- [ ] `RecentTransactions`: last 10 vouchers across all types, clickable to detail route.
- [ ] `AlertsStrip`: only renders if there are overdue (>60 days) or low-stock items.
- [ ] `DateRangePicker`: Today / Week / Month / Year / Custom toggle affects all KPIs.
- [ ] Register shortcuts: N, D, E, C for quick-create; `Ctrl+K` for palette (stub).
- [ ] Verify: dashboard renders all widgets with seeded data producing realistic charts.
- [ ] Commit: `feat(dashboard): KPIs, charts, alerts, recent transactions`

---

## Task 12: Settings page

**Files:**
- Create: `src/features/settings/SettingsPage.tsx`, `ShopInfoForm.tsx`, `InvoiceBrandingForm.tsx`, `LanguageToggle.tsx`, `DangerZone.tsx`

**Steps:**

- [ ] Tabs: Shop Info / Invoice / Language / Users / Danger Zone.
- [ ] Shop Info: name, address, phone, NTN, logo upload (base64 to localStorage).
- [ ] Invoice: terms textarea, invoice prefix.
- [ ] Language: radio group en / ur / dual, live-updates across app.
- [ ] Users: list existing users (just Ejaz for demo).
- [ ] Danger Zone: "Reset demo data" button → clears localStorage + re-seeds + reloads.
- [ ] Commit: `feat(settings): shop info, branding, language, reset`

---

## Task 13: Chart of Accounts

**Files:**
- Create: `src/features/coa/CoaPage.tsx`, `AccountMasterList.tsx`, `AccountSubList.tsx`, `AccountLeafList.tsx`, `AddEditMasterModal.tsx`, `AddEditSubModal.tsx`, `AddEditAccountModal.tsx`

**Steps:**

- [ ] Three-column view or tabs for Master / Sub / Account levels (match screenshots' Level 1 / 2 / 3 flow).
- [ ] BrutalTable with columns: nature, id, name, balance; edit/delete actions.
- [ ] `Ctrl+N` opens modal; `F9` saves; `Esc` cancels.
- [ ] Commit: `feat(coa): three-level chart of accounts`

---

## Task 14: Items (3-level)

**Files:**
- Create: `src/features/items/ItemsPage.tsx`, `ItemMasterList.tsx`, `ItemSubList.tsx`, `ItemLeafList.tsx`, `AddEditItemModal.tsx`, `StockBadge.tsx`

**Steps:**

- [ ] Three-tab layout: Master / Sub / Items (matches frmItems1, frmItems2, frmItems3 screenshots).
- [ ] Items table columns: id, name, unit, purchase, sale, gazana, stock, min-stock, actions. Low-stock rows have red left-border.
- [ ] Add/edit modal matches screenshot fields (Item ID auto, Sub Level combobox, Item Name, Unit, Purchase Price, Sale Price, Gazana).
- [ ] Commit: `feat(items): three-level item hierarchy with stock`

---

## Task 15: Customers list + ledger

**Files:**
- Create: `src/features/customers/CustomersPage.tsx`, `CustomerTable.tsx`, `AddEditCustomerModal.tsx`, `CustomerLedgerPage.tsx`, `LedgerTable.tsx`

**Steps:**

- [ ] List: name, phone, opening, current balance, credit days, last activity. Search bar (F3). Dues column colored danger when > 0.
- [ ] Add/edit modal with Zod validation.
- [ ] Click row → `/customers/:id` ledger: running balance with all invoices + receipts; date range filter; export CSV button (stub).
- [ ] Commit: `feat(customers): list + detail ledger`

---

## Task 16: Suppliers + Dyers

**Files:**
- Create: `src/features/suppliers/SuppliersPage.tsx`, `SupplierLedgerPage.tsx`, same helpers as customers.

**Steps:**

- [ ] Reuse party components with `type` filter (`supplier` or `dyer`).
- [ ] Single route `/suppliers` shows both via a sub-tab (Suppliers / Dyers).
- [ ] Commit: `feat(suppliers): suppliers and dyers list + ledger`

---

## Task 17: Sales Invoice (POS) — the showpiece

**Files:**
- Create: `src/features/sales/SalesListPage.tsx`, `NewInvoicePage.tsx`, `InvoiceHeader.tsx`, `InvoiceLinesTable.tsx`, `InvoiceTotals.tsx`, `CustomerPickCombobox.tsx`, `ItemPickCombobox.tsx`

**Steps:**

- [ ] List page: table of invoices (serial, date, customer, total, balance, paid/unpaid badge); search, filter by date/customer/paid-status; row actions: View / Edit / Print / Duplicate / Delete.
- [ ] New-invoice page:
  - Header: serial (auto), date (today, editable), customer combobox (`F4`), payment mode radio, due date (if credit).
  - Lines table: item combobox → qty → unit → rate (auto from item master) → amount (auto). Enter at rate commits row, cursor back to item combobox for next line. `Ctrl+D` duplicates current line.
  - Totals panel: subtotal, discount input, grand total (big black-bg white-text), amount-in-words, previous balance, new balance.
  - `F9` saves. `Ctrl+P` prints. Save-and-close or save-and-new.
- [ ] All with keyboard navigation — verify by doing a full invoice with zero mouse clicks.
- [ ] Commit: `feat(sales): invoice list + keyboard-first new-invoice entry`

---

## Task 18: Purchase Voucher

**Files:**
- Create: `src/features/purchase/PurchaseListPage.tsx`, `NewPurchasePage.tsx` (reuses sales components with supplier filter).

**Steps:**

- [ ] Mirror structure of sales invoice but with supplier combobox and "reduce stock" becomes "add stock".
- [ ] Commit: `feat(purchase): purchase voucher entry`

---

## Task 19: Dyeing Voucher

**Files:**
- Create: `src/features/dyeing/DyeingListPage.tsx`, `NewDyeingPage.tsx`

**Steps:**

- [ ] Match the existing frmDV layout (Voucher#, Date, Account ID, Account Name, Remarks, Value + Edit/Delete/Print actions). Add search by Serial/Bill/Party.
- [ ] Entry form: dyer combobox, lines (grey item → dyed item mapping, qty in, qty out, rate per meter, total), remarks, total value.
- [ ] Commit: `feat(dyeing): dyeing voucher list and entry`

---

## Task 20: Expense Voucher

**Files:**
- Create: `src/features/expenses/ExpensesPage.tsx`, `NewExpenseModal.tsx`

**Steps:**

- [ ] Single-screen inline form + list: date, account (from expense accounts combobox), amount, description, paidFrom (cash/bank).
- [ ] List below with filters by month/category.
- [ ] Commit: `feat(expenses): expense voucher entry and list`

---

## Task 21: Employees directory

**Files:**
- Create: `src/features/employees/EmployeesPage.tsx`, `EmployeeTable.tsx`, `AddEditEmployeeModal.tsx`

**Steps:**

- [ ] Table: name, role, phone, joining date, salary type + amount, deductForAbsence toggle inline, active toggle.
- [ ] Modal with all fields from spec §9 Employee interface, including photo upload (base64).
- [ ] Commit: `feat(employees): employee directory with CRUD`

---

## Task 22: Attendance roll-call

**Files:**
- Create: `src/features/attendance/AttendancePage.tsx`, `AttendanceGrid.tsx`, `AttendanceCalendar.tsx`

**Steps:**

- [ ] Page shows today's date (changeable). List of active employees. One-key marking: cursor on employee → press `P`/`A`/`H`/`L`, cursor auto-advances to next employee. Visual: big colored chip per status.
- [ ] Bottom: monthly calendar view per employee (tabs), green/red/yellow/blue cells for P/A/H/L.
- [ ] `F9` commits all edits to store.
- [ ] Commit: `feat(attendance): daily roll-call and monthly calendar`

---

## Task 23: Payroll generation

**Files:**
- Create: `src/features/payroll/PayrollPage.tsx`, `PayrollTable.tsx`, `AdvanceModal.tsx`, `BonusModal.tsx`, `SalarySlipPdf.tsx`

**Steps:**

- [ ] Month picker. "Generate Payroll" button computes `PayrollRun` per employee:
  - monthly + deductForAbsence: `basic ÷ daysInMonth × presentDays`
  - monthly + !deductForAbsence: full `basic`
  - daily: `presentDays × dailyRate`
  - subtract sum of advances this month + manual deduction, add bonus → netPay.
- [ ] Inline "Add Advance" / "Add Bonus" / "Add Deduction" per row.
- [ ] "Download Slip" per employee → PDF via `@react-pdf/renderer`.
- [ ] Commit: `feat(payroll): month-end payroll with slip PDF`

---

## Task 24: Reports (Day Book, Ledger, Trial Balance, P&L)

**Files:**
- Create: `src/features/reports/DayBookPage.tsx`, `LedgerReportPage.tsx`, `TrialBalancePage.tsx`, `ProfitLossPage.tsx`, `ReportLayout.tsx`

**Steps:**

- [ ] Shared `ReportLayout` with date-range picker, "Print" / "Export CSV" buttons in header.
- [ ] Day Book: all vouchers of selected date, grouped by type, totals per group.
- [ ] Ledger Report: party picker → same view as customer ledger but generic.
- [ ] Trial Balance: every account → debit / credit totals → totals must balance (tolerance Rs 1).
- [ ] P&L: Incomes – Expenses, grouped, final net profit highlighted.
- [ ] Commit: `feat(reports): day book, ledger, trial balance, p&l`

---

## Task 25: PDF invoice template

**Files:**
- Create: `src/features/sales/InvoicePdf.tsx` (uses `@react-pdf/renderer`), `src/lib/pdfDownload.ts`

**Steps:**

- [ ] Invoice PDF matches spec §12 layout exactly (A4, header block, party block, items table, totals block, footer).
- [ ] `pdfDownload.ts`: `downloadInvoicePdf(invoice, shop)` → uses `pdf(<InvoicePdf/>).toBlob()` → triggers download with filename `INV-${serial}.pdf`.
- [ ] Wire up `Ctrl+S` on invoice detail + a "Download PDF" BrutalButton.
- [ ] Fonts in react-pdf: register Space Grotesk + JetBrains Mono (fetched from Google Fonts).
- [ ] Verify: download an invoice, open PDF, looks right.
- [ ] Commit: `feat(pdf): invoice pdf download with @react-pdf/renderer`

---

## Task 26: Deploy to Vercel + final QA

**Files:**
- Create: `vercel.json` (or `vercel.ts` per modern convention) if any config needed

**Steps:**

- [ ] `npm run build` → verify `/dist` builds clean.
- [ ] If Vercel CLI not installed: prompt user to `npm i -g vercel`.
- [ ] `vercel deploy --prod` (user authenticates interactively first time).
- [ ] Full keyboard-only QA pass: login → dashboard → create invoice → print → download PDF → logout.
- [ ] Record any smallblockers in `README.md` as known issues.
- [ ] Commit + push: `chore: deploy v1 demo to vercel`
- [ ] Share Vercel URL with user.

---

## Self-Review Checklist

**Spec coverage:**
- §2 Scope (12 modules) → Tasks 10–24 cover all ✔
- §3 Stack → Task 1 installs all ✔
- §4 Design system → Tasks 2–3 ✔
- §5 Localization → Tasks 4 (i18n), 12 (toggle) ✔
- §6 Keyboard UX → Task 3 (ShortcutFooter), Task 5 (shortcuts hook), Task 17 (showpiece invoice flow) ✔
- §7 Route map → Task 8 ✔
- §8 Dashboard → Task 11 ✔
- §9 Data model → Task 4 ✔
- §10 Folder structure → implicit in all tasks ✔
- §11 Mock data → Task 6 ✔
- §12 Invoice layout → Tasks 17 (screen) + 25 (PDF) ✔
- §13 Deployment → Task 26 ✔
- §16 Success criteria — each acceptance bullet maps to a task above ✔

**No placeholders:** verified, every task has concrete files + concrete steps.

**Type consistency:** `Party`, `Item`, `Invoice*`, `Employee`, `PayrollRun` used consistently across tasks 4, 7, 15, 17, 22, 23.

Plan complete and ready to execute.
