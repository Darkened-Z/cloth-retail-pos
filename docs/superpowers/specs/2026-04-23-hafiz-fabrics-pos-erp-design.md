# Hafiz Fabrics POS/ERP — Design Spec

**Date:** 2026-04-23
**Owner:** Abdullah Zafar (WEBEX LLC)
**Client:** Hafiz Fabrics, Faisalabad, Pakistan
**Phase:** Frontend-only demo with mock data. Backend + Electron wrap in later phases.

## 1. Purpose

Build a generic, reusable POS + ERP frontend for Pakistani cloth retail shops, pre-seeded with Hafiz Fabrics data, to show the client as a working demo. Design data shapes such that a future backend can import their existing ASP.NET/SQL Server data. Must be keyboard-first, readable by a 50+ year-old shopkeeper, run smoothly on a 2–4 GB RAM laptop, and feel like premium desktop software once wrapped in Electron.

## 2. Scope (v1 demo)

Twelve modules:

1. Dashboard (KPIs + charts)
2. Chart of Accounts (5 natures → master → sub → item)
3. Items (3-level: master → sub → item, with stock)
4. Customers (list + running ledger)
5. Suppliers / Dyers (list + running ledger)
6. Sales Invoice (POS entry + print/PDF)
7. Purchase Voucher
8. Dyeing Voucher
9. Expense Voucher
10. Employees + Attendance + Payroll
11. Reports — Day Book, Ledger, Trial Balance, P&L
12. Settings — shop info, invoice branding, users

**Out of scope for v1:** real backend, authentication beyond a hardcoded login, multi-shop, multi-user concurrent editing, thermal printing, WhatsApp integration, Urdu-only mode (only dual-language mode is shipped), hourly attendance tracking, data import from existing ASP.NET system.

## 3. Stack

- **Frontend:** Vite + React 18 + TypeScript
- **UI:** shadcn/ui + Tailwind CSS (customized for neo-brutalism)
- **Routing:** TanStack Router (type-safe, file-based feel without SSR overhead)
- **State:** Zustand stores per domain (auth, shop, customers, invoices, etc.)
- **Tables:** TanStack Table
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **PDF:** `@react-pdf/renderer` for invoice/slip generation
- **Icons:** lucide-react
- **Mock data:** `@faker-js/faker` for volume, hand-authored realism (NAZAKAT DYEING, RS DYEING, etc.)
- **Fonts:** Google Fonts CDN — Archivo Black (display), Space Grotesk (sans), JetBrains Mono (numbers)
- **Persistence:** `localStorage` wrapper so demo edits survive page refresh
- **Build:** `npm run build` → static `/dist` → Vercel deploy
- **Electron (later phase):** wrap `/dist` with minimal `electron-builder` setup

## 4. Design System — "Industrial ERP" Neo-Brutalism

### Color tokens

| Token | Value | Usage |
|---|---|---|
| `background` | `#FFFFFF` | App background |
| `foreground` | `#000000` | All text, borders |
| `accent` | `#FFB800` | Primary buttons, focus rings |
| `danger` | `#E63946` | Dues, deletion, negative trends |
| `success` | `#2D6A4F` | Paid, profit, positive trends |
| `muted` | `#F4F4F4` | Zebra rows, disabled fields |

### Visual rules

- Border: `2px solid #000` on every card, input, button, table
- Radius: `0` (sharp corners everywhere)
- Shadow: `4px 4px 0 #000` on interactive primitives; removed on active/pressed state
- Hover: background inverts (black bg + white text)
- Focus: 3px amber ring (`#FFB800`) — never use browser default
- Spacing: 8px grid

### Typography

- Display (`font-display`): Archivo Black — page titles, invoice header
- Sans (`font-sans`): Space Grotesk 400/500/700 — body, labels, buttons
- Mono (`font-mono`): JetBrains Mono — all numbers, IDs, serials, dates in tables

## 5. Localization

