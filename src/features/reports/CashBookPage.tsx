import { useState } from 'react';
import { useVouchers } from '@/stores/useVouchers';
import { useExpenses } from '@/stores/useExpenses';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useParties } from '@/stores/useParties';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

interface CashEntry {
  date: string;
  description: string;
  ref: string;
  debit: number;   // money in (receipts, cash sales)
  credit: number;  // money out (payments, cash purchases, expenses)
}

export function CashBookPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  const { receipts, payments } = useVouchers();
  const { expenses } = useExpenses();
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { parties } = useParties();
  const partyMap = Object.fromEntries(parties.map(p => [p.id, p.name]));

  const entries: CashEntry[] = [];

  // Cash receipts
  receipts.filter(r => r.receivedIn === 'cash' && r.date >= from && r.date <= to).forEach(r => {
    entries.push({ date: r.date, description: `Receipt - ${partyMap[r.partyId] ?? r.partyId}`, ref: r.serial, debit: r.amount, credit: 0 });
  });

  // Cash payments
  payments.filter(p => p.paidFrom === 'cash' && p.date >= from && p.date <= to).forEach(p => {
    entries.push({ date: p.date, description: `Payment - ${partyMap[p.partyId] ?? p.partyId}`, ref: p.serial, debit: 0, credit: p.amount });
  });

  // Cash sales
  invoices.filter(inv => inv.paymentMode === 'cash' && inv.date >= from && inv.date <= to).forEach(inv => {
    entries.push({ date: inv.date, description: `Cash Sale - ${partyMap[inv.customerId] ?? inv.customerId}`, ref: inv.serial, debit: inv.grandTotal, credit: 0 });
  });

  // Cash expenses
  expenses.filter(e => e.paidFrom === 'cash' && e.date >= from && e.date <= to).forEach(e => {
    entries.push({ date: e.date, description: `Expense - ${e.description}`, ref: e.id, debit: 0, credit: e.amount });
  });

  // Cash purchases
  purchases.filter(p => p.paymentMode === 'cash' && p.date >= from && p.date <= to).forEach(p => {
    entries.push({ date: p.date, description: `Purchase - ${partyMap[p.supplierId] ?? p.supplierId}`, ref: p.serial, debit: 0, credit: p.grandTotal });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));

  const totalDebit  = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const balance     = totalDebit - totalCredit;

  let running = 0;

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase tracking-tight">Cash Book</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="flex-1 sm:flex-initial border-2 border-black bg-white px-3 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <span className="font-mono text-xs sm:text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="flex-1 sm:flex-initial border-2 border-black bg-white px-3 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button onClick={() => window.print()}
            className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
            PRINT (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total Receipts (Dr)', value: formatNumber(Math.abs(totalDebit)), accent: 'text-success', badge: 'bg-green-100' },
          { label: 'Total Payments (Cr)', value: formatNumber(Math.abs(totalCredit)), accent: 'text-danger', badge: 'bg-red-100' },
          { label: 'Net Balance', value: `${formatNumber(Math.abs(balance))} ${balance >= 0 ? 'Dr' : 'Cr'}`, accent: balance >= 0 ? 'text-black' : 'text-danger', badge: balance >= 0 ? 'bg-accent' : 'bg-red-200' },
          { label: 'Transactions', value: String(entries.length), accent: 'text-black', badge: 'bg-muted' },
        ].map(c => (
          <div key={c.label} className="bg-white border-2 border-black shadow-brutal p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-mono font-bold uppercase text-gray-500">{c.label}</p>
              <span className={`w-2.5 h-2.5 border border-black ${c.badge}`} />
            </div>
            <p className={`text-xl sm:text-2xl font-display font-mono mt-1 whitespace-nowrap ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Date</th>
              <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Ref</th>
              <th className="text-left px-4 py-2.5 font-bold uppercase">Description</th>
              <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Debit (In)</th>
              <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Credit (Out)</th>
              <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              running += e.debit - e.credit;
              return (
                <tr key={i} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{formatDate(e.date)}</td>
                  <td className="px-4 py-2 font-mono text-xs font-bold whitespace-nowrap">{e.ref}</td>
                  <td className="px-4 py-2">{e.description}</td>
                  <td className="px-4 py-2 text-right font-mono text-green-700 whitespace-nowrap">{e.debit > 0 ? formatNumber(e.debit) : '—'}</td>
                  <td className="px-4 py-2 text-right font-mono text-red-600 whitespace-nowrap">{e.credit > 0 ? formatNumber(e.credit) : '—'}</td>
                  <td className={`px-4 py-2 text-right font-mono font-bold whitespace-nowrap ${running >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatNumber(Math.abs(running))} {running >= 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm font-mono">No cash transactions in this period</td></tr>
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot className="bg-black text-white border-t-2 border-black font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-2.5 uppercase text-right text-sm">Totals</td>
                <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">{formatNumber(totalDebit)}</td>
                <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">{formatNumber(totalCredit)}</td>
                <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap">
                  {formatNumber(Math.abs(balance))} {balance >= 0 ? 'Dr' : 'Cr'}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
