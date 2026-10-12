import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useExpenses } from '@/stores/useExpenses';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useCoa } from '@/stores/useCoa';
import { useVouchers } from '@/stores/useVouchers';
import { usePurchase } from '@/stores/usePurchase';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart as HBarChart } from 'recharts';
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
  if (range === 'week') { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; }
  if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return d.getFullYear() === now.getFullYear();
}

const COLORS = ['#FFB800','#000000','#E63946','#2D6A4F','#6B7280'];

export function DashboardPage() {
  const { invoices } = useInvoices();
  const { expenses } = useExpenses();
  const { parties } = useParties();
  const { items } = useItems();
  const { accounts } = useCoa();
  const { receipts, payments } = useVouchers();
  const { vouchers: purchases } = usePurchase();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('month');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  useKeyboardShortcuts({
    n: () => navigate({ to: '/sales/new' }),
    d: () => navigate({ to: '/dyeing/new' }),
    e: () => navigate({ to: '/expenses' }),
    c: () => navigate({ to: '/customers' }),
  });

  const filtered = useMemo(() => invoices.filter(inv => inRange(inv.date, range, fromDate, toDate)), [invoices, range, fromDate, toDate]);
  const todayInvoices = useMemo(() => invoices.filter(inv => inRange(inv.date, 'today')), [invoices]);
  const yesterdayInvoices = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return invoices.filter(inv => new Date(inv.date).toDateString() === y.toDateString());
  }, [invoices]);

  const todaySales = todayInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const yesterdaySales = yesterdayInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const todayCollection = todayInvoices.reduce((s, i) => s + i.paid, 0);
  const totalDues = parties.filter(p => p.type === 'customer').reduce((s, p) => s + p.currentBalance, 0);
  const cashAccount = useMemo(() => {
    const base = accounts.find(a => a.id === 'A410')?.openingBalance ?? 124500;
    const cashSales = invoices.reduce((s, inv) => s + (inv.paid ?? 0), 0);
    const cashReceipts = receipts.filter(r => r.receivedIn === 'cash').reduce((s, r) => s + r.amount, 0);
    const cashPurchases = purchases.reduce((s, p) => s + (p.paid ?? 0), 0);
    const cashPayments = payments.filter(p => p.paidFrom === 'cash').reduce((s, p) => s + p.amount, 0);
    const cashExpenses = expenses.filter(e => e.paidFrom === 'cash').reduce((s, e) => s + e.amount, 0);
    return base + cashSales + cashReceipts - cashPurchases - cashPayments - cashExpenses;
  }, [accounts, invoices, receipts, purchases, payments, expenses]);

  const salesDelta = yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales * 100) : 0;

  // Last 30 days sales chart
  const last30 = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    invoices.forEach(inv => { if (map[inv.date] !== undefined) map[inv.date] += inv.grandTotal; });
    const entries = Object.entries(map).map(([date, total]) => ({ date: date.slice(5), total }));
    return entries.map((entry, idx) => {
      const windowSlice = entries.slice(Math.max(0, idx - 6), idx + 1);
      const ma7 = Math.round(windowSlice.reduce((s, x) => s + x.total, 0) / windowSlice.length);
      return { ...entry, ma7 };
    });
  }, [invoices]);

  // Top customers by dues
  const topCustomers = useMemo(() =>
    parties.filter(p => p.type === 'customer' && p.currentBalance > 0)
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, 5)
      .map(p => ({ name: p.name.split(' ')[0], balance: p.currentBalance })),
    [parties]
  );

  // Expense breakdown this month
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.filter(e => inRange(e.date, 'month')).forEach(e => {
      const key = accounts.find(a => a.id === e.accountId)?.name ?? e.accountId;
      map[key] = (map[key] ?? 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses, accounts]);

  // Top items
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(inv => inv.lines.forEach(l => {
      const itemName = items.find(it => it.id === l.itemId)?.name ?? l.itemId;
      if (!map[l.itemId]) map[l.itemId] = { name: itemName, qty: 0, revenue: 0 };
      map[l.itemId].qty += l.qty;
      map[l.itemId].revenue += l.amount;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered, items]);

  // Recent transactions
  const recent = useMemo(() =>
    [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [invoices]
  );

  // Alerts
  const lowStock = items.filter(i => i.stock <= i.minStock && i.minStock > 0);
  const overdue = parties.filter(p => p.type === 'customer' && p.currentBalance > 100000);

  const KPI = ({ title, value, delta, color }: { title: string; value: string; delta?: number; color?: string }) => (
    <div className="bg-white border-2 border-black shadow-brutal p-4">
      <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">{title}</div>
      <div className={`font-display text-xl sm:text-2xl whitespace-nowrap ${color ?? ''}`}>{value}</div>
      {delta !== undefined && (
        <div className={`text-xs font-mono mt-1 ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header & Range toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase tracking-tight">DASHBOARD</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex border-2 border-black w-full sm:w-fit shadow-brutal-sm bg-white overflow-x-auto">
            {(['today','week','month','year','custom'] as Range[]).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`flex-1 sm:flex-initial px-2.5 sm:px-4 py-1.5 text-xs font-mono uppercase border-r-2 border-black last:border-0 whitespace-nowrap ${range === r ? 'bg-black text-white' : 'bg-white hover:bg-accent'}`}>
                {r}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="flex-1 sm:flex-initial border-2 border-black bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
              <span className="text-xs font-mono">to</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="flex-1 sm:flex-initial border-2 border-black bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI title="Today's Sales"      value={formatPKR(todaySales)}      delta={salesDelta} />
        <KPI title="Today's Collection" value={formatPKR(todayCollection)} />
        <KPI title="Total Dues"         value={formatPKR(totalDues)}        color="text-danger" />
        <KPI title="Cash in Hand"       value={formatPKR(cashAccount)}      color="text-success" />
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || overdue.length > 0) && (
        <div className="border-2 border-danger bg-white shadow-brutal-sm px-4 py-2.5 flex gap-4 sm:gap-6 flex-wrap">
          {lowStock.length > 0 && <span className="text-xs font-mono font-bold text-danger">⚠ {lowStock.length} items low stock</span>}
          {overdue.length > 0 && <span className="text-xs font-mono font-bold text-danger">⚠ {overdue.length} customers with high dues</span>}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 pb-2 border-b-2 border-black">Last 30 Days Sales</div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={last30}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={4} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Bar dataKey="total" fill="#FFB800" stroke="#000" strokeWidth={1} name="Sales" />
              <Line type="monotone" dataKey="ma7" stroke="#000000" strokeWidth={2} dot={false} name="7d Avg" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 pb-2 border-b-2 border-black">Top Customers by Dues</div>
          <ResponsiveContainer width="100%" height={200}>
            <HBarChart data={topCustomers} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={80} />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Bar dataKey="balance" fill="#E63946" stroke="#000" strokeWidth={1} />
            </HBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 pb-2 border-b-2 border-black">Top 5 Selling Items</div>
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[320px] text-xs font-mono">
              <thead><tr className="border-b-2 border-black bg-black text-white">
                <th className="text-left px-2 py-1.5">Item</th>
                <th className="text-right px-2 py-1.5 whitespace-nowrap">Qty</th>
                <th className="text-right px-2 py-1.5 whitespace-nowrap">Revenue</th>
              </tr></thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i} className="border-b border-black/20">
                    <td className="px-2 py-1.5">{item.name}</td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">{item.qty}</td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">{formatPKR(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 pb-2 border-b-2 border-black">Expense Breakdown (This Month)</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} label={e => e.name}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#000" strokeWidth={1} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatPKR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white border-2 border-black shadow-brutal p-4">
        <div className="text-xs font-mono font-bold uppercase tracking-widest mb-3 pb-2 border-b-2 border-black">Recent Transactions</div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full min-w-[540px] text-xs font-mono">
            <thead><tr className="bg-black text-white border-b-2 border-black">
              <th className="text-left px-2.5 py-2 whitespace-nowrap">Serial</th>
              <th className="text-left px-2.5 py-2 whitespace-nowrap">Date</th>
              <th className="text-left px-2.5 py-2">Customer</th>
              <th className="text-right px-2.5 py-2 whitespace-nowrap">Total</th>
              <th className="text-right px-2.5 py-2 whitespace-nowrap">Balance</th>
              <th className="text-left px-2.5 py-2 whitespace-nowrap">Status</th>
            </tr></thead>
            <tbody>
              {recent.map(inv => {
                const customer = parties.find(p => p.id === inv.customerId);
                return (
                  <tr key={inv.id} className="border-b border-black/20 hover:bg-muted cursor-pointer"
                    onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })}>
                    <td className="px-2.5 py-2 whitespace-nowrap font-bold">{inv.serial}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap">{formatDate(inv.date)}</td>
                    <td className="px-2.5 py-2">{customer?.name ?? '—'}</td>
                    <td className="px-2.5 py-2 text-right whitespace-nowrap">{formatPKR(inv.grandTotal)}</td>
                    <td className={`px-2.5 py-2 text-right whitespace-nowrap ${inv.balance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(inv.balance)}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border ${inv.paymentMode === 'cash' ? 'border-success text-success' : inv.paymentMode === 'credit' ? 'border-danger text-danger' : 'border-black'}`}>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:flex gap-2.5 sm:gap-3 flex-wrap">
        {[
          { key: 'N', label: 'New Invoice',  path: '/sales/new' },
          { key: 'D', label: 'New Dyeing',   path: '/dyeing/new' },
          { key: 'E', label: 'New Expense',  path: '/expenses' },
          { key: 'C', label: 'New Customer', path: '/customers' },
        ].map(a => (
          <button key={a.key} onClick={() => navigate({ to: a.path })}
            className="bg-white border-2 border-black shadow-brutal-sm px-3 sm:px-4 py-2 text-xs font-mono hover:bg-accent brutal-press flex gap-2 items-center justify-center sm:justify-start">
            <span className="border border-black px-1 bg-muted font-bold">{a.key}</span> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
