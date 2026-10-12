import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDyeing } from '@/stores/useDyeing';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { DyeingVoucher } from '@/types';

export function DyeingListPage() {
  const { vouchers, remove } = useDyeing();
  const { parties, update: updateParty } = useParties();
  const { adjustStock } = useItems();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useKeyboardShortcuts({
    'ctrl+n': () => navigate({ to: '/dyeing/new' }),
    f3: () => document.getElementById('dyeing-search')?.focus(),
  });

  const filtered = vouchers.filter(v => {
    const dyer = parties.find(p => p.id === v.dyerId);
    return v.serial.toLowerCase().includes(search.toLowerCase()) ||
      (dyer?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
  });

  function handleDelete(v: DyeingVoucher) {
    if (!confirm('Delete this dyeing voucher?')) return;
    if (v.greyItemId) adjustStock(v.greyItemId, v.qtyIn);
    if (v.dyedItemId) adjustStock(v.dyedItemId, -v.qtyOut);
    const dyer = parties.find(p => p.id === v.dyerId);
    const bal = v.balance ?? v.totalValue;
    if (dyer) {
      updateParty({ ...dyer, currentBalance: dyer.currentBalance - bal });
    }
    remove(v.id);
  }

  const totalMetersIn = filtered.reduce((sum, v) => sum + v.qtyIn, 0);
  const totalMetersOut = filtered.reduce((sum, v) => sum + v.qtyOut, 0);
  const totalCost = filtered.reduce((sum, v) => sum + v.totalValue, 0);
  const totalPayable = filtered.reduce((sum, v) => sum + (v.balance ?? v.totalValue), 0);

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">DYEING VOUCHERS</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input id="dyeing-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search serial / dyer… (F3)"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-60 bg-white" />
          <button onClick={() => navigate({ to: '/dyeing/new' })}
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
          <div className="text-[10px] uppercase text-gray-500">Meters (In → Out)</div>
          <div className="font-bold text-xs sm:text-sm truncate">{totalMetersIn}m → {totalMetersOut}m</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Total Cost</div>
          <div className="font-bold text-xs sm:text-sm truncate">{formatPKR(totalCost)}</div>
        </div>
        <div className="border-2 border-black bg-white p-2.5 sm:p-3 shadow-brutal-sm">
          <div className="text-[10px] uppercase text-gray-500">Dyer Payable</div>
          <div className="font-bold text-xs sm:text-sm text-danger truncate">{formatPKR(totalPayable)}</div>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[680px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Serial','Date','Dyer','Total Meters','Total Cost','Paid','Balance',''].map(h => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No dyeing vouchers found.
                </td>
              </tr>
            )}
            {filtered.map((v, i) => {
              const dyer = parties.find(p => p.id === v.dyerId);
              const totalMeters = v.qtyIn;
              const cost = v.totalValue;
              const paid = v.paid ?? 0;
              const bal = v.balance ?? v.totalValue;
              return (
                <tr key={v.id} className={`border-b border-black/20 hover:bg-muted cursor-pointer ${i%2===0?'':'bg-muted/50'}`}
                  onClick={() => navigate({ to: '/dyeing/$id', params: { id: v.id } })}>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">{v.serial}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(v.date)}</td>
                  <td className="px-3 py-2 font-sans">{dyer?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totalMeters}m → {v.qtyOut}m</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPKR(cost)}</td>
                  <td className="px-3 py-2 text-success whitespace-nowrap">{formatPKR(paid)}</td>
                  <td className={`px-3 py-2 font-bold whitespace-nowrap ${bal > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(bal)}</td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button onClick={() => navigate({ to: '/dyeing/$id', params: { id: v.id } })} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
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
