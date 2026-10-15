import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useParties } from '@/stores/useParties';
import { useExpenses } from '@/stores/useExpenses';
import { useItems } from '@/stores/useItems';
import { useCoa } from '@/stores/useCoa';
import { useVouchers } from '@/stores/useVouchers';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { ArrowUpRight, FileText, MoreHorizontal } from 'lucide-react';
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Range = 'today' | 'week' | 'month' | 'year' | 'custom';

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#EC4899'];

function formatAxisPKR(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
  return String(val);
}

function shortPartyName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name.slice(0, 18);
  return `${parts[0]} ${parts[1]}`.slice(0, 18);
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const { parties } = useParties();
  const { expenses } = useExpenses();
  const { items } = useItems();
  const { accounts } = useCoa();
  const { receipts, payments } = useVouchers();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();

  const [range, setRange] = useState<Range>('month');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => todayISO());

  useKeyboardShortcuts({
    n: () => navigate({ to: '/sales/new' }),
    d: () => navigate({ to: '/dyeing/new' }),
    e: () => navigate({ to: '/expenses' }),
    c: () => navigate({ to: '/customers' }),
  });

  const cutoff = useMemo(() => {
    const d = new Date();
    if (range === 'today') return todayISO();
    if (range === 'week') d.setDate(d.getDate() - 7);
    if (range === 'month') d.setDate(d.getDate() - 30);
    if (range === 'year') d.setDate(d.getDate() - 365);
    return d.toISOString().slice(0, 10);
  }, [range]);

  const filteredInvoices = useMemo(() => {
    if (range === 'custom') {
      return invoices.filter(i => i.date >= fromDate && i.date <= toDate);
    }
    return invoices.filter(i => i.date >= cutoff);
  }, [invoices, cutoff, range, fromDate, toDate]);

  const filteredExpenses = useMemo(() => {
    if (range === 'custom') {
      return expenses.filter(e => e.date >= fromDate && e.date <= toDate);
    }
    return expenses.filter(e => e.date >= cutoff);
  }, [expenses, cutoff, range, fromDate, toDate]);

  const salesTotal = filteredInvoices.reduce((s, i) => s + i.grandTotal, 0);

  const customers = useMemo(() => parties.filter(p => p.type === 'customer'), [parties]);
  const suppliers = useMemo(() => parties.filter(p => p.type !== 'customer'), [parties]);

  const receivables = customers.reduce((s, p) => s + Math.max(0, p.currentBalance), 0);
  const payables = suppliers.reduce((s, p) => s + Math.max(0, p.currentBalance), 0);

  const cashAccount = useMemo(() => {
    const acc = accounts.find(a => a.id === 'A410');
    const baseBalance = acc?.currentBalance ?? acc?.openingBalance ?? 0;
    const today = todayISO();
    const todaySalesPaid = invoices
      .filter(i => i.date === today)
      .reduce((s, i) => s + (i.paid ?? 0), 0);
    const todayReceipts = receipts
      .filter(r => r.date === today && r.receivedIn === 'cash')
      .reduce((s, r) => s + r.amount, 0);
    const todayPurchasesPaid = purchases
      .filter(p => p.date === today)
      .reduce((s, p) => s + (p.paid ?? 0), 0);
    const todayExpenses = expenses
      .filter(e => e.date === today && e.paidFrom === 'cash')
      .reduce((s, e) => s + e.amount, 0);
    const todayPayments = payments
      .filter(p => p.date === today && p.paidFrom === 'cash')
      .reduce((s, p) => s + p.amount, 0);

    return (
      baseBalance +
      todaySalesPaid +
      todayReceipts -
      todayPurchasesPaid -
      todayExpenses -
      todayPayments
    );
  }, [accounts, invoices, receipts, purchases, expenses, payments]);

  const lowStockCount = useMemo(
    () => items.filter(it => it.stock <= it.minStock).length,
    [items]
  );

  // Last 30 days sales chart with 7-day moving average
  const last30 = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    invoices.forEach(inv => {
      if (map.has(inv.date)) map.set(inv.date, (map.get(inv.date) ?? 0) + inv.grandTotal);
    });
    const raw = Array.from(map.entries()).map(([date, total]) => ({
      date: date.slice(5),
      total,
    }));
    return raw.map((entry, idx) => {
      const windowSlice = raw.slice(Math.max(0, idx - 6), idx + 1);
      const ma7 = Math.round(windowSlice.reduce((s, x) => s + x.total, 0) / windowSlice.length);
      return { ...entry, ma7 };
    });
  }, [invoices]);

  // Top 5 selling items
  const topItems = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvoices.forEach(inv =>
      inv.lines.forEach(l => {
        const itemName = items.find(it => it.id === l.itemId)?.name ?? l.itemId;
        map.set(itemName, (map.get(itemName) ?? 0) + l.amount);
      })
    );
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.slice(0, 20), value }));
  }, [filteredInvoices, items]);

  // Top 5 customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvoices.forEach(inv => {
      map.set(inv.customerId, (map.get(inv.customerId) ?? 0) + inv.grandTotal);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cid, value]) => ({
        name: shortPartyName(parties.find(p => p.id === cid)?.name ?? cid),
        value,
      }));
  }, [filteredInvoices, parties]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const accName = accounts.find(a => a.id === e.accountId)?.name ?? e.accountId;
      map.set(accName, (map.get(accName) ?? 0) + e.amount);
    });
    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const total = sorted.reduce((s, x) => s + x.value, 0) || 1;
    return sorted.map((x, idx) => ({
      ...x,
      pct: Math.round((x.value / total) * 100),
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
  }, [filteredExpenses, accounts]);

  // Clean, high-readability Quick Access Cards with graph-matched accent colors
  const workspaceShortcuts = [
    {
      label: 'New Sales Bill (POS)',
      sub: 'Press N',
      path: '/sales/new',
      accentBorder: 'border-l-4 border-l-blue-600',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      cardBg: 'bg-blue-50/40 hover:bg-blue-50/80',
    },
    {
      label: 'Sales Invoices',
      sub: `${invoices.length}`,
      path: '/sales',
      accentBorder: 'border-l-4 border-l-amber-500',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      cardBg: 'bg-white hover:bg-amber-50/30',
    },
    {
      label: 'New Dyeing Order',
      sub: 'Press D',
      path: '/dyeing/new',
      accentBorder: 'border-l-4 border-l-violet-600',
      badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
      cardBg: 'bg-violet-50/40 hover:bg-violet-50/80',
    },
    {
      label: 'Dyeing Vouchers',
      sub: `${dyeings.length}`,
      path: '/dyeing',
      accentBorder: 'border-l-4 border-l-purple-500',
      badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
      cardBg: 'bg-white hover:bg-purple-50/30',
    },
    {
      label: 'Purchase Orders',
      sub: `${purchases.length}`,
      path: '/purchase',
      accentBorder: 'border-l-4 border-l-cyan-500',
      badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      cardBg: 'bg-white hover:bg-cyan-50/30',
    },
    {
      label: 'Items & Fabric Stock',
      sub: `${items.length}`,
      path: '/items',
      accentBorder: 'border-l-4 border-l-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      cardBg: 'bg-white hover:bg-emerald-50/30',
    },
    {
      label: 'Customers',
      sub: `${customers.length}`,
      path: '/customers',
      accentBorder: 'border-l-4 border-l-rose-500',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      cardBg: 'bg-white hover:bg-rose-50/30',
    },
    {
      label: 'Suppliers & Dyers',
      sub: `${suppliers.length}`,
      path: '/suppliers',
      accentBorder: 'border-l-4 border-l-orange-500',
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
      cardBg: 'bg-white hover:bg-orange-50/30',
    },
    {
      label: 'Receipt & Payment',
      sub: `${receipts.length + payments.length}`,
      path: '/vouchers/receipt-payment',
      accentBorder: 'border-l-4 border-l-teal-500',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      cardBg: 'bg-white hover:bg-teal-50/30',
    },
    {
      label: 'Stock Transfer',
      sub: lowStockCount > 0 ? `${lowStockCount} Low` : 'Move',
      path: '/stock-transfer',
      accentBorder: lowStockCount > 0 ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-indigo-500',
      badgeClass:
        lowStockCount > 0
          ? 'bg-red-100 text-red-800 border-red-300'
          : 'bg-indigo-50 text-indigo-800 border-indigo-200',
      cardBg: 'bg-white hover:bg-indigo-50/30',
    },
  ];

  // ERPNext-style Categorized Document & Master Lists with subtle color accents
  const documentGroups = [
    {
      title: 'Selling & POS',
      iconBg: 'bg-blue-50 text-blue-600',
      dotBg: 'bg-blue-50',
      dotColor: 'bg-blue-600',
      items: [
        { label: 'New Sales Invoice', path: '/sales/new', primary: true },
        { label: 'Sales Invoice List', path: '/sales' },
        { label: 'Customers Directory', path: '/customers' },
        { label: 'Receipt / Payment Voucher', path: '/vouchers/receipt-payment' },
        { label: 'Debtors Aging Report', path: '/reports/debtors' },
      ],
    },
    {
      title: 'Dyeing & Buying',
      iconBg: 'bg-violet-50 text-violet-600',
      dotBg: 'bg-violet-50',
      dotColor: 'bg-violet-600',
      items: [
        { label: 'New Dyeing Voucher', path: '/dyeing/new', primary: true },
        { label: 'Dyeing Voucher List', path: '/dyeing' },
        { label: 'New Purchase Voucher', path: '/purchase/new', primary: true },
        { label: 'Purchase Voucher List', path: '/purchase' },
        { label: 'Suppliers & Dyers', path: '/suppliers' },
      ],
    },
    {
      title: 'Stock & HR',
      iconBg: 'bg-emerald-50 text-emerald-600',
      dotBg: 'bg-emerald-50',
      dotColor: 'bg-emerald-600',
      items: [
        { label: 'Items & Fabric Stock', path: '/items', primary: true },
        { label: 'Stock Transfer', path: '/stock-transfer' },
        { label: 'Locations / Godowns', path: '/locations' },
        { label: 'Employees & Advances', path: '/employees' },
        { label: 'Daily Attendance', path: '/attendance' },
        { label: 'Monthly Payroll', path: '/payroll' },
      ],
    },
    {
      title: 'Reports & Accounts',
      iconBg: 'bg-amber-50 text-amber-600',
      dotBg: 'bg-amber-50',
      dotColor: 'bg-amber-500',
      items: [
        { label: 'General Journal (روزنامچہ)', path: '/reports/general-journal', primary: true },
        { label: 'Day Book Summary', path: '/reports/daybook' },
        { label: 'Trial Balance (میزان پڑتال)', path: '/reports/trial-balance', primary: true },
        { label: 'Cash Book', path: '/reports/cashbook' },
        { label: 'Fabric Stock Ledger', path: '/reports/stock' },
        { label: 'Party Ledger Report', path: '/reports/ledger' },
        { label: 'Trial Balance (4-Col)', path: '/reports/trial-balance-4col' },
        { label: 'Profit & Loss Statement', path: '/reports/profit-loss' },
        { label: 'Chart of Accounts', path: '/coa' },
      ],
    },
  ];

  return (
    <div className="p-3 sm:p-5">
      {/* Main ERPNext Workspace Card Container */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-sm p-4 sm:p-6 space-y-8">
        {/* 1. Workspace Title + Quick Shortcut Pills Grid */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900">Fabric Retail & Printing</h2>

            {/* Period Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex bg-slate-100 border border-slate-300 rounded-lg p-0.5">
                {(['today', 'week', 'month', 'year', 'custom'] as Range[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 text-xs font-semibold capitalize rounded-md transition-colors ${
                      range === r
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {range === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-slate-600">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                    className="border border-slate-300 rounded-md px-2 py-1 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {workspaceShortcuts.map(sc => (
              <button
                key={sc.label}
                type="button"
                onClick={() => navigate({ to: sc.path as string })}
                className={`group rounded-lg px-3.5 py-3 flex items-center justify-between gap-2 text-left transition-all shadow-sm border border-slate-300 text-slate-900 ${sc.accentBorder} ${sc.cardBg}`}
              >
                <span className="text-[14px] font-semibold leading-snug flex items-center gap-1">
                  <span>{sc.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-bold shrink-0 border ${sc.badgeClass}`}
                >
                  {sc.sub}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Colored KPI Metric Cards (ERPNext Number Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => navigate({ to: '/sales' })}
            className="cursor-pointer border border-slate-300 border-t-4 border-t-amber-500 rounded-xl p-4 bg-gradient-to-b from-amber-50/35 to-white hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Sales Orders ({range})</span>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2.5 text-xl sm:text-2xl font-bold text-amber-600 tabular">
              {formatPKR(salesTotal)}
            </div>
            <div className="mt-1.5 inline-flex items-center rounded bg-amber-100/80 text-amber-800 px-2 py-0.5 text-xs font-medium">
              {filteredInvoices.length} invoices billed
            </div>
          </div>

          <div
            onClick={() => navigate({ to: '/reports/cashbook' })}
            className="cursor-pointer border border-slate-300 border-t-4 border-t-purple-600 rounded-xl p-4 bg-gradient-to-b from-purple-50/35 to-white hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Cash in Hand (Live)</span>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2.5 text-xl sm:text-2xl font-bold text-purple-600 tabular">
              {formatPKR(cashAccount)}
            </div>
            <div className="mt-1.5 inline-flex items-center rounded bg-purple-100/80 text-purple-800 px-2 py-0.5 text-xs font-medium">
              Account A410 · Shop Counter
            </div>
          </div>

          <div
            onClick={() => navigate({ to: '/customers' })}
            className="cursor-pointer border border-slate-300 border-t-4 border-t-blue-600 rounded-xl p-4 bg-gradient-to-b from-blue-50/35 to-white hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Customer Receivables</span>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2.5 text-xl sm:text-2xl font-bold text-blue-600 tabular">
              {formatPKR(receivables)}
            </div>
            <div className="mt-1.5 inline-flex items-center rounded bg-blue-100/80 text-blue-800 px-2 py-0.5 text-xs font-medium">
              {customers.length} active customers
            </div>
          </div>

          <div
            onClick={() => navigate({ to: '/suppliers' })}
            className="cursor-pointer border border-slate-300 border-t-4 border-t-orange-500 rounded-xl p-4 bg-gradient-to-b from-orange-50/35 to-white hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Supplier & Dyer Dues</span>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2.5 text-xl sm:text-2xl font-bold text-orange-600 tabular">
              {formatPKR(payables)}
            </div>
            <div className="mt-1.5 inline-flex items-center rounded bg-orange-100/80 text-orange-800 px-2 py-0.5 text-xs font-medium">
              {suppliers.length} suppliers & dyers
            </div>
          </div>
        </section>

        {/* 3. ERPNext Categorized Documents & Reports Directory */}
        <section>
          <h3 className="text-base font-bold text-slate-900 mb-3.5">
            Fabric Retail & Accounting Documents
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentGroups.map(group => (
              <div
                key={group.title}
                className="border border-slate-300 rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 pb-3 mb-2.5 border-b border-slate-200">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${group.iconBg}`}>
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>{group.title}</span>
                </div>
                <ul className="space-y-2">
                  {group.items.map(item => (
                    <li key={item.path + item.label}>
                      <button
                        type="button"
                        onClick={() => navigate({ to: item.path as string })}
                        className="w-full text-left text-[13.5px] font-medium text-slate-700 hover:text-blue-600 flex items-center gap-2.5 py-0.5 group transition-colors"
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            item.primary ? group.dotBg : 'bg-slate-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.primary ? group.dotColor : 'bg-slate-500'
                            }`}
                          />
                        </span>
                        <span className="truncate group-hover:underline">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Analytics Charts Grid */}
        <section>
          <h3 className="text-base font-semibold text-slate-900 mb-3.5">
            Sales & Financial Analytics
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200/90 rounded-xl p-4 bg-white">
              <div className="text-xs font-semibold text-slate-600 mb-3">
                Last 30 Days Sales Trend & 7-Day Moving Avg (PKR)
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={last30} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickMargin={6} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={formatAxisPKR} width={48} />
                  <Tooltip
                    formatter={(v: number) => formatPKR(v)}
                    contentStyle={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Daily Sales" />
                  <Line
                    type="monotone"
                    dataKey="ma7"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={false}
                    name="7d Avg"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-slate-200/90 rounded-xl p-4 bg-white">
              <div className="text-xs font-semibold text-slate-600 mb-3">
                Top 5 Selling Fabrics (PKR)
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={topItems} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={formatAxisPKR} />
                  <YAxis type="category" dataKey="name" stroke="#334155" fontSize={11} width={145} />
                  <Tooltip
                    formatter={(v: number) => formatPKR(v)}
                    contentStyle={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-slate-200/90 rounded-xl p-4 bg-white">
              <div className="text-xs font-semibold text-slate-600 mb-3">
                Top 5 Customers by Revenue (PKR)
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={topCustomers} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={formatAxisPKR} />
                  <YAxis type="category" dataKey="name" stroke="#334155" fontSize={11} width={145} />
                  <Tooltip
                    formatter={(v: number) => formatPKR(v)}
                    contentStyle={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-slate-200/90 rounded-xl p-4 bg-white">
              <div className="text-xs font-semibold text-slate-600 mb-3">
                Expense Breakdown ({range})
              </div>
              {expenseBreakdown.length === 0 ? (
                <div className="h-[230px] flex items-center justify-center text-sm text-slate-400">
                  No expenses recorded for this period
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3">
                  <div className="sm:col-span-5 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={72}
                          paddingAngle={2}
                        >
                          {expenseBreakdown.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => formatPKR(v)}
                          contentStyle={{
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="sm:col-span-7 space-y-2 max-h-[210px] overflow-y-auto pr-1">
                    {expenseBreakdown.map(item => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-2 text-xs border-b border-slate-100 pb-1.5 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-slate-700 truncate">{item.name}</span>
                        </div>
                        <div className="font-mono text-slate-900 whitespace-nowrap shrink-0">
                          <span className="font-semibold">{formatPKR(item.value)}</span>
                          <span className="text-slate-400 ml-1.5">({item.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. Recent Activity & Low Stock Tables */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Recent Sales Invoices</span>
              <button
                type="button"
                onClick={() => navigate({ to: '/sales' })}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[440px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3.5 py-2 font-semibold">Serial</th>
                    <th className="text-left px-3.5 py-2 font-semibold">Date</th>
                    <th className="text-left px-3.5 py-2 font-semibold">Customer</th>
                    <th className="text-right px-3.5 py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.slice(0, 6).map(inv => {
                    const cust = parties.find(p => p.id === inv.customerId);
                    return (
                      <tr
                        key={inv.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })}
                      >
                        <td className="px-3.5 py-2 font-mono font-medium text-blue-600 whitespace-nowrap">
                          {inv.serial}
                        </td>
                        <td className="px-3.5 py-2 text-slate-500 whitespace-nowrap">
                          {formatDate(inv.date)}
                        </td>
                        <td className="px-3.5 py-2 font-medium text-slate-800">
                          {cust?.name ?? inv.customerId}
                        </td>
                        <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {formatPKR(inv.grandTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">Low Stock Alerts</span>
              <button
                type="button"
                onClick={() => navigate({ to: '/items' })}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Manage Stock →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-3.5 py-2 font-semibold">Fabric / Item</th>
                    <th className="text-right px-3.5 py-2 font-semibold">In Stock</th>
                    <th className="text-right px-3.5 py-2 font-semibold">Min Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items
                    .filter(it => it.stock <= it.minStock)
                    .slice(0, 6)
                    .map(it => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="px-3.5 py-2 font-medium text-slate-800">{it.name}</td>
                        <td className="px-3.5 py-2 text-right font-mono font-semibold text-red-600 whitespace-nowrap">
                          {it.stock} {it.unit}
                        </td>
                        <td className="px-3.5 py-2 text-right font-mono text-slate-500 whitespace-nowrap">
                          {it.minStock} {it.unit}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
