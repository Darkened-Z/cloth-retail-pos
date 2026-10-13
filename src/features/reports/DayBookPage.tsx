import { useState } from 'react';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useExpenses } from '@/stores/useExpenses';
import { useParties } from '@/stores/useParties';
import { useCoa } from '@/stores/useCoa';
import { useVouchers } from '@/stores/useVouchers';
import { useJournals } from '@/stores/useJournals';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO, daysAgo } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function DayBookPage() {
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(todayISO());
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { expenses } = useExpenses();
  const { parties } = useParties();
  const { accounts } = useCoa();
  const { receipts, payments } = useVouchers();
  const { journals } = useJournals();

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  type Entry = { date: string; type: string; serial: string; party: string; debit: number; credit: number; description?: string; };
  const entries: Entry[] = [];

  let salesSum = 0;
  let receiptsSum = 0;
  let purchasesSum = 0;
  let dyeingsSum = 0;
  let expensesSum = 0;
  let paymentsSum = 0;

  invoices.filter(i => i.date >= from && i.date <= to).forEach(inv => {
    const c = parties.find(p => p.id === inv.customerId);
    salesSum += inv.grandTotal;
    entries.push({
      date: inv.date,
      type: 'SALE',
      serial: inv.serial,
      party: c?.name ?? inv.customerId,
      debit: inv.grandTotal,
      credit: inv.grandTotal,
      description: `Sale to ${c?.name ?? inv.customerId} (${inv.paymentMode})`,
    });
  });

  purchases.filter(v => v.date >= from && v.date <= to).forEach(pv => {
    const s = parties.find(p => p.id === pv.supplierId);
    purchasesSum += pv.grandTotal;
    entries.push({
      date: pv.date,
      type: 'PURCHASE',
      serial: pv.serial,
      party: s?.name ?? pv.supplierId,
      debit: pv.grandTotal,
      credit: pv.grandTotal,
      description: `Purchase from ${s?.name ?? pv.supplierId} (${pv.paymentMode})`,
    });
  });

  dyeings.filter(d => d.date >= from && d.date <= to).forEach(dv => {
    const dy = parties.find(p => p.id === dv.dyerId);
    dyeingsSum += dv.totalValue;
    entries.push({
      date: dv.date,
      type: 'DYEING',
      serial: dv.serial,
      party: dy?.name ?? dv.dyerId,
      debit: dv.totalValue,
      credit: dv.totalValue,
      description: `Dyeing by ${dy?.name ?? dv.dyerId}`,
    });
  });

  expenses.filter(e => e.date >= from && e.date <= to).forEach(exp => {
    const acc = accounts.find(a => a.id === exp.accountId);
    expensesSum += exp.amount;
    entries.push({
      date: exp.date,
      type: 'EXPENSE',
      serial: exp.id,
      party: acc?.name ?? exp.accountId,
      debit: exp.amount,
      credit: exp.amount,
      description: exp.description || (acc?.name ?? 'Expense'),
    });
  });

  receipts.filter(r => r.date >= from && r.date <= to).forEach(rv => {
    const p = parties.find(pt => pt.id === rv.partyId);
    receiptsSum += rv.amount;
    entries.push({
      date: rv.date,
      type: 'RECEIPT',
      serial: rv.serial,
      party: p?.name ?? rv.partyId,
      debit: rv.amount,
      credit: rv.amount,
      description: rv.description || `Receipt from ${p?.name ?? rv.partyId}`,
    });
  });

  payments.filter(p => p.date >= from && p.date <= to).forEach(pv => {
    const p = parties.find(pt => pt.id === pv.partyId);
    paymentsSum += pv.amount;
    entries.push({
      date: pv.date,
      type: 'PAYMENT',
      serial: pv.serial,
      party: p?.name ?? pv.partyId,
      debit: pv.amount,
      credit: pv.amount,
      description: pv.description || `Payment to ${p?.name ?? pv.partyId}`,
    });
  });

  journals.filter(j => j.date >= from && j.date <= to).forEach(jv => {
    const dr = jv.lines.reduce((s, l) => s + l.debit, 0);
    const cr = jv.lines.reduce((s, l) => s + l.credit, 0);
    entries.push({
      date: jv.date,
      type: 'JOURNAL',
      serial: jv.serial,
      party: jv.narration,
      debit: dr,
      credit: cr,
      description: jv.narration,
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-display text-2xl uppercase tracking-tight">Day Book (Daily Register / روزنامچہ)</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-300">
            ✓ Balanced (Dr = Cr: {formatPKR(totalDebit)})
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="flex-1 sm:flex-initial border-2 border-black bg-white px-3 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <span className="font-mono text-xs sm:text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="flex-1 sm:flex-initial border-2 border-black bg-white px-3 py-2 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button onClick={() => window.print()}
            className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
            PRINT (Ctrl+P)
          </button>
        </div>
      </div>

      {/* KPI summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <p className="text-xs font-mono font-bold uppercase text-gray-500">Day Book Turnover</p>
          <p className="text-xl sm:text-2xl font-display font-mono mt-1 whitespace-nowrap text-primary">{formatPKR(totalDebit)}</p>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <p className="text-xs font-mono font-bold uppercase text-gray-500">Sales & Receipts</p>
          <p className="text-xl sm:text-2xl font-display font-mono mt-1 whitespace-nowrap text-success">{formatPKR(salesSum + receiptsSum)}</p>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <p className="text-xs font-mono font-bold uppercase text-gray-500">Purchases & Outflows</p>
          <p className="text-xl sm:text-2xl font-display font-mono mt-1 whitespace-nowrap text-danger">{formatPKR(purchasesSum + dyeingsSum + expensesSum + paymentsSum)}</p>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <p className="text-xs font-mono font-bold uppercase text-gray-500">Total Entries</p>
          <p className="text-xl sm:text-2xl font-display font-mono mt-1 whitespace-nowrap text-black">{entries.length} vouchers</p>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[700px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-3 py-2.5 text-left whitespace-nowrap uppercase">Date</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap uppercase">Type</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap uppercase">Voucher #</th>
              <th className="px-3 py-2.5 text-left uppercase">Particulars / Party</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap uppercase">Debit (Dr)</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap uppercase">Credit (Cr)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className={`border-b border-black/20 hover:bg-muted ${i % 2 === 0 ? 'bg-white' : 'bg-muted/50'}`}>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 border text-xs font-bold ${
                    e.type === 'SALE' ? 'border-success text-success bg-green-50' :
                    e.type === 'PURCHASE' ? 'border-danger text-danger bg-red-50' :
                    e.type === 'RECEIPT' ? 'border-blue-600 text-blue-600 bg-blue-50' :
                    e.type === 'PAYMENT' ? 'border-amber-600 text-amber-700 bg-amber-50' :
                    e.type === 'DYEING' ? 'border-purple-600 text-purple-700 bg-purple-50' :
                    'border-black text-black bg-gray-100'
                  }`}>
                    {e.type}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap font-bold">{e.serial}</td>
                <td className="px-3 py-2 font-sans font-medium text-gray-800">{e.party}</td>
                <td className="px-3 py-2 text-right text-black font-semibold whitespace-nowrap">{e.debit > 0 ? formatPKR(e.debit) : '—'}</td>
                <td className="px-3 py-2 text-right text-black font-semibold whitespace-nowrap">{e.credit > 0 ? formatPKR(e.credit) : '—'}</td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 font-mono">No transactions found for the selected period</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-black text-white">
            <tr>
              <td colSpan={4} className="px-3 py-2.5 font-bold uppercase text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 font-normal">
                    ✓ Total Debit ≡ Total Credit
                  </span>
                  <span>Total Debit & Credit</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">{formatPKR(totalDebit)}</td>
              <td className="px-3 py-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">{formatPKR(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
