import { useParams, useNavigate } from '@tanstack/react-router';
import { useParties } from '@/stores/useParties';
import { useInvoices } from '@/stores/useInvoices';
import { useVouchers } from '@/stores/useVouchers';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function CustomerLedgerPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { parties } = useParties();
  const { invoices } = useInvoices();
  const { receipts, payments } = useVouchers();
  const navigate = useNavigate();

  useKeyboardShortcuts({
    escape: () => navigate({ to: '/customers' }),
    'ctrl+p': () => window.print(),
  });

  const customer = parties.find(p => p.id === id);
  if (!customer) return <div className="p-4 font-mono">Customer not found</div>;

  const entries: Array<{
    id: string;
    date: string;
    serial: string;
    type: string;
    description: string;
    total: number;
    paid: number;
    netChange: number;
  }> = [];

  invoices.filter(inv => inv.customerId === id).forEach(inv => {
    entries.push({
      id: inv.id,
      date: inv.date,
      serial: inv.serial,
      type: 'SALE',
      description: `Sales Invoice (${inv.lines.length} item${inv.lines.length === 1 ? '' : 's'})`,
      total: inv.grandTotal,
      paid: inv.paid,
      netChange: inv.balance,
    });
  });

  receipts.filter(r => r.partyId === id).forEach(r => {
    entries.push({
      id: r.id,
      date: r.date,
      serial: r.serial,
      type: 'RECEIPT',
      description: r.description || `Received via ${r.receivedIn.toUpperCase()}`,
      total: 0,
      paid: r.amount,
      netChange: -r.amount,
    });
  });

  payments.filter(p => p.partyId === id).forEach(p => {
    entries.push({
      id: p.id,
      date: p.date,
      serial: p.serial,
      type: 'PAYMENT',
      description: p.description || `Paid via ${p.paidFrom.toUpperCase()}`,
      total: p.amount,
      paid: 0,
      netChange: p.amount,
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date) || a.serial.localeCompare(b.serial));

  let running = customer.openingBalance;
  const rows = entries.map(e => {
    running += e.netChange;
    return { ...e, running };
  });

  const totalBilled = rows.reduce((sum, r) => sum + r.total, 0);
  const totalReceived = rows.reduce((sum, r) => sum + r.paid, 0);

  return (
    <div className="p-3 sm:p-4">
      <div className="flex justify-between items-center gap-2 mb-4 print:hidden">
        <button onClick={() => navigate({ to: '/customers' })} className="text-xs font-mono border-2 border-black bg-white px-3 py-1.5 hover:bg-accent brutal-press">← BACK (Esc)</button>
        <button onClick={() => window.print()} className="text-xs font-mono border-2 border-black bg-accent px-3 py-1.5 font-bold shadow-brutal-sm hover:bg-black hover:text-white brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 border-2 border-black bg-white p-3 sm:p-4 shadow-brutal-sm">
        <div>
          <div className="text-xs font-mono uppercase text-gray-500">CUSTOMER LEDGER</div>
          <h1 className="font-display text-2xl">{customer.name}</h1>
          <p className="font-mono text-xs text-gray-600">{customer.phone} · {customer.address} · Credit: {customer.creditDays} days</p>
        </div>
        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-black/20">
          <div className="text-xs font-mono text-gray-500">CURRENT BALANCE</div>
          <div className={`font-display text-2xl ${customer.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
            {formatPKR(customer.currentBalance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 font-mono">
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Opening Balance</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(customer.openingBalance)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Billed</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(totalBilled)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Received</div>
          <div className="font-bold text-xs sm:text-sm text-success truncate">{formatPKR(totalReceived)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Closing Balance</div>
          <div className={`font-bold text-xs sm:text-sm truncate ${customer.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(customer.currentBalance)}</div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Date','Serial','Type','Description','Debit / Bill','Credit / Paid','Running Balance'].map(h => (
              <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/20 bg-muted font-bold">
              <td className="px-3 py-2" colSpan={4}>Opening Balance</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatPKR(customer.openingBalance)}</td>
              <td className="px-3 py-2 whitespace-nowrap">—</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatPKR(customer.openingBalance)}</td>
            </tr>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-black/20 hover:bg-muted ${i % 2 === 0 ? '' : 'bg-muted/50'}`}>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-3 py-2 font-bold whitespace-nowrap">{r.serial}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="border border-black px-1.5 py-0.5 text-[10px] font-bold">{r.type}</span>
                </td>
                <td className="px-3 py-2 font-sans">{r.description}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.total > 0 ? formatPKR(r.total) : '—'}</td>
                <td className="px-3 py-2 text-success whitespace-nowrap">{r.paid > 0 ? formatPKR(r.paid) : '—'}</td>
                <td className={`px-3 py-2 font-bold whitespace-nowrap ${r.running > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(r.running)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
