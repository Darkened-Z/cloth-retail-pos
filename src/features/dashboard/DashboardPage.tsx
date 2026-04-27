import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useExpenses } from '@/stores/useExpenses';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart as HBarChart } from 'recharts';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

type Range = 'today' | 'week' | 'month' | 'year';

function inRange(dateStr: string, range: Range): boolean {
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
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('month');

  useKeyboardShortcuts({
    n: () => navigate({ to: '/sales/new' }),
    d: () => navigate({ to: '/dyeing/new' }),
    e: () => navigate({ to: '/expenses' }),
    c: () => navigate({ to: '/customers' }),
  });

  const filtered = useMemo(() => invoices.filter(inv => inRange(inv.date, range)), [invoices, range]);
  const todayInvoices = useMemo(() => invoices.filter(inv => inRange(inv.date, 'today')), [invoices]);
  const yesterdayInvoices = useMemo(() => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return invoices.filter(inv => new Date(inv.date).toDateString() === y.toDateString());
  }, [invoices]);

  const todaySales = todayInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const yesterdaySales = yesterdayInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const todayCollection = todayInvoices.reduce((s, i) => s + i.paid, 0);
  const totalDues = parties.filter(p => p.type === 'customer').reduce((s, p) => s + p.currentBalance, 0);
  const cashAccount = 124500; // from seeded data

  const salesDelta = yesterdaySales ? ((todaySales - yesterdaySales) / yesterdaySales * 100) : 0;

  // Last 30 days sales chart
  const last30 = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    invoices.forEach(inv => { if (map[inv.date] !== undefined) map[inv.date] += inv.grandTotal; });
    return Object.entries(map).map(([date, total]) => ({ date: date.slice(5), total }));
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
      const key = e.accountId;
      map[key] = (map[key] ?? 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name: name.split(' ')[0], value }));
  }, [expenses]);

  // Top items
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filtered.forEach(inv => inv.lines.forEach(l => {
      if (!map[l.itemId]) map[l.itemId] = { name: l.itemId, qty: 0, revenue: 0 };
      map[l.itemId].qty += l.qty;
      map[l.itemId].revenue += l.amount;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered]);

  // Recent transactions
  const recent = useMemo(() =>
    [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [invoices]
  );

  // Alerts
  const lowStock = items.filter(i => i.stock <= i.minStock && i.minStock > 0);
  const overdue = parties.filter(p => p.type === 'customer' && p.currentBalance > 100000);

  const KPI = ({ title, value, delta, color }: { title: string; value: string; delta?: number; color?: string }) => (
    <div className="border-2 border-black shadow-brutal bg-white p-4 flex-1 min-w-[140px]">
      <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">{title}</div>
      <div className={`font-display text-2xl ${color ?? ''}`}>{value}</div>
      {delta !== undefined && (
        <div className={`text-xs font-mono mt-1 ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs yesterday
        </div>
      )}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      {/* Range toggle */}
      <div className="flex gap-0 border-2 border-black w-fit shadow-brutal-sm">
        {(['today','week','month','year'] as Range[]).map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-1.5 text-xs font-mono uppercase border-r-2 border-black last:border-0 ${range === r ? 'bg-black text-white' : 'bg-white hover:bg-accent'}`}>
            {r}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="flex gap-4 flex-wrap">
        <KPI title="Today's Sales"      value={formatPKR(todaySales)}      delta={salesDelta} />
        <KPI title="Today's Collection" value={formatPKR(todayCollection)} />
        <KPI title="Total Dues"         value={formatPKR(totalDues)}        color="text-danger" />
        <KPI title="Cash in Hand"       value={formatPKR(cashAccount)}      color="text-success" />
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || overdue.length > 0) && (
        <div className="border-2 border-danger bg-danger/5 px-4 py-2 flex gap-6 flex-wrap">
          {lowStock.length > 0 && <span className="text-xs font-mono text-danger">⚠ {lowStock.length} items low stock</span>}
          {overdue.length > 0 && <span className="text-xs font-mono text-danger">⚠ {overdue.length} customers with high dues</span>}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border-2 border-black shadow-brutal bg-white p-4">
          <div className="text-xs font-mono uppercase tracking-widest mb-3">Last 30 Days Sales</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last30}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} interval={4} />
              <YAxis tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Bar dataKey="total" fill="#FFB800" stroke="#000" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="border-2 border-black shadow-brutal bg-white p-4">
          <div className="text-xs font-mono uppercase tracking-widest mb-3">Top Customers by Dues</div>
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
        <div className="border-2 border-black shadow-brutal bg-white p-4">
          <div className="text-xs font-mono uppercase tracking-widest mb-3">Top 5 Selling Items</div>
          <table className="w-full text-xs font-mono">
            <thead><tr className="border-b-2 border-black">
              <th className="text-left pb-1">Item</th>
              <th className="text-right pb-1">Qty</th>
              <th className="text-right pb-1">Revenue</th>
            </tr></thead>
            <tbody>
              {topItems.map((item, i) => (
                <tr key={i} className="border-b border-black/20">
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-right">{item.qty}</td>
                  <td className="py-1 text-right">{formatPKR(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-2 border-black shadow-brutal bg-white p-4">
          <div className="text-xs font-mono uppercase tracking-widest mb-3">Expense Breakdown (This Month)</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={e => e.name}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#000" strokeWidth={1} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatPKR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="border-2 border-black shadow-brutal bg-white p-4">
        <div className="text-xs font-mono uppercase tracking-widest mb-3">Recent Transactions</div>
        <table className="w-full text-xs font-mono">
          <thead><tr className="border-b-2 border-black">
            <th className="text-left pb-1">Serial</th>
            <th className="text-left pb-1">Date</th>
            <th className="text-left pb-1">Customer</th>
            <th className="text-right pb-1">Total</th>
            <th className="text-right pb-1">Balance</th>
            <th className="text-left pb-1">Status</th>
          </tr></thead>
          <tbody>
            {recent.map(inv => {
              const customer = parties.find(p => p.id === inv.customerId);
              return (
                <tr key={inv.id} className="border-b border-black/20 hover:bg-muted cursor-pointer"
                  onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })}>
                  <td className="py-1">{inv.serial}</td>
                  <td className="py-1">{formatDate(inv.date)}</td>
                  <td className="py-1">{customer?.name ?? '—'}</td>
                  <td className="py-1 text-right">{formatPKR(inv.grandTotal)}</td>
                  <td className={`py-1 text-right ${inv.balance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(inv.balance)}</td>
                  <td className="py-1">
                    <span className={`px-1.5 border ${inv.paymentMode === 'cash' ? 'border-success text-success' : inv.paymentMode === 'credit' ? 'border-danger text-danger' : 'border-black'}`}>
                      {inv.paymentMode.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'N', label: 'New Invoice',  path: '/sales/new' },
          { key: 'D', label: 'New Dyeing',   path: '/dyeing/new' },
          { key: 'E', label: 'New Expense',  path: '/expenses' },
          { key: 'C', label: 'New Customer', path: '/customers' },
        ].map(a => (
          <button key={a.key} onClick={() => navigate({ to: a.path })}
            className="border-2 border-black shadow-brutal-sm px-4 py-2 text-xs font-mono hover:bg-accent brutal-press flex gap-2 items-center">
            <span className="border border-black px-1">{a.key}</span> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
