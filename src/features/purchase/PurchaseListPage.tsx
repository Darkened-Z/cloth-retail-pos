import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePurchase } from '@/stores/usePurchase';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { PurchaseVoucher } from '@/types';

export function PurchaseListPage() {
  const { vouchers, remove } = usePurchase();
  const { parties, update: updateParty } = useParties();
  const { adjustStock } = useItems();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useKeyboardShortcuts({
    'ctrl+n': () => navigate({ to: '/purchase/new' }),
    f3: () => document.getElementById('purchase-search')?.focus(),
  });

  const filtered = vouchers.filter(v => {
    const s = parties.find(p => p.id === v.supplierId);
    return v.serial.toLowerCase().includes(search.toLowerCase()) ||
      (s?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
  });

  function handleDelete(v: PurchaseVoucher) {
    if (!confirm('Delete this purchase voucher?')) return;
    v.lines.forEach(l => {
      if (l.itemId) adjustStock(l.itemId, -l.qty);
    });
    const supplier = parties.find(p => p.id === v.supplierId);
    if (supplier) {
      updateParty({ ...supplier, currentBalance: supplier.currentBalance - v.balance });
    }
    remove(v.id);
  }

  const totalPurchase = filtered.reduce((sum, v) => sum + v.grandTotal, 0);
  const totalPaid = filtered.reduce((sum, v) => sum + v.paid, 0);
  const totalPayable = filtered.reduce((sum, v) => sum + v.balance, 0);

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">PURCHASE VOUCHERS</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input id="purchase-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search serial / supplier… (F3)"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-60 bg-white" />
          <button onClick={() => navigate({ to: '/purchase/new' })}
            className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white w-full sm:w-auto whitespace-nowrap">
            + NEW (Ctrl+N)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 font-mono">
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Vouchers</div>
          <div className="font-display text-lg sm:text-xl">{filtered.length}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Purchase</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(totalPurchase)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Paid</div>
          <div className="font-bold text-xs sm:text-sm text-success truncate">{formatPKR(totalPaid)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Payable Due</div>
          <div className="font-bold text-xs sm:text-sm text-danger truncate">{formatPKR(totalPayable)}</div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Serial','Date','Supplier','Total','Paid','Balance',''].map(h => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No purchase vouchers found.
                </td>
              </tr>
            )}
            {filtered.map((v, i) => {
              const s = parties.find(p => p.id === v.supplierId);
              return (
                <tr key={v.id} className={`border-b border-black/20 hover:bg-muted cursor-pointer ${i%2===0?'':'bg-muted/50'}`}
                  onClick={() => navigate({ to: '/purchase/$id', params: { id: v.id } })}>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">{v.serial}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(v.date)}</td>
                  <td className="px-3 py-2 font-sans">{s?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPKR(v.grandTotal)}</td>
                  <td className="px-3 py-2 text-success whitespace-nowrap">{formatPKR(v.paid)}</td>
                  <td className={`px-3 py-2 font-bold whitespace-nowrap ${v.balance>0?'text-danger':'text-success'}`}>{formatPKR(v.balance)}</td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => navigate({ to: '/purchase/$id', params: { id: v.id } })} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => handleDelete(v)} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </div>
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
