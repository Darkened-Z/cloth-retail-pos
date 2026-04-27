import { useParams, useNavigate } from '@tanstack/react-router';
import { useParties } from '@/stores/useParties';
import { useInvoices } from '@/stores/useInvoices';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';

export function CustomerLedgerPage() {
  const { id } = useParams({ from: '/customers/$id' });
  const { parties } = useParties();
  const { invoices } = useInvoices();
  const navigate = useNavigate();

  const customer = parties.find(p => p.id === id);
  const ledger = invoices.filter(inv => inv.customerId === id).sort((a, b) => a.date.localeCompare(b.date));

  if (!customer) return <div className="p-4 font-mono">Customer not found</div>;

  let running = customer.openingBalance;
  const rows = ledger.map(inv => {
    running += inv.balance;
    return { ...inv, running };
  });

  return (
    <div className="p-4">
      <button onClick={() => navigate({ to: '/customers' })} className="text-xs font-mono border-2 border-black px-3 py-1 mb-4 hover:bg-accent brutal-press">← BACK</button>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="font-display text-2xl">{customer.name}</h1>
          <p className="font-mono text-xs text-gray-600">{customer.phone} · {customer.address}</p>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-gray-500">CURRENT BALANCE</div>
          <div className={`font-display text-2xl ${customer.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>
            {formatPKR(customer.currentBalance)}
          </div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Date','Serial','Total','Paid','Balance','Running Balance'].map(h => (
              <th key={h} className="px-3 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/20 bg-muted">
              <td className="px-3 py-2" colSpan={4}>Opening Balance</td>
              <td className="px-3 py-2">{formatPKR(customer.openingBalance)}</td>
              <td className="px-3 py-2">{formatPKR(customer.openingBalance)}</td>
            </tr>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-black/20 hover:bg-muted ${i % 2 === 0 ? '' : 'bg-muted/50'}`}>
                <td className="px-3 py-2">{formatDate(r.date)}</td>
                <td className="px-3 py-2">{r.serial}</td>
                <td className="px-3 py-2">{formatPKR(r.grandTotal)}</td>
                <td className="px-3 py-2 text-success">{formatPKR(r.paid)}</td>
                <td className={`px-3 py-2 ${r.balance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(r.balance)}</td>
                <td className={`px-3 py-2 font-bold ${r.running > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(r.running)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
