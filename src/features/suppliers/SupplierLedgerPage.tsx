import { useParams, useNavigate } from '@tanstack/react-router';
import { useParties } from '@/stores/useParties';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useVouchers } from '@/stores/useVouchers';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function SupplierLedgerPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { parties } = useParties();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { payments, receipts } = useVouchers();
  const navigate = useNavigate();

  useKeyboardShortcuts({
    escape: () => navigate({ to: '/suppliers' }),
    'ctrl+p': () => window.print(),
  });

  const party = parties.find(p => p.id === id);
  if (!party) return <div className="p-4 font-mono">Supplier / Dyer not found</div>;

  const entries: Array<{
    id: string;
    date: string;
    serial: string;
    type: string;
    description: string;
    billAmount: number;
    paidAmount: number;
    netChange: number;
  }> = [];

  purchases.filter(v => v.supplierId === id).forEach(v => {
    entries.push({
      id: v.id,
      date: v.date,
      serial: v.serial,
      type: 'PURCHASE',
      description: `Purchase (${v.lines.length} item${v.lines.length === 1 ? '' : 's'})`,
      billAmount: v.grandTotal,
      paidAmount: v.paid,
      netChange: v.balance,
    });
  });

  dyeings.filter(v => v.dyerId === id).forEach(v => {
    const paid = v.paid ?? 0;
    const bal = v.balance ?? (v.totalValue - paid);
    entries.push({
      id: v.id,
      date: v.date,
      serial: v.serial,
      type: 'DYEING',
      description: `Dyeing (${v.qtyIn}m → ${v.qtyOut}m @ ${v.ratePerMeter}/m)`,
      billAmount: v.totalValue,
      paidAmount: paid,
      netChange: bal,
    });
  });

  payments.filter(p => p.partyId === id).forEach(p => {
    entries.push({
      id: p.id,
      date: p.date,
      serial: p.serial,
      type: 'PAYMENT',
      description: p.description || `Paid via ${p.paidFrom.toUpperCase()}`,
      billAmount: 0,
      paidAmount: p.amount,
      netChange: -p.amount,
    });
  });

  receipts.filter(r => r.partyId === id).forEach(r => {
    entries.push({
      id: r.id,
      date: r.date,
      serial: r.serial,
      type: 'RECEIPT',
      description: r.description || `Received via ${r.receivedIn.toUpperCase()}`,
      billAmount: r.amount,
      paidAmount: 0,
      netChange: r.amount,
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date) || a.serial.localeCompare(b.serial));

  let running = party.openingBalance;
  const rows = entries.map(e => {
    running += e.netChange;
    return { ...e, running };
  });

  const totalBilled = rows.reduce((sum, r) => sum + r.billAmount, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paidAmount, 0);

  return (
    <div className="p-3 sm:p-4">
      <div className="flex justify-between items-center gap-2 mb-4 print:hidden">
        <button onClick={() => navigate({ to: '/suppliers' })} className="text-xs font-mono border-2 border-black bg-white px-3 py-1.5 hover:bg-accent brutal-press">← BACK (Esc)</button>
        <button onClick={() => window.print()} className="text-xs font-mono border-2 border-black bg-accent px-3 py-1.5 font-bold shadow-brutal-sm hover:bg-black hover:text-white brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 border-2 border-black bg-white p-3 sm:p-4 shadow-brutal-sm">
        <div>
          <div className="text-xs font-mono uppercase text-gray-500">{party.type} LEDGER</div>
          <h1 className="font-display text-2xl">{party.name}</h1>
          <p className="font-mono text-xs text-gray-600">{party.phone} · {party.address} · Credit: {party.creditDays} days</p>
        </div>
        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-black/20">
          <div className="text-xs font-mono text-gray-500">CURRENT PAYABLE BALANCE</div>
          <div className={`font-display text-2xl ${party.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
            {formatPKR(party.currentBalance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 font-mono">
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Opening Balance</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(party.openingBalance)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Billed</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(totalBilled)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Paid</div>
          <div className="font-bold text-xs sm:text-sm text-success truncate">{formatPKR(totalPaid)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Payable Due</div>
          <div className={`font-bold text-xs sm:text-sm truncate ${party.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(party.currentBalance)}</div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Date', 'Serial', 'Type', 'Description', 'Bill / Credit', 'Paid / Debit', 'Running Balance'].map(h => (
              <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/20 bg-muted font-bold">
              <td className="px-3 py-2" colSpan={4}>Opening Balance</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatPKR(party.openingBalance)}</td>
              <td className="px-3 py-2 whitespace-nowrap">—</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatPKR(party.openingBalance)}</td>
            </tr>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-black/20 hover:bg-muted ${i % 2 === 0 ? '' : 'bg-muted/50'}`}>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-3 py-2 font-bold whitespace-nowrap">{r.serial}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="border border-black px-1.5 py-0.5 text-[10px] font-bold">{r.type}</span>
                </td>
                <td className="px-3 py-2 font-sans">{r.description}</td>
                <td className="px-3 py-2 whitespace-nowrap">{r.billAmount > 0 ? formatPKR(r.billAmount) : '—'}</td>
                <td className="px-3 py-2 text-success whitespace-nowrap">{r.paidAmount > 0 ? formatPKR(r.paidAmount) : '—'}</td>
                <td className={`px-3 py-2 font-bold whitespace-nowrap ${r.running > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(r.running)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
