import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useExpenses } from '@/stores/useExpenses';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useCoa } from '@/stores/useCoa';
import { useVouchers } from '@/stores/useVouchers';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as HBarChart,
  CartesianGrid,
} from 'recharts';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

type Range = 'today' | 'week' | 'month' | 'year' | 'custom';

function inRange(dateStr: string, range: Range, fromDate?: string, toDate?: string): boolean {
  if (range === 'custom') {
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  }
  const d = new Date(dateStr);
  const now = new Date();
  if (range === 'today') return d.toDateString() === now.toDateString();
  if (range === 'week') {
    const w = new Date(now);
    w.setDate(w.getDate() - 7);
    return d >= w;
  }
  if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return d.getFullYear() === now.getFullYear();
}

function compactPKR(v: number): string {
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

const COLORS = ['#FFB800', '#000000', '#E63946', '#2D6A4F', '#3B82F6', '#8B5CF6'];

export function DashboardPage() {
  const { invoices } = useInvoices();
  const { expenses } = useExpenses();
  const { parties } = useParties();
  const { items } = useItems();
  const { accounts } = useCoa();
  const { receipts, payments } = useVouchers();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('month');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  useKeyboardShortcuts({
    n: () => navigate({ to: '/sales/new' }),
    d: () => navigate({ to: '/dyeing/new' }),
    e: () => navigate({ to: '/expenses' }),
    c: () => navigate({ to: '/customers' }),
  });

  const filtered = useMemo(
    () => invoices.filter(inv => inRange(inv.date, range, fromDate, toDate)),
    [invoices, range, fromDate, toDate]
  );
  const todayInvoices = useMemo(() => invoices.filter(inv => inRange(inv.date, 'today')), [invoices]);
  const yesterdayInvoices = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return invoices.filter(inv => new Date(inv.date).toDateString() === y.toDateString());
  }, [invoices]);

  const todaySales = todayInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const yesterdaySales = yesterdayInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const todayCollection =
    todayInvoices.reduce((s, i) => s + i.paid, 0) +
    receipts.filter(r => inRange(r.date, 'today')).reduce((s, r) => s + r.amount, 0);
  const totalDues = parties.filter(p => p.type === 'customer').reduce((s, p) => s + p.currentBalance, 0);

  const cashAccount = useMemo(() => {
    const base = accounts.find(a => a.id === 'A410')?.currentBalance ?? 124500;
    const todayCashIn =
      todayInvoices.filter(i => i.paymentMode !== 'credit').reduce((s, i) => s + i.paid, 0) +
      receipts.filter(r => r.receivedIn === 'cash' && inRange(r.date, 'today')).reduce((s, r) => s + r.amount, 0);
    const todayCashOut =
      payments.filter(p => p.paidFrom === 'cash' && inRange(p.date, 'today')).reduce((s, p) => s + p.amount, 0) +
      expenses.filter(e => e.paidFrom === 'cash' && inRange(e.date, 'today')).reduce((s, e) => s + e.amount, 0);
    return base + todayCashIn - todayCashOut;
  }, [accounts, todayInvoices, receipts, payments, expenses]);

  const salesDelta = yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

  // Last 30 days sales chart
  const last30 = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    invoices.forEach(inv => {
      if (map[inv.date] !== undefined) map[inv.date] += inv.grandTotal;
    });
    const entries = Object.entries(map).map(([date, total]) => ({ date: date.slice(5), total }));
    return entries.map((entry, idx) => {
      const windowSlice = entries.slice(Math.max(0, idx - 6), idx + 1);
      const ma7 = Math.round(windowSlice.reduce((s, x) => s + x.total, 0) / windowSlice.length);
      return { ...entry, ma7 };
    });
  }, [invoices]);

  // Top customers by dues (keep 2 words so names like "Muhammad Arshad" / "Haji Bashir" are distinct and readable)
  const topCustomers = useMemo(
    () =>
      parties
        .filter(p => p.type === 'customer' && p.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance)
        .slice(0, 5)
        .map(p => ({
          name: p.name.split(' ').slice(0, 2).join(' '),
          balance: p.currentBalance,
        })),
    [parties]
  );

  // Expense breakdown this month
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter(e => inRange(e.date, range, fromDate, toDate))
      .forEach(e => {
        const key = accounts.find(a => a.id === e.accountId)?.name ?? e.accountId;
        map[key] = (map[key] ?? 0) + e.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, accounts, range, fromDate, toDate]);

  // Top items
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(inv =>
      inv.lines.forEach(l => {
        const itemName = items.find(it => it.id === l.itemId)?.name ?? l.itemId;
        if (!map[l.itemId]) map[l.itemId] = { name: itemName, qty: 0, revenue: 0 };
        map[l.itemId].qty += l.qty;
        map[l.itemId].revenue += l.amount;
      })
    );
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filtered, items]);

  // Recent transactions
  const recent = useMemo(
    () => [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [invoices]
  );

  // Alerts
  const lowStock = items.filter(i => i.stock <= i.minStock && i.minStock > 0);
  const overdue = parties.filter(p => p.type === 'customer' && p.currentBalance > 100000);

  const KPI = ({
    title,
    value,
    delta,
    color,
    subtext,
  }: {
    title: string;
    value: string;
    delta?: number;
    color?: string;
    subtext?: string;
  }) => (
    <div className="bg-white border-2 border-black shadow-brutal p-4 sm:p-5 flex flex-col justify-between">
      <div className="text-xs font-mono font-bold uppercase tracking-wider text-gray-700 mb-1.5">{title}</div>
      <div className={`font-display text-2xl sm:text-3xl tracking-tight whitespace-nowrap ${color ?? 'text-black'}`}>
        {value}
      </div>
      {delta !== undefined ? (
        <div className={`text-xs font-mono font-bold mt-2 ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs yesterday
        </div>
      ) : subtext ? (
        <div className="text-xs font-mono text-gray-600 mt-2">{subtext}</div>
      ) : null}
    </div>
  );

  return (
    <div className="p-3 sm:p-6 space-y-5 max-w-[1440px] mx-auto">
      {/* Header & Range toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-tight">DASHBOARD</h1>
          <p className="text-xs font-mono text-gray-600">
            Quick overview of sales, receivables, stock alerts & expenses
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex border-2 border-black w-full sm:w-fit shadow-brutal-sm bg-white overflow-x-auto">
            {(['today', 'week', 'month', 'year', 'custom'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-mono font-bold uppercase border-r-2 border-black last:border-0 whitespace-nowrap transition-colors ${
                  range === r ? 'bg-black text-accent' : 'bg-white hover:bg-accent text-black'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="flex-1 sm:flex-initial border-2 border-black bg-white px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <span className="text-xs font-mono font-bold">to</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="flex-1 sm:flex-initial border-2 border-black bg-white px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Bar (Top for instant access on mobile & desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { key: 'N', label: 'New Sales Invoice', path: '/sales/new', primary: true },
          { key: 'D', label: 'New Dyeing Voucher', path: '/dyeing/new' },
          { key: 'E', label: 'Record Expense', path: '/expenses' },
          { key: 'C', label: 'Customers & Ledger', path: '/customers' },
        ].map(a => (
          <button
            key={a.key}
            onClick={() => navigate({ to: a.path })}
            className={`border-2 border-black shadow-brutal-sm px-3.5 py-2.5 text-xs font-mono font-bold brutal-press flex gap-2.5 items-center justify-between transition-colors ${
              a.primary ? 'bg-accent hover:bg-black hover:text-white' : 'bg-white hover:bg-accent'
            }`}
          >
            <span className="truncate">{a.label}</span>
            <kbd className="border border-black px-1.5 py-0.5 bg-white text-black text-[11px] shrink-0">{a.key}</kbd>
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI title="Today's Sales" value={formatPKR(todaySales)} delta={salesDelta} />
        <KPI
          title="Today's Collection"
          value={formatPKR(todayCollection)}
          subtext={`${todayInvoices.length} invoice(s) today`}
        />
        <KPI
          title="Total Receivable Dues"
          value={formatPKR(totalDues)}
          color="text-danger"
          subtext={`${overdue.length} high-balance accounts`}
        />
        <KPI
          title="Cash in Hand"
          value={formatPKR(cashAccount)}
          color="text-success"
          subtext="Live counter balance"
        />
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || overdue.length > 0) && (
        <div className="border-2 border-danger bg-white shadow-brutal-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex gap-4 sm:gap-6 flex-wrap items-center">
            {lowStock.length > 0 && (
              <button
                onClick={() => navigate({ to: '/items' })}
                className="text-xs font-mono font-bold text-danger hover:underline flex items-center gap-1.5"
              >
                <span>⚠ {lowStock.length} item(s) at or below minimum stock</span>
              </button>
            )}
            {overdue.length > 0 && (
              <button
                onClick={() => navigate({ to: '/reports/debtors' })}
                className="text-xs font-mono font-bold text-danger hover:underline flex items-center gap-1.5"
              >
                <span>⚠ {overdue.length} customer(s) with dues over PKR 1,00,000</span>
              </button>
            )}
          </div>
          <span className="text-[11px] font-mono text-gray-600">Click alert to inspect</span>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-black shadow-brutal p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
            <span className="text-sm font-mono font-bold uppercase tracking-wider">Last 30 Days Sales</span>
            <span className="text-xs font-mono text-gray-600">Bars: Daily · Line: 7d Avg</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={last30} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#111' }}
                interval={4}
              />
              <YAxis
                tickFormatter={compactPKR}
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#111' }}
                width={48}
              />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Bar dataKey="total" fill="#FFB800" stroke="#000" strokeWidth={1} name="Daily Sales" />
              <Line type="monotone" dataKey="ma7" stroke="#000000" strokeWidth={2.5} dot={false} name="7d Moving Avg" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border-2 border-black shadow-brutal p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
            <span className="text-sm font-mono font-bold uppercase tracking-wider">Top 5 Customers by Dues</span>
            <button
              onClick={() => navigate({ to: '/reports/debtors' })}
              className="text-xs font-mono font-bold underline hover:text-danger"
            >
              View All →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <HBarChart data={topCustomers} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tickFormatter={compactPKR}
                tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#111' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 600, fill: '#111' }}
                width={125}
              />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Bar dataKey="balance" fill="#E63946" stroke="#000" strokeWidth={1} name="Receivable Balance" />
            </HBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-black shadow-brutal p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
            <span className="text-sm font-mono font-bold uppercase tracking-wider">Top 5 Selling Fabrics</span>
            <span className="text-xs font-mono uppercase text-gray-600">Period: {range}</span>
          </div>
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[320px] font-mono">
              <thead>
                <tr className="border-b-2 border-black bg-black text-white">
                  <th className="text-left px-3 py-2">Fabric / Item</th>
                  <th className="text-right px-3 py-2 whitespace-nowrap">Qty Sold</th>
                  <th className="text-right px-3 py-2 whitespace-nowrap">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i} className="border-b border-black/20">
                    <td className="px-3 py-2 font-sans font-semibold">{item.name}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{item.qty}</td>
                    <td className="px-3 py-2 text-right font-bold whitespace-nowrap">{formatPKR(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border-2 border-black shadow-brutal p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
            <span className="text-sm font-mono font-bold uppercase tracking-wider">Expense Breakdown</span>
            <button
              onClick={() => navigate({ to: '/expenses' })}
              className="text-xs font-mono font-bold underline"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={78}
                >
                  {expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#000" strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPKR(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {expenseBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs font-mono border-b border-black/15 pb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 border border-black shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-sans font-semibold truncate">{item.name}</span>
                  </div>
                  <span className="font-bold whitespace-nowrap ml-2">{formatPKR(item.value)}</span>
                </div>
              ))}
              {expenseBreakdown.length === 0 && (
                <div className="text-xs font-mono text-gray-600">No expenses in selected range</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border-2 border-black shadow-brutal p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black">
          <span className="text-sm font-mono font-bold uppercase tracking-wider">Recent Sales Invoices</span>
          <button
            onClick={() => navigate({ to: '/sales' })}
            className="text-xs font-mono font-bold underline"
          >
            View All Invoices →
          </button>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[580px] font-mono">
            <thead>
              <tr className="bg-black text-white border-b-2 border-black">
                <th className="text-left px-3 py-2 whitespace-nowrap">Serial</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Date</th>
                <th className="text-left px-3 py-2">Customer</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Grand Total</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Balance</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">Mode</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inv, idx) => {
                const customer = parties.find(p => p.id === inv.customerId);
                return (
                  <tr
                    key={inv.id}
                    className={`border-b border-black/20 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/40'}`}
                    onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })}
                  >
                    <td className="px-3 py-2 whitespace-nowrap font-bold">{inv.serial}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="px-3 py-2 font-sans font-semibold">{customer?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap font-bold">{formatPKR(inv.grandTotal)}</td>
                    <td
                      className={`px-3 py-2 text-right whitespace-nowrap font-bold ${
                        inv.balance > 0 ? 'text-danger' : 'text-success'
                      }`}
                    >
                      {formatPKR(inv.balance)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 border font-bold text-xs ${
                          inv.paymentMode === 'cash'
                            ? 'border-success bg-success/10 text-success'
                            : inv.paymentMode === 'credit'
                            ? 'border-danger bg-danger/10 text-danger'
                            : 'border-black bg-accent/30 text-black'
                        }`}
                      >
                        {inv.paymentMode.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