- **Language modes:** `en` | `ur` | `dual` — dual shows `English / اردو` side-by-side
- **Numbers:** Pakistani style — `30,00,000` (30 lakh)
- **Currency:** `PKR 9,413` (banking style, user-selected)
- **Cloth units:** Meters / Yards / Thaans — per-item selectable
- **Dates:** `DD/MM/YYYY` default

All labels routed through `t(key)` function. Urdu label map ships with the demo.

## 6. Keyboard UX

### Core 5 (persistent footer, muscle memory)

- `Enter` — advance field / save-and-new-row
- `Esc` — cancel / close / back
- `F9` — save form (Tally convention)
- `F1` — help overlay showing all shortcuts for current screen
- `Ctrl+N` — new record (contextual: invoice / item / customer depending on screen)

### Additional (discoverable via F1 + contextual footer bar)

- `Tab` / `Shift+Tab` — field navigation (same as Enter)
- `F2` — edit selected row
- `F3` — focus search bar
- `F4` — open dropdown
- `Ctrl+P` — print
- `Ctrl+D` — duplicate current row
- `Ctrl+K` — command palette (jump to any screen)
- Arrow keys — navigate tables like Excel
- `Delete` — delete row (with confirm)

### Form-entry invariants

- All dropdowns: type-to-search, no click needed
- Enter on last field: save and restart on first field of next row
- Every screen renders a `<ShortcutFooter>` at the bottom listing relevant keys

## 7. Route Map

```
/login                      Login (Ejaz / admin123)
/                           Dashboard
/coa                        Chart of Accounts
/items                      Items (3-level)
/customers                  Customers list
/customers/:id              Customer ledger
/suppliers                  Suppliers list
/suppliers/:id              Supplier ledger
/sales                      Sales invoices list
/sales/new                  New sales invoice
/purchase                   Purchase vouchers list
/purchase/new               New purchase voucher
/dyeing                     Dyeing vouchers list
/dyeing/new                 New dyeing voucher
/expenses                   Expenses list + new-entry modal
/employees                  Employee directory
/attendance                 Daily attendance roll-call
/payroll                    Monthly payroll + slip generation
/reports/daybook            Day book
/reports/ledger             Customer / supplier ledger
/reports/trial-balance      Trial balance
/reports/profit-loss        Profit & Loss
/settings                   Shop info, invoice branding, users, language
```

