import { useState } from 'react';
import { useParties } from '@/stores/useParties';
import { useInvoices } from '@/stores/useInvoices';
import { useVouchers } from '@/stores/useVouchers';
import { usePurchase } from '@/stores/usePurchase';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';

type Tab = 'debtors' | 'receipt-report' | 'payment-report';

export function DebtorsReportPage() {
  const [tab, setTab] = useState<Tab>('debtors');
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  const { parties } = useParties();
  const { invoices } = useInvoices();
  const { receipts, payments } = useVouchers();
  const { vouchers: purchases } = usePurchase();

  const customers = parties.filter(p => p.type === 'customer');
  const suppliers = parties.filter(p => p.type === 'supplier' || p.type === 'dyer');

  // Debtors: customers with outstanding balance
  const debtorRows = customers.map(c => {
    const totalSales = invoices.filter(inv => inv.customerId === c.id).reduce((s, inv) => s + inv.grandTotal, 0);
    const totalReceipts = receipts.filter(r => r.partyId === c.id).reduce((s, r) => s + r.amount, 0);
    const balance = c.openingBalance + totalSales - totalReceipts;
    return { ...c, totalSales, totalReceipts, balance };
  }).filter(c => c.balance !== 0).sort((a, b) => b.balance - a.balance);

  const totalOutstanding = debtorRows.reduce((s, r) => s + r.balance, 0);

  // Receipt report
  const filteredReceipts = receipts.filter(r => r.date >= from && r.date <= to);
  const partyMap = Object.fromEntries(parties.map(p => [p.id, p.name]));

  // Payment report
  const filteredPayments = payments.filter(p => p.date >= from && p.date <= to);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-black uppercase tracking-tight">Debtors & Party Reports</h1>

      <div className="flex border-2 border-black w-fit">
        {([
          ['debtors', 'Debtors Report'],
          ['receipt-report', 'Receipt Report'],
          ['payment-report', 'Payment Report'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-xs font-bold uppercase border-r-2 border-black last:border-0 ${tab === t ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'debtors' && (
        <div className="space-y-3">
          <div className="border-2 border-black p-3 bg-accent/20">
            <p className="text-xs font-bold uppercase">Total Outstanding Receivable</p>
            <p className="text-3xl font-black font-mono">{formatNumber(totalOutstanding)}</p>
          </div>
          <div className="border-2 border-black">
            <table className="w-full text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left px-4 py-2 font-bold uppercase">Customer</th>
                  <th className="text-left px-4 py-2 font-bold uppercase">Phone</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Opening</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Sales</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Receipts</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Balance</th>
                </tr>
              </thead>
              <tbody>
                {debtorRows.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-bold">{c.name}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{c.phone}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatNumber(c.openingBalance)}</td>
                    <td className="px-4 py-2 text-right font-mono">{formatNumber(c.totalSales)}</td>
                    <td className="px-4 py-2 text-right font-mono text-green-700">{formatNumber(c.totalReceipts)}</td>
                    <td className="px-4 py-2 text-right font-mono font-black text-red-600">{formatNumber(c.balance)}</td>
                  </tr>
                ))}
                {debtorRows.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No outstanding debtors</td></tr>
                )}
              </tbody>
              {debtorRows.length > 0 && (
                <tfoot className="bg-gray-100 border-t-2 border-black font-bold">
                  <tr>
                    <td colSpan={5} className="px-4 py-2 text-right text-sm uppercase">Total Outstanding</td>
                    <td className="px-4 py-2 text-right font-mono font-black text-red-600">{formatNumber(totalOutstanding)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {(tab === 'receipt-report' || tab === 'payment-report') && (
        <div className="space-y-3">
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

          {tab === 'receipt-report' && (
            <div className="border-2 border-black">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-4 py-2 font-bold uppercase">Serial</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Date</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Customer</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Mode</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Description</th>
                    <th className="text-right px-4 py-2 font-bold uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-mono text-xs">{r.serial}</td>
                      <td className="px-4 py-2">{formatDate(r.date)}</td>
                      <td className="px-4 py-2 font-bold">{partyMap[r.partyId] ?? r.partyId}</td>
                      <td className="px-4 py-2 uppercase text-xs">{r.receivedIn}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{r.description}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold">{formatNumber(r.amount)}</td>
                    </tr>
                  ))}
                  {filteredReceipts.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No receipts in this period</td></tr>
                  )}
                </tbody>
                {filteredReceipts.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-right font-bold uppercase text-sm">Total</td>
                      <td className="px-4 py-2 text-right font-mono font-black">{formatNumber(filteredReceipts.reduce((s, r) => s + r.amount, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {tab === 'payment-report' && (
            <div className="border-2 border-black">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-4 py-2 font-bold uppercase">Serial</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Date</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Party</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Mode</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Description</th>
                    <th className="text-right px-4 py-2 font-bold uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-mono text-xs">{p.serial}</td>
                      <td className="px-4 py-2">{formatDate(p.date)}</td>
                      <td className="px-4 py-2 font-bold">{partyMap[p.partyId] ?? p.partyId}</td>
                      <td className="px-4 py-2 uppercase text-xs">{p.paidFrom}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{p.description}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold">{formatNumber(p.amount)}</td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No payments in this period</td></tr>
                  )}
                </tbody>
                {filteredPayments.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-right font-bold uppercase text-sm">Total</td>
                      <td className="px-4 py-2 text-right font-mono font-black">{formatNumber(filteredPayments.reduce((s, p) => s + p.amount, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
