import { useState } from 'react';
import { useParties } from '@/stores/useParties';
import { useInvoices } from '@/stores/useInvoices';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';

export function LedgerReportPage() {
  const { parties } = useParties();
  const { invoices } = useInvoices();
  const [partyId, setPartyId] = useState('');
  const [search, setSearch] = useState('');

  const customers = parties.filter(p => p.type === 'customer' && p.name.toLowerCase().includes(search.toLowerCase()));
  const party = parties.find(p => p.id === partyId);
  const partyInvoices = invoices.filter(i => i.customerId === partyId).sort((a, b) => a.date.localeCompare(b.date));

  let running = party?.openingBalance ?? 0;
  const rows = partyInvoices.map(inv => {
    running += inv.balance;
    return { ...inv, running };
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">PARTY LEDGER</h1>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-1">
          <label className="block text-xs font-mono uppercase mb-1">Search Party</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type name…"
            className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <div className="border-2 border-t-0 border-black max-h-48 overflow-y-auto">
            {customers.slice(0, 15).map(c => (
              <button key={c.id} onClick={() => setPartyId(c.id)}
                className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-black/20 hover:bg-accent ${partyId===c.id?'bg-black text-white':''}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          {party && (
            <div className="border-2 border-black shadow-brutal p-3 mb-3">
              <div className="font-display text-lg">{party.name}</div>
              <div className="text-xs font-mono text-gray-500">{party.phone} · {party.address}</div>
              <div className="text-xs font-mono mt-1">Current Balance: <span className={`font-bold ${party.currentBalance>0?'text-danger':'text-success'}`}>{formatPKR(party.currentBalance)}</span></div>
            </div>
          )}
        </div>
      </div>

      {party && (
        <div className="border-2 border-black shadow-brutal overflow-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white">
              <tr>{['Date','Serial','Total','Paid','Balance','Running'].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/20 bg-muted">
                <td colSpan={4} className="px-3 py-2">Opening Balance</td>
                <td className="px-3 py-2">{formatPKR(party.openingBalance)}</td>
                <td className="px-3 py-2">{formatPKR(party.openingBalance)}</td>
              </tr>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2">{formatDate(r.date)}</td>
                  <td className="px-3 py-2 font-bold">{r.serial}</td>
                  <td className="px-3 py-2">{formatPKR(r.grandTotal)}</td>
                  <td className="px-3 py-2 text-success">{formatPKR(r.paid)}</td>
                  <td className={`px-3 py-2 ${r.balance>0?'text-danger':'text-success'}`}>{formatPKR(r.balance)}</td>
                  <td className={`px-3 py-2 font-bold ${r.running>0?'text-danger':'text-success'}`}>{formatPKR(r.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