Top navigation (matches client's current mental model):
`Home` | `Basic Data` | `Transactions` | `Reports` | `Settings` | `Log Out`

## 8. Dashboard Specification

**Top row — 4 KPI tiles** (big number + trend arrow vs. yesterday)

1. Today's Sales — e.g. `PKR 1,24,500` ▲ 18%
2. Today's Collection (cash received) — ▼ 5%
3. Total Dues (Receivable) — rendered in `danger` color
4. Cash in Hand — rendered in `success` color

**Second row — 2 charts**

5. Last 30 Days Sales — bar chart with 7-day moving average line
6. Top 5 Customers by Dues — horizontal bar chart

**Third row — 2 widgets**

7. Top 5 Selling Items — table (item, qty, revenue)
8. Expense Breakdown (this month) — donut chart

**Fourth row — activity**

9. Recent Transactions — last 10 vouchers, clickable

**Fifth row — alerts**

10. Red-bordered strip for overdue customers / low-stock items (only shown when alerts exist)

**Controls:**

- Date range toggle: Today / This Week / This Month / This Year / Custom
- Quick-action bar: `[N] New Invoice` `[D] New Dyeing` `[E] New Expense` `[C] New Customer`

## 9. Data Model (TypeScript)

Full types live in `src/types/`. Abbreviated:

```ts
type AccountNature = 'Capital' | 'Liabilities' | 'Assets' | 'Incomes' | 'Expenses';

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  ntn?: string;
  logoUrl?: string;
  terms: string;
  invoicePrefix: string;
  language: 'en' | 'ur' | 'dual';
}

interface User {
  id: string;
  username: string;
  passwordHash: string;  // demo: plaintext 'admin123'
  role: 'admin' | 'cashier' | 'accountant';
  displayName: string;
}

interface AccountMaster { id: string; nature: AccountNature; name: string; }
interface AccountSub    { id: string; masterId: string; name: string; }
interface Account       { id: string; subId: string; name: string;
                          openingBalance: number; currentBalance: number; }

interface ItemMaster { id: string; name: string; }
interface ItemSub    { id: string; masterId: string; name: string; }
interface Item {
  id: string;
  subId: string;
  name: string;
  unit: 'meter' | 'yard' | 'thaan';
  purchasePrice: number;
  salePrice: number;
  gazana: number;
  stock: number;
  minStock: number;
}

interface Party {
  id: string;
  type: 'customer' | 'supplier' | 'dyer';
  name: string;
  phone: string;
  address: string;
  cnic?: string;
  openingBalance: number;
  currentBalance: number;
  creditDays: number;
}

interface InvoiceLine {
  itemId: string;
  qty: number;
  unit: Item['unit'];
  rate: number;
  amount: number;
}

interface SalesInvoice {
  id: string;
  serial: string;
  date: string;
  customerId: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paid: number;
  balance: number;
  paymentMode: 'cash' | 'credit' | 'partial';
  notes?: string;
}

// PurchaseVoucher, DyeingVoucher share SalesInvoice shape with different party type.

interface ExpenseVoucher {
  id: string;
  date: string;
  accountId: string;
  amount: number;
  description: string;
  paidFrom: 'cash' | 'bank';
}

interface Employee {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  address: string;
  role: string;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  salaryAmount: number;
  deductForAbsence: boolean;
  active: boolean;
  photoUrl?: string;
}

interface AttendanceRecord {
  date: string;
  employeeId: string;
  status: 'P' | 'A' | 'H' | 'L';  // Present / Absent / Half / Leave
}

interface Advance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  note?: string;
}

interface PayrollRun {
  month: string;  // YYYY-MM
  employeeId: string;
  basicSalary: number;
  presentDays: number;
  absenceDeduction: number;
  advances: number;
  bonus: number;
  deduction: number;
  netPay: number;
  slipGenerated: boolean;
}
```

## 10. Folder Structure

```
src/
  main.tsx                 # Vite entry
  router.tsx               # TanStack Router setup
  types/                   # All TS interfaces above
  stores/                  # Zustand stores (useAuth, useShop, useCustomers, ...)
  mock/                    # Seed data modules (customers.ts, items.ts, ...)
  lib/
    formatNumber.ts        # Pakistani lakh/crore formatting
    formatDate.ts
    numberToWords.ts       # "One Lakh Twenty Thousand Rupees Only"
    storage.ts             # localStorage wrapper
    i18n.ts                # t() function + EN/UR label maps
    shortcuts.ts           # useKeyboardShortcuts hook
  components/
    ui/                    # BrutalCard, BrutalInput, BrutalButton, BrutalTable, etc.
    layout/                # TopNav, ShortcutFooter, Shell
    forms/                 # ComboBox, NumberInput, DatePicker
    charts/                # KpiTile, SalesBarChart, DuesBarChart, ExpenseDonut
    invoice/               # InvoicePdf (react-pdf), InvoicePreview
  features/
    dashboard/
    coa/
    items/
    customers/
    suppliers/
    sales/
    purchase/
    dyeing/
    expenses/
    employees/
    attendance/
    payroll/
    reports/
    settings/
    auth/
  assets/
    logo.svg
    fonts/                 # (Google Fonts CDN loaded via <link>, no local files)
public/
  favicon.svg
index.html
vite.config.ts
tailwind.config.ts
tsconfig.json
package.json
```

Each `features/<name>/` folder owns: its routes, components, hooks, and mock-data integration. Cross-feature deps go through stores or `lib/`.

## 11. Mock Data Plan

- **Shop:** Hafiz Fabrics, Faisalabad, pre-filled.
- **User:** Ejaz (admin / admin123).
- **Items:** ~50, seeded from screenshots (GREY WASH AND WEAR, GREY BOSKI, GREY COTTON, GREY WINTER, WASH N WEAR, BOSKI, COTTON, WINTER, KHADAR, CUT PIECES, etc.) across GREY FABRICS / DYED FABRICS / DELIVERY / PACKING / SUN SHINE / RADDO masters.
- **Parties:** ~20 customers + ~10 dyers (NAZAKAT DYEING, RS DYEING, HQ DYEING, FAZAL-E-RABBI DYEING) + ~5 suppliers. Pakistani name generator for remainder.
- **Invoices:** ~30 sales, ~20 purchase, ~15 dyeing, ~25 expenses spread across the last 90 days — produces believable dashboard charts.
- **Employees:** ~8 (Cashier, Salesman x2, Helper x2, Accountant, Loader, Cleaner).
- **Attendance:** auto-generated 90 days of realistic patterns (95% present, occasional absents/halves).
- **Total dues:** seeded near PKR 30,00,000 to echo the real pain point.

Seed runs once on first load, persists to `localStorage`. "Reset demo data" button in Settings.

## 12. Invoice Layout (Print + PDF)

- **Size:** A4 portrait.
- **Header:** shop logo + HAFIZ FABRICS (Archivo Black), tagline, address/phone/NTN, right-side big `INVOICE` + serial + date/time, 3px divider.
- **Party block:** left Bill-To (name/address/phone), right Payment Terms + Due Date.
- **Items table:** `#` / Item Code / Description / Qty / Unit / Rate / Amount — zebra rows, mono numbers, 1.5px row dividers.
- **Totals block:** subtotal / discount / **Grand Total** (black bg, white text) / amount-in-words / running-ledger summary.
- **Footer terms:** "Goods once sold will not be returned. Exchange possible within 7 days." + signature/stamp lines + small-print timestamp.
- **Actions:** `Ctrl+P` native print, `Ctrl+S` save as PDF via `@react-pdf/renderer`.

## 13. Deployment

- `npm run build` → `/dist` static bundle
- `vercel deploy` (user has Vercel CLI installed or installs via `npm i -g vercel`) → share URL with client
- Preview URL = client demo link
- Production promotion when approved

Electron wrap (future phase, separate spec):
- `npm i -D electron electron-builder`
- `main.js` that creates BrowserWindow, loads `file://dist/index.html`
- `npm run make` → `.exe` installer for Windows

## 14. Non-Functional Targets

- First paint < 800 ms on a 2-core / 4 GB laptop
- Route switch < 100 ms
- Table with 500 rows scrolls at 60 fps (virtualized via TanStack Table)
- Bundle size < 500 kB gzipped for initial load
- Zero runtime errors on happy paths for all 12 modules

## 15. Open Decisions (deferred to later phases)

- Real backend choice (Node/Express + SQLite vs. Electron + better-sqlite3 directly)
- Data import pipeline from existing ASP.NET / SQL Server
- Multi-shop architecture (shop-scoped IDs, branch selector)
- Thermal printer support (80 mm)
- WhatsApp invoice sharing via `wa.me/` deep-link
- User roles & permissions (admin / cashier / accountant granularity)
- Cloud sync / backup

## 16. Success Criteria for this Phase

The demo is done when:

1. User can log in as Ejaz / admin123.
2. Dashboard loads with realistic KPIs, charts, and alerts seeded from Hafiz Fabrics data.
3. All 12 modules are reachable and functional against mock data (create / edit / delete / list).
4. Sales invoice can be created start-to-finish with only keyboard (no mouse clicks), printed, and downloaded as PDF.
5. Attendance can be marked for the day in under 30 seconds for 8 employees.
6. Payroll for the current month generates in one click with correct advance/absence math, and slips are PDF-downloadable.
7. Language toggle (`en` / `ur` / `dual`) flips all labels.
8. Deployed to a Vercel URL shareable with the client.
9. Runs smoothly (~60 fps interactions) on a 4 GB RAM / 2-core laptop running Firefox or Chrome.

