import { useState } from 'react';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useExpenses } from '@/stores/useExpenses';
import { useParties } from '@/stores/useParties';
import { useCoa } from '@/stores/useCoa';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO, daysAgo } from '@/lib/formatDate';

export function DayBookPage() {
  const [from, setFrom] = useState(daysAgo(7));
  const [to, setTo] = useState(todayISO());
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { expenses } = useExpenses();
  const { parties } = useParties();
  const { accounts } = useCoa();

  type Entry = { date: string; type: string; serial: string; party: string; debit: number; credit: number; };
  const entries: Entry[] = [];

  invoices.filter(i => i.date >= from && i.date <= to).forEach(inv => {
    const c = parties.find(p => p.id === inv.customerId);
    entries.push({ date: inv.date, type: 'SALE', serial: inv.serial, party: c?.name ?? '—', debit: 0, credit: inv.grandTotal });
    if (inv.paid > 0) entries.push({ date: inv.date, type: 'RECEIPT', serial: inv.serial, party: c?.name ?? '—', debit: inv.paid, credit: 0 });
  });

  purchases.filter(v => v.date >= from && v.date <= to).forEach(pv => {
    const s = parties.find(p => p.id === pv.supplierId);
    entries.push({ date: pv.date, type: 'PURCHASE', serial: pv.serial, party: s?.name ?? '—', debit: pv.grandTotal, credit: 0 });
  });

  expenses.filter(e => e.date >= from && e.date <= to).forEach(exp => {
    const acc = accounts.find(a => a.id === exp.accountId);
    entries.push({ date: exp.date, type: 'EXPENSE', serial: exp.id, party: acc?.name ?? exp.accountId, debit: exp.amount, credit: 0 });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));
  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">DAY BOOK</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <span className="font-mono text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>
      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Date','Type','Serial','Party','Debit','Credit'].map(h => <th key={h} className={`px-3 py-2 ${h==='Debit'||h==='Credit'?'text-right':'text-left'}`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={i} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                <td className="px-3 py-2">{formatDate(e.date)}</td>
                <td className="px-3 py-2"><span className={`px-1.5 border text-xs ${e.type==='SALE'?'border-success text-success':e.type==='PURCHASE'?'border-danger text-danger':e.type==='RECEIPT'?'border-accent':'border-black'}`}>{e.type}</span></td>
                <td className="px-3 py-2">{e.serial}</td>
                <td className="px-3 py-2 font-sans">{e.party}</td>
                <td className="px-3 py-2 text-right text-danger">{e.debit > 0 ? formatPKR(e.debit) : '—'}</td>
                <td className="px-3 py-2 text-right text-success">{e.credit > 0 ? formatPKR(e.credit) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-black text-white">
              <td colSpan={4} className="px-3 py-2 font-bold">TOTALS</td>
              <td className="px-3 py-2 text-right font-bold">{formatPKR(totalDebit)}</td>
              <td className="px-3 py-2 text-right font-bold">{formatPKR(totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
