import { useState } from 'react';
import { useParties } from '@/stores/useParties';
import { useInvoices } from '@/stores/useInvoices';
import { useVouchers } from '@/stores/useVouchers';
import { usePurchase } from '@/stores/usePurchase';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

type Tab = 'debtors' | 'receipt-report' | 'payment-report';

export function DebtorsReportPage() {
  const [tab, setTab] = useState<Tab>('debtors');
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  const { parties } = useParties();
  const { invoices } = useInvoices();
  const { receipts, payments } = useVouchers();
  const { vouchers: purchases } = usePurchase();

  const customers = parties.filter(p => p.type === 'customer');
  const suppliers = parties.filter(p => p.type === 'supplier' || p.type === 'dyer');

  // Debtors: customers with outstanding balance
  const debtorRows = customers.map(c => {
    const custInvoices = invoices.filter(inv => inv.customerId === c.id);
    const totalSales = custInvoices.reduce((s, inv) => s + inv.grandTotal, 0);
    const invoicePaid = custInvoices.reduce((s, inv) => s + (inv.paid ?? (inv.paymentMode === 'cash' ? inv.grandTotal : 0)), 0);
    const separateReceipts = receipts.filter(r => r.partyId === c.id).reduce((s, r) => s + r.amount, 0);
    const customerRefunds = payments.filter(p => p.partyId === c.id).reduce((s, p) => s + p.amount, 0);
    const totalReceipts = invoicePaid + separateReceipts;
    const balance = c.openingBalance + totalSales - totalReceipts + customerRefunds;
    return { ...c, totalSales, totalReceipts, balance };
  }).filter(c => c.balance !== 0).sort((a, b) => b.balance - a.balance);

  const totalOutstanding = debtorRows.reduce((s, r) => s + r.balance, 0);

  // Receipt report
  const filteredReceipts = receipts.filter(r => r.date >= from && r.date <= to);
  const partyMap = Object.fromEntries(parties.map(p => [p.id, p.name]));

  // Payment report
  const filteredPayments = payments.filter(p => p.date >= from && p.date <= to);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase tracking-tight">Debtors & Party Reports</h1>
        <button onClick={() => window.print()}
          className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>

      <div className="flex border-2 border-black w-full sm:w-fit bg-white shadow-brutal-sm overflow-x-auto">
        {([
          ['debtors', 'Debtors Report'],
          ['receipt-report', 'Receipt Report'],
          ['payment-report', 'Payment Report'],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 sm:flex-initial px-3 sm:px-5 py-2 text-xs font-bold uppercase border-r-2 border-black last:border-0 whitespace-nowrap ${tab === t ? 'bg-black text-white' : 'bg-white hover:bg-accent'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'debtors' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-black shadow-brutal p-4">
            <p className="text-xs font-mono font-bold uppercase text-gray-500">Total Outstanding Receivable</p>
            <p className="text-2xl sm:text-3xl font-display font-mono mt-1 text-danger whitespace-nowrap">PKR {formatNumber(totalOutstanding)}</p>
          </div>
          <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
            <table className="w-full min-w-[580px] text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Customer</th>
                  <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Phone</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Opening</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Sales</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Receipts</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Balance</th>
                </tr>
              </thead>
              <tbody>
                {debtorRows.map((c, i) => (
                  <tr key={c.id} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-2 font-bold">{c.name}</td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-xs whitespace-nowrap">{c.phone}</td>
                    <td className="px-4 py-2 text-right font-mono whitespace-nowrap">{formatNumber(c.openingBalance)}</td>
                    <td className="px-4 py-2 text-right font-mono whitespace-nowrap">{formatNumber(c.totalSales)}</td>
                    <td className="px-4 py-2 text-right font-mono text-green-700 whitespace-nowrap">{formatNumber(c.totalReceipts)}</td>
                    <td className="px-4 py-2 text-right font-mono font-black text-red-600 whitespace-nowrap">{formatNumber(c.balance)}</td>
                  </tr>
                ))}
                {debtorRows.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm font-mono">No outstanding debtors</td></tr>
                )}
              </tbody>
              {debtorRows.length > 0 && (
                <tfoot className="bg-black text-white border-t-2 border-black font-bold">
                  <tr>
                    <td colSpan={5} className="px-4 py-2.5 text-right text-sm uppercase">Total Outstanding</td>
                    <td className="px-4 py-2.5 text-right font-mono font-black whitespace-nowrap">{formatNumber(totalOutstanding)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {(tab === 'receipt-report' || tab === 'payment-report') && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-black shadow-brutal p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs font-mono font-bold uppercase mb-1">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="w-full sm:w-auto border-2 border-black px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div className="flex-1 sm:flex-initial">
              <label className="block text-xs font-mono font-bold uppercase mb-1">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="w-full sm:w-auto border-2 border-black px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          {tab === 'receipt-report' && (
            <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
              <table className="w-full min-w-[580px] text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Serial</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Date</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Customer</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Mode</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase">Description</th>
                    <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((r, i) => (
                    <tr key={r.id} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-2 font-mono text-xs font-bold whitespace-nowrap">{r.serial}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{formatDate(r.date)}</td>
                      <td className="px-4 py-2 font-bold whitespace-nowrap">{partyMap[r.partyId] ?? r.partyId}</td>
                      <td className="px-4 py-2 uppercase text-xs font-mono whitespace-nowrap">{r.receivedIn}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{r.description}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap">{formatNumber(r.amount)}</td>
                    </tr>
                  ))}
                  {filteredReceipts.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm font-mono">No receipts in this period</td></tr>
                  )}
                </tbody>
                {filteredReceipts.length > 0 && (
                  <tfoot className="bg-black text-white border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="px-4 py-2.5 text-right font-bold uppercase text-sm">Total</td>
                      <td className="px-4 py-2.5 text-right font-mono font-black whitespace-nowrap">{formatNumber(filteredReceipts.reduce((s, r) => s + r.amount, 0))}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {tab === 'payment-report' && (
            <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
              <table className="w-full min-w-[580px] text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Serial</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Date</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Party</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Mode</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase">Description</th>
                    <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, i) => (
                    <tr key={p.id} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-2 font-mono text-xs font-bold whitespace-nowrap">{p.serial}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{formatDate(p.date)}</td>
                      <td className="px-4 py-2 font-bold whitespace-nowrap">{partyMap[p.partyId] ?? p.partyId}</td>
                      <td className="px-4 py-2 uppercase text-xs font-mono whitespace-nowrap">{p.paidFrom}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{p.description}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap">{formatNumber(p.amount)}</td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm font-mono">No payments in this period</td></tr>
                  )}
                </tbody>
                {filteredPayments.length > 0 && (
                  <tfoot className="bg-black text-white border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="px-4 py-2.5 text-right font-bold uppercase text-sm">Total</td>
                      <td className="px-4 py-2.5 text-right font-mono font-black whitespace-nowrap">{formatNumber(filteredPayments.reduce((s, p) => s + p.amount, 0))}</td>
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
