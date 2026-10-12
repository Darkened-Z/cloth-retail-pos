import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useShop } from '@/stores/useShop';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import type { SalesInvoice } from '@/types';

export function SalesListPage() {
  const { invoices, remove } = useInvoices();
  const { parties, update: updateParty } = useParties();
  const { items, adjustStock } = useItems();
  const { shop } = useShop();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [previewInv, setPreviewInv] = useState<SalesInvoice | null>(null);

  useKeyboardShortcuts({
    'ctrl+n': () => navigate({ to: '/sales/new' }),
    f3: () => document.getElementById('sales-search')?.focus(),
    escape: () => setPreviewInv(null),
  });

  const filtered = invoices.filter(inv => {
    const c = parties.find(p => p.id === inv.customerId);
    return inv.serial.toLowerCase().includes(search.toLowerCase()) ||
      (c?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
  });

  function handleDelete(inv: SalesInvoice) {
    if (!confirm('Delete this invoice?')) return;
    inv.lines.forEach(l => {
      if (l.itemId) adjustStock(l.itemId, l.qty);
    });
    const c = parties.find(p => p.id === inv.customerId);
    if (c) {
      updateParty({ ...c, currentBalance: c.currentBalance - inv.balance });
    }
    remove(inv.id);
  }

  const totalSales = filtered.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalReceived = filtered.reduce((sum, inv) => sum + inv.paid, 0);
  const totalDue = filtered.reduce((sum, inv) => sum + inv.balance, 0);

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">SALES INVOICES</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input id="sales-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search serial / customer… (F3)"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-64 bg-white" />
          <button onClick={() => navigate({ to: '/sales/new' })}
            className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white w-full sm:w-auto whitespace-nowrap">
            + NEW INVOICE (Ctrl+N)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 font-mono">
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Invoices</div>
          <div className="font-display text-lg sm:text-xl">{filtered.length}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Sales</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(totalSales)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Received</div>
          <div className="font-bold text-xs sm:text-sm text-success truncate">{formatPKR(totalReceived)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Receivable Due</div>
          <div className="font-bold text-xs sm:text-sm text-danger truncate">{formatPKR(totalDue)}</div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[680px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Serial','Date','Customer','Total','Paid','Balance','Mode',''].map(h => (
              <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No sales invoices found.
                </td>
              </tr>
            )}
            {filtered.map((inv, i) => {
              const c = parties.find(p => p.id === inv.customerId);
              return (
                <tr key={inv.id} className={`border-b border-black/20 hover:bg-muted cursor-pointer ${i % 2 === 0 ? '' : 'bg-muted/50'}`}
                  onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })}>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">{inv.serial}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(inv.date)}</td>
                  <td className="px-3 py-2 font-sans">{c?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPKR(inv.grandTotal)}</td>
                  <td className="px-3 py-2 text-success whitespace-nowrap">{formatPKR(inv.paid)}</td>
                  <td className={`px-3 py-2 font-bold whitespace-nowrap ${inv.balance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(inv.balance)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-1.5 border text-xs ${inv.paymentMode === 'cash' ? 'border-success text-success' : inv.paymentMode === 'credit' ? 'border-danger text-danger' : 'border-black'}`}>
                      {inv.paymentMode.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => setPreviewInv(inv)} className="border border-black bg-accent px-2 py-0.5 hover:bg-black hover:text-white text-xs font-bold">Print / PDF</button>
                      <button onClick={() => navigate({ to: '/sales/$id', params: { id: inv.id } })} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">View</button>
                      <button onClick={() => handleDelete(inv)} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewInv && (
        <InvoicePreview
          invoice={previewInv}
          shop={shop}
          customer={parties.find(p => p.id === previewInv.customerId)}
          items={items}
          onClose={() => setPreviewInv(null)}
        />
      )}
    </div>
  );
}
