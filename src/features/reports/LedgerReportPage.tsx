import { useState } from 'react';
import { useParties } from '@/stores/useParties';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useVouchers } from '@/stores/useVouchers';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

type PartyFilter = 'all' | 'customer' | 'supplier' | 'dyer';

interface LedgerRow {
  id: string;
  date: string;
  type: string;
  serial: string;
  grandTotal: number;
  paid: number;
  balance: number;
  running: number;
}

export function LedgerReportPage() {
  const { parties } = useParties();
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { receipts, payments } = useVouchers();
  const [typeFilter, setTypeFilter] = useState<PartyFilter>('all');
  const [partyId, setPartyId] = useState('');
  const [search, setSearch] = useState('');

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  const filteredParties = parties.filter(p =>
    (typeFilter === 'all' || p.type === typeFilter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const party = parties.find(p => p.id === partyId);

  const rawRows: Omit<LedgerRow, 'running'>[] = [];
  if (party) {
    if (party.type === 'customer') {
      invoices.filter(i => i.customerId === party.id).forEach(inv => {
        rawRows.push({
          id: inv.id,
          date: inv.date,
          type: 'SALE',
          serial: inv.serial,
          grandTotal: inv.grandTotal,
          paid: inv.paid,
          balance: inv.balance,
        });
      });
    } else if (party.type === 'supplier') {
      purchases.filter(v => v.supplierId === party.id).forEach(pv => {
        rawRows.push({
          id: pv.id,
          date: pv.date,
          type: 'PURCHASE',
          serial: pv.serial,
          grandTotal: pv.grandTotal,
          paid: pv.paid,
          balance: pv.balance,
        });
      });
    } else if (party.type === 'dyer') {
      dyeings.filter(d => d.dyerId === party.id).forEach(dv => {
        const paid = dv.paid ?? 0;
        const bal = dv.balance ?? (dv.totalValue - paid);
        rawRows.push({
          id: dv.id,
          date: dv.date,
          type: 'DYEING',
          serial: dv.serial,
          grandTotal: dv.totalValue,
          paid,
          balance: bal,
        });
      });
    }

    receipts.filter(r => r.partyId === party.id).forEach(rv => {
      const net = party.type === 'customer' ? -rv.amount : rv.amount;
      rawRows.push({
        id: rv.id,
        date: rv.date,
        type: 'RECEIPT',
        serial: rv.serial,
        grandTotal: 0,
        paid: rv.amount,
        balance: net,
      });
    });

    payments.filter(p => p.partyId === party.id).forEach(pv => {
      const net = party.type === 'customer' ? pv.amount : -pv.amount;
      rawRows.push({
        id: pv.id,
        date: pv.date,
        type: 'PAYMENT',
        serial: pv.serial,
        grandTotal: 0,
        paid: pv.amount,
        balance: net,
      });
    });
  }

  rawRows.sort((a, b) => a.date.localeCompare(b.date));

  let running = party?.openingBalance ?? 0;
  const rows: LedgerRow[] = rawRows.map(r => {
    running += r.balance;
    return { ...r, running };
  });

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl">PARTY LEDGER</h1>
        <button onClick={() => window.print()}
          className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-white border-2 border-black shadow-brutal p-3 sm:p-4">
          <label className="block text-xs font-mono font-bold uppercase mb-1">Party Type</label>
          <div className="flex border-2 border-black mb-3 bg-white overflow-x-auto">
            {([
              ['all', 'All'],
              ['customer', 'Customers'],
              ['supplier', 'Suppliers'],
              ['dyer', 'Dyers'],
            ] as [PartyFilter, string][]).map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`flex-1 px-2 py-1.5 text-[10px] font-mono uppercase border-r-2 border-black last:border-0 whitespace-nowrap ${typeFilter === val ? 'bg-black text-white' : 'bg-white hover:bg-accent'}`}>
                {label}
              </button>
            ))}
          </div>
          <label className="block text-xs font-mono font-bold uppercase mb-1">Search Party</label>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Type name…"
            className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <div className="border-2 border-t-0 border-black max-h-48 overflow-y-auto bg-white">
            {filteredParties.slice(0, 20).map(c => (
              <button key={c.id} onClick={() => setPartyId(c.id)}
                className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-black/20 hover:bg-accent flex justify-between items-center gap-2 ${partyId===c.id?'bg-black text-white':''}`}>
                <span className="truncate">{c.name}</span>
                <span className="text-[10px] uppercase opacity-70 whitespace-nowrap">{c.type}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          {party ? (
            <div className="bg-white border-2 border-black shadow-brutal p-4">
              <div className="flex flex-wrap justify-between items-start gap-2 pb-2 border-b-2 border-black">
                <div className="font-display text-lg">{party.name}</div>
                <span className="border-2 border-black bg-accent px-2 py-0.5 text-xs font-mono font-bold uppercase">{party.type}</span>
              </div>
              <div className="text-xs font-mono text-gray-500 mt-2">{party.phone} · {party.address}</div>
              <div className="text-xs font-mono mt-2">Current Balance: <span className={`font-bold ${party.currentBalance>0?'text-danger':'text-success'}`}>{formatPKR(party.currentBalance)}</span></div>
            </div>
          ) : (
            <div className="bg-white border-2 border-black shadow-brutal p-6 text-center text-xs font-mono text-gray-400">
              Select a party from the list to view their ledger statement.
            </div>
          )}
        </div>
      </div>

      {party && (
        <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
          <table className="w-full min-w-[640px] text-xs font-mono">
            <thead className="bg-black text-white">
              <tr>
                {['Date','Type','Serial','Total','Paid','Balance','Running'].map(h => (
                  <th key={h} className={`px-3 py-2.5 whitespace-nowrap ${['Total','Paid','Balance','Running'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black/20 bg-muted font-bold">
                <td colSpan={5} className="px-3 py-2">Opening Balance</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatPKR(party.openingBalance)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatPKR(party.openingBalance)}</td>
              </tr>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'bg-white':'bg-muted/50'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap"><span className="border border-black px-1.5 py-0.5 text-[10px]">{r.type}</span></td>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">{r.serial}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{r.grandTotal > 0 ? formatPKR(r.grandTotal) : '—'}</td>
                  <td className="px-3 py-2 text-right text-success whitespace-nowrap">{r.paid > 0 ? formatPKR(r.paid) : '—'}</td>
                  <td className={`px-3 py-2 text-right whitespace-nowrap ${r.balance>0?'text-danger':'text-success'}`}>{formatPKR(Math.abs(r.balance))}</td>
                  <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${r.running>0?'text-danger':'text-success'}`}>{formatPKR(r.running)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
