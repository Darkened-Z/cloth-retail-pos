import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useExpenses } from '@/stores/useExpenses';
import { formatPKR } from '@/lib/formatNumber';
import { useState } from 'react';

export function ProfitLossPage() {
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { expenses } = useExpenses();
  const [year, setYear] = useState(new Date().getFullYear());

  const inYear = (d: string) => d.startsWith(String(year));

  const revenue = invoices.filter(i => inYear(i.date)).reduce((s, i) => s + i.grandTotal, 0);
  const cogs = purchases.filter(p => inYear(p.date)).reduce((s, p) => s + p.grandTotal, 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = expenses.filter(e => inYear(e.date)).reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const Row = ({ label, value, bold, indent, color }: { label: string; value: number; bold?: boolean; indent?: boolean; color?: string }) => (
    <tr className={`border-b border-black/20 ${bold ? 'bg-muted' : ''}`}>
      <td className={`px-3 py-2 font-mono text-sm ${indent ? 'pl-8' : ''} ${bold ? 'font-bold' : ''}`}>{label}</td>
      <td className={`px-3 py-2 text-right font-mono text-sm font-bold ${color ?? (value >= 0 ? 'text-success' : 'text-danger')}`}>{formatPKR(Math.abs(value))}</td>
    </tr>
  );

  return (
    <div className="p-4 max-w-xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">PROFIT & LOSS</h1>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
          {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="border-2 border-black shadow-brutal">
        <table className="w-full">
          <thead>
            <tr className="bg-black text-white"><th className="px-3 py-2 text-left font-display">Category</th><th className="px-3 py-2 text-right font-display">Amount</th></tr>
          </thead>
          <tbody>
            <tr className="bg-muted"><td colSpan={2} className="px-3 py-1 text-xs font-mono font-bold uppercase border-b border-black/20">INCOME</td></tr>
            <Row label="Sales Revenue" value={revenue} indent />
            <Row label="GROSS PROFIT" value={grossProfit} bold color={grossProfit >= 0 ? 'text-success' : 'text-danger'} />
            <tr className="bg-muted"><td colSpan={2} className="px-3 py-1 text-xs font-mono font-bold uppercase border-b border-black/20">EXPENSES</td></tr>
            <Row label="Cost of Goods Sold" value={cogs} indent color="text-danger" />
            <Row label="Operating Expenses" value={totalExpenses} indent color="text-danger" />
            <Row label="TOTAL EXPENSES" value={cogs + totalExpenses} bold color="text-danger" />
            <tr className={`${netProfit >= 0 ? 'bg-success' : 'bg-danger'} text-white`}>
              <td className="px-3 py-3 font-display text-lg">NET PROFIT</td>
              <td className="px-3 py-3 text-right font-display text-lg font-bold">{formatPKR(Math.abs(netProfit))} {netProfit < 0 ? '(LOSS)' : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
