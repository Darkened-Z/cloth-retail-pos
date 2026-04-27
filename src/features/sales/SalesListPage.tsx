import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useParties } from '@/stores/useParties';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';

export function SalesListPage() {
  const { invoices, remove } = useInvoices();
  const { parties } = useParties();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = invoices.filter(inv => {
    const c = parties.find(p => p.id === inv.customerId);
    return inv.serial.toLowerCase().includes(search.toLowerCase()) ||
      (c?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">SALES INVOICES</h1>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search serial / customer…"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-64" />
          <button onClick={() => navigate({ to: '/sales/new' })}
            className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
            + NEW INVOICE (Ctrl+N)
          </button>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Serial','Date','Customer','Total','Paid','Balance','Mode',''].map(h => (
              <th key={h} className="px-3 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => {
              const c = parties.find(p => p.id === inv.customerId);
              return (
                <tr key={inv.id} className={`border-b border-black/20 hover:bg-muted cursor-pointer ${i % 2 === 0 ? '' : 'bg-muted/50'}`}
                  onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })}>
                  <td className="px-3 py-2 font-bold">{inv.serial}</td>
                  <td className="px-3 py-2">{formatDate(inv.date)}</td>
                  <td className="px-3 py-2 font-sans">{c?.name ?? '—'}</td>
                  <td className="px-3 py-2">{formatPKR(inv.grandTotal)}</td>
                  <td className="px-3 py-2 text-success">{formatPKR(inv.paid)}</td>
                  <td className={`px-3 py-2 font-bold ${inv.balance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(inv.balance)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 border text-xs ${inv.paymentMode === 'cash' ? 'border-success text-success' : inv.paymentMode === 'credit' ? 'border-danger text-danger' : 'border-black'}`}>
                      {inv.paymentMode.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">View</button>
                    <button onClick={() => { if(confirm('Delete?')) remove(inv.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
