import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDyeing } from '@/stores/useDyeing';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
export function NewDyeingPage() {
  const { add } = useDyeing();
  const { parties } = useParties();
  const { items } = useItems();
  const navigate = useNavigate();

  const [date, setDate] = useState(todayISO());
  const [dyerId, setDyerId] = useState('');
  const [dyerSearch, setDyerSearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [greyItemId, setGreyItemId] = useState('');
  const [dyedItemId, setDyedItemId] = useState('');
  const [qtyIn, setQtyIn] = useState(0);
  const [ratePerMeter, setRatePerMeter] = useState(0);
  const [remarks, setRemarks] = useState('');

  const dyers = parties.filter(p => p.type === 'dyer' && p.name.toLowerCase().includes(dyerSearch.toLowerCase()));
  const greyItems = items.filter(it => it.name.toUpperCase().includes('GREY'));
  const dyedItems = items.filter(it => it.name.toUpperCase().includes('DYE'));
  const qtyOut = qtyIn;
  const totalValue = qtyOut * ratePerMeter;

  function save() {
    if (!dyerId || !greyItemId || qtyIn === 0) return;
    const v = {
      id: `DV-${Date.now()}`, serial: `DV-${String(Date.now()).slice(-4)}`, date, dyerId,
      greyItemId, dyedItemId, qtyIn, qtyOut, ratePerMeter, totalValue, remarks,
    };
    add(v as any);
    navigate({ to: '/dyeing' });
  }
  useKeyboardShortcuts({ f9: () => save(), escape: () => navigate({ to: '/dyeing' }) });

  return (
    <div className="p-4 max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">NEW DYEING VOUCHER</h1>
        <button onClick={() => navigate({ to: '/dyeing' })} className="text-xs font-mono border-2 border-black px-3 py-1 hover:bg-accent brutal-press">← BACK</button>
      </div>
      <div className="border-2 border-black shadow-brutal p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Dyer</label>
            <div className="relative">
              <input value={dyerSearch} onChange={e => { setDyerSearch(e.target.value); setShowDrop(true); }} onFocus={() => setShowDrop(true)}
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              {showDrop && dyerSearch && (
                <div className="absolute top-full left-0 right-0 border-2 border-black bg-white z-50 shadow-brutal max-h-40 overflow-y-auto">
                  {dyers.map(d => (
                    <button key={d.id} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-accent border-b border-black/20"
                      onClick={() => { setDyerId(d.id); setDyerSearch(d.name); setShowDrop(false); }}>{d.name}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Grey Item (In)</label>
            <select value={greyItemId} onChange={e => setGreyItemId(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">— select —</option>
              {greyItems.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Dyed Item (Out)</label>
            <select value={dyedItemId} onChange={e => setDyedItemId(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">— select —</option>
              {dyedItems.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Qty (meters)</label>
            <input type="number" value={qtyIn} onChange={e => setQtyIn(Number(e.target.value))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Rate / Meter</label>
            <input type="number" value={ratePerMeter} onChange={e => setRatePerMeter(Number(e.target.value))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Remarks</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent h-16 resize-none" />
        </div>
        <div className="flex justify-between items-center bg-black text-white px-4 py-3 font-display text-xl">
          <span>TOTAL</span>
          <span>{formatPKR(totalValue)}</span>
        </div>
        <button onClick={save} className="w-full border-2 border-black bg-accent py-2.5 font-bold hover:bg-black hover:text-white brutal-press shadow-brutal">SAVE — F9</button>
      </div>
    </div>
  );
}
