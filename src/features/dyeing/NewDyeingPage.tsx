import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useDyeing } from '@/stores/useDyeing';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { DyeingVoucher } from '@/types';

export function NewDyeingPage() {
  const params = useParams({ strict: false }) as { id?: string };
  const { vouchers, add, update } = useDyeing();
  const { parties, update: updateParty } = useParties();
  const { items, adjustStock } = useItems();
  const navigate = useNavigate();

  const existing = params.id ? vouchers.find(v => v.id === params.id) : undefined;

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [dyerId, setDyerId] = useState(existing?.dyerId ?? '');
  const [dyerSearch, setDyerSearch] = useState(parties.find(p => p.id === existing?.dyerId)?.name ?? '');
  const [showDrop, setShowDrop] = useState(false);
  const [greyItemId, setGreyItemId] = useState(existing?.greyItemId ?? '');
  const [dyedItemId, setDyedItemId] = useState(existing?.dyedItemId ?? '');
  const [qtyIn, setQtyIn] = useState(existing?.qtyIn ?? 0);
  const [qtyOut, setQtyOut] = useState(existing?.qtyOut ?? existing?.qtyIn ?? 0);
  const [qtyOutEdited, setQtyOutEdited] = useState(Boolean(existing && existing.qtyOut !== existing.qtyIn));
  const [ratePerMeter, setRatePerMeter] = useState(existing?.ratePerMeter ?? 0);
  const [paymentMode, setPaymentMode] = useState<'credit' | 'cash' | 'partial'>(existing?.paymentMode ?? 'credit');
  const [paidInput, setPaidInput] = useState(existing?.paid ?? 0);
  const [remarks, setRemarks] = useState(existing?.remarks ?? '');

  const dyers = parties.filter(p => p.type === 'dyer' && p.name.toLowerCase().includes(dyerSearch.toLowerCase()));
  const dyer = parties.find(p => p.id === dyerId);
  const greyItems = items.filter(it => it.subId.startsWith('IS1') || it.name.toUpperCase().includes('GREY'));
  const dyedItems = items.filter(it => it.subId.startsWith('IS2') || it.name.toUpperCase().includes('DYE'));

  const totalValue = qtyOut * ratePerMeter;
  const paid = paymentMode === 'cash' ? totalValue : paymentMode === 'credit' ? 0 : paidInput;
  const balance = totalValue - paid;

  function handleQtyInChange(val: number) {
    setQtyIn(val);
    if (!qtyOutEdited) {
      setQtyOut(val);
    }
  }

  function save() {
    if (!dyerId || !greyItemId || qtyIn === 0) return;
    const v: DyeingVoucher = {
      id: existing?.id ?? `DV-${Date.now()}`,
      serial: existing?.serial ?? `DV-${String(Date.now()).slice(-4)}`,
      date,
      dyerId,
      greyItemId,
      dyedItemId,
      qtyIn,
      qtyOut,
      ratePerMeter,
      totalValue,
      paid,
      balance,
      paymentMode,
      remarks,
    };

    if (existing) {
      if (existing.greyItemId) adjustStock(existing.greyItemId, existing.qtyIn);
      if (existing.dyedItemId) adjustStock(existing.dyedItemId, -existing.qtyOut);

      adjustStock(greyItemId, -qtyIn);
      if (dyedItemId) adjustStock(dyedItemId, qtyOut);

      const prevBal = existing.balance ?? existing.totalValue;
      if (existing.dyerId === dyerId) {
        if (dyer) {
          updateParty({ ...dyer, currentBalance: dyer.currentBalance + (balance - prevBal) });
        }
      } else {
        const oldDyer = parties.find(p => p.id === existing.dyerId);
        if (oldDyer) {
          updateParty({ ...oldDyer, currentBalance: oldDyer.currentBalance - prevBal });
        }
        if (dyer) {
          updateParty({ ...dyer, currentBalance: dyer.currentBalance + balance });
        }
      }
      update(v);
    } else {
      add(v);
      adjustStock(greyItemId, -qtyIn);
      if (dyedItemId) adjustStock(dyedItemId, qtyOut);
      if (dyer) {
        updateParty({ ...dyer, currentBalance: dyer.currentBalance + balance });
      }
    }
    navigate({ to: '/dyeing' });
  }

  useKeyboardShortcuts({ f9: () => save(), escape: () => navigate({ to: '/dyeing' }) });

  return (
    <div className="p-3 sm:p-4 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">{existing ? 'EDIT' : 'NEW'} DYEING VOUCHER</h1>
        <button onClick={() => navigate({ to: '/dyeing' })} className="w-full sm:w-auto text-center text-xs font-mono border-2 border-black bg-white px-3 py-1.5 hover:bg-accent brutal-press">← BACK</button>
      </div>
      <div className="border-2 border-black shadow-brutal p-3 sm:p-4 bg-white space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-mono uppercase mb-1">Dyer</label>
            <div className="relative">
              <input value={dyerSearch} onChange={e => { setDyerSearch(e.target.value); setShowDrop(true); }} onFocus={() => setShowDrop(true)}
                placeholder="Search dyer…"
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
              {showDrop && dyerSearch && (
                <div className="absolute top-full left-0 right-0 border-2 border-black bg-white z-50 shadow-brutal max-h-40 overflow-y-auto">
                  {dyers.map(d => (
                    <button key={d.id} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-accent border-b border-black/20"
                      onClick={() => { setDyerId(d.id); setDyerSearch(d.name); setShowDrop(false); }}>
                      {d.name} <span className="text-gray-500">— {formatPKR(d.currentBalance)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Payment Mode</label>
            <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)}
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Grey Item (In)</label>
            <select value={greyItemId} onChange={e => setGreyItemId(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">— select —</option>
              {greyItems.map(it => <option key={it.id} value={it.id}>{it.name} (Stock: {it.stock})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Dyed Item (Out)</label>
            <select value={dyedItemId} onChange={e => setDyedItemId(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">— select —</option>
              {dyedItems.map(it => <option key={it.id} value={it.id}>{it.name} (Stock: {it.stock})</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Qty In (meters)</label>
            <input type="number" value={qtyIn} onChange={e => handleQtyInChange(Number(e.target.value))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Qty Out (meters)</label>
            <input type="number" value={qtyOut} onChange={e => { setQtyOutEdited(true); setQtyOut(Number(e.target.value)); }} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-mono uppercase mb-1">Rate / Meter</label>
            <input type="number" value={ratePerMeter} onChange={e => setRatePerMeter(Number(e.target.value))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
        </div>
        {paymentMode === 'partial' && (
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Paid Amount</label>
            <input type="number" value={paidInput} onChange={e => setPaidInput(Number(e.target.value))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
          </div>
        )}
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Remarks</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent h-16 resize-none bg-white" />
        </div>
        <div className="w-full sm:min-w-[300px] sm:w-auto bg-white space-y-2 pt-1">
          <div className="flex justify-between items-center bg-black text-white px-4 py-3 font-display text-lg sm:text-xl">
            <span>TOTAL</span>
            <span className="whitespace-nowrap">{formatPKR(totalValue)}</span>
          </div>
          <div className="flex justify-between font-mono text-xs px-1">
            <span>Paid: <strong className="text-success">{formatPKR(paid)}</strong></span>
            <span>Balance: <strong className={balance > 0 ? 'text-danger' : 'text-success'}>{formatPKR(balance)}</strong></span>
          </div>
          <button onClick={save} className="w-full border-2 border-black bg-accent py-2.5 font-bold hover:bg-black hover:text-white brutal-press shadow-brutal">SAVE — F9</button>
        </div>
      </div>
    </div>
  );
}
