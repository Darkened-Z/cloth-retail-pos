import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useExpenses } from '@/stores/useExpenses';
import { formatPKR } from '@/lib/formatNumber';
import { useState } from 'react';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function ProfitLossPage() {
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { expenses } = useExpenses();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const years = Array.from(new Set([2023, 2024, 2025, 2026, currentYear])).sort((a, b) => a - b);

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  const inYear = (d: string) => d.startsWith(String(year));

  const revenue = invoices.filter(i => inYear(i.date)).reduce((s, i) => s + i.grandTotal, 0);
  const purchaseCogs = purchases.filter(p => inYear(p.date)).reduce((s, p) => s + p.grandTotal, 0);
  const dyeingCogs = dyeings.filter(d => inYear(d.date)).reduce((s, d) => s + d.totalValue, 0);
  const cogs = purchaseCogs + dyeingCogs;
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.filter(e => inYear(e.date)).reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const Row = ({ label, value, bold, indent, color }: { label: string; value: number; bold?: boolean; indent?: boolean; color?: string }) => (
    <tr className={`border-b border-black/20 ${bold ? 'bg-muted' : 'bg-white'}`}>
      <td className={`px-3 py-2.5 font-mono text-xs sm:text-sm ${indent ? 'pl-6 sm:pl-8' : ''} ${bold ? 'font-bold' : ''}`}>{label}</td>
      <td className={`px-3 py-2.5 text-right font-mono text-xs sm:text-sm font-bold whitespace-nowrap ${color ?? (value >= 0 ? 'text-success' : 'text-danger')}`}>{formatPKR(Math.abs(value))}</td>
    </tr>
  );

  return (
    <div className="p-3 sm:p-6 max-w-3xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl">PROFIT & LOSS</h1>
        <div className="flex items-center gap-2">
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="flex-1 sm:flex-initial border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => window.print()}
            className="flex-1 sm:flex-initial border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press whitespace-nowrap">
            PRINT (Ctrl+P)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Revenue</div>
          <div className="font-display text-xl whitespace-nowrap text-success">{formatPKR(revenue)}</div>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">COGS</div>
          <div className="font-display text-xl whitespace-nowrap text-danger">{formatPKR(cogs)}</div>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Gross Profit</div>
          <div className={`font-display text-xl whitespace-nowrap ${grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatPKR(Math.abs(grossProfit))}</div>
        </div>
        <div className="bg-white border-2 border-black shadow-brutal p-4">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">Net {netProfit >= 0 ? 'Profit' : 'Loss'}</div>
          <div className={`font-display text-xl whitespace-nowrap ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatPKR(Math.abs(netProfit))}</div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="bg-black text-white"><th className="px-3 py-2.5 text-left font-display">Category</th><th className="px-3 py-2.5 text-right font-display whitespace-nowrap">Amount</th></tr>
          </thead>
          <tbody>
            <tr className="bg-muted"><td colSpan={2} className="px-3 py-1.5 text-xs font-mono font-bold uppercase border-b border-black/20">INCOME</td></tr>
            <Row label="Sales Revenue" value={revenue} indent />
            <Row label="GROSS PROFIT" value={grossProfit} bold color={grossProfit >= 0 ? 'text-success' : 'text-danger'} />
            <tr className="bg-muted"><td colSpan={2} className="px-3 py-1.5 text-xs font-mono font-bold uppercase border-b border-black/20">EXPENSES</td></tr>
            <Row label="Cost of Goods Sold" value={cogs} indent color="text-danger" />
            <Row label="Operating Expenses" value={totalExpenses} indent color="text-danger" />
            <Row label="TOTAL EXPENSES" value={cogs + totalExpenses} bold color="text-danger" />
            <tr className={`${netProfit >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>
              <td className="px-3 py-3 font-display text-base sm:text-lg">NET PROFIT</td>
              <td className="px-3 py-3 text-right font-display text-base sm:text-lg font-bold whitespace-nowrap">{formatPKR(Math.abs(netProfit))} {netProfit < 0 ? '(LOSS)' : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
