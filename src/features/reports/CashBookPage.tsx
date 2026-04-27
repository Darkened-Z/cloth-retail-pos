import { useState } from 'react';
import { useVouchers } from '@/stores/useVouchers';
import { useExpenses } from '@/stores/useExpenses';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useParties } from '@/stores/useParties';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';

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
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-black uppercase tracking-tight">Cash Book</h1>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border-2 border-black px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border-2 border-black px-3 py-2 text-sm focus:outline-none" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Receipts (Dr)', value: totalDebit, color: 'bg-green-100' },
          { label: 'Total Payments (Cr)', value: totalCredit, color: 'bg-red-100' },
          { label: 'Net Balance', value: balance, color: balance >= 0 ? 'bg-accent' : 'bg-red-200' },
        ].map(c => (
          <div key={c.label} className={`border-2 border-black p-4 ${c.color}`}>
            <p className="text-xs font-bold uppercase">{c.label}</p>
            <p className="text-2xl font-black font-mono mt-1">{formatNumber(Math.abs(c.value))}</p>
          </div>
        ))}
      </div>

      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-2 font-bold uppercase">Date</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Ref</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Description</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Debit (In)</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Credit (Out)</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Balance</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              running += e.debit - e.credit;
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2">{formatDate(e.date)}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e.ref}</td>
                  <td className="px-4 py-2">{e.description}</td>
                  <td className="px-4 py-2 text-right font-mono text-green-700">{e.debit > 0 ? formatNumber(e.debit) : ''}</td>
                  <td className="px-4 py-2 text-right font-mono text-red-600">{e.credit > 0 ? formatNumber(e.credit) : ''}</td>
                  <td className={`px-4 py-2 text-right font-mono font-bold ${running >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatNumber(Math.abs(running))} {running >= 0 ? 'Dr' : 'Cr'}
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No cash transactions in this period</td></tr>
            )}
          </tbody>
          {entries.length > 0 && (
            <tfoot className="bg-gray-100 border-t-2 border-black font-bold">
              <tr>
                <td colSpan={3} className="px-4 py-2 uppercase text-right text-sm">Totals</td>
                <td className="px-4 py-2 text-right font-mono text-green-700">{formatNumber(totalDebit)}</td>
                <td className="px-4 py-2 text-right font-mono text-red-600">{formatNumber(totalCredit)}</td>
                <td className={`px-4 py-2 text-right font-mono ${balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
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
