import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDyeing } from '@/stores/useDyeing';
import { useParties } from '@/stores/useParties';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';

export function DyeingListPage() {
  const { vouchers, remove } = useDyeing();
  const { parties } = useParties();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filtered = vouchers.filter(v => v.serial.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">DYEING VOUCHERS</h1>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search serial…"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-48" />
          <button onClick={() => navigate({ to: '/dyeing/new' })}
            className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
            + NEW
          </button>
        </div>
      </div>
      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Serial','Date','Dyer','Total Meters','Total Cost','Paid','Balance',''].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => {
              const dyer = parties.find(p => p.id === v.dyerId);
              const totalMeters = v.qtyIn;
              const cost = v.totalValue;
              return (
                <tr key={v.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-bold">{v.serial}</td>
                  <td className="px-3 py-2">{formatDate(v.date)}</td>
                  <td className="px-3 py-2 font-sans">{dyer?.name ?? '—'}</td>
                  <td className="px-3 py-2">{totalMeters}m</td>
                  <td className="px-3 py-2">{formatPKR(cost)}</td>
                  <td className="px-3 py-2 text-success">—</td>
                  <td className="px-3 py-2 font-bold text-danger">{formatPKR(cost)}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => { if(confirm('Delete?')) remove(v.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
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
