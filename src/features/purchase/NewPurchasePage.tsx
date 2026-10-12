import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { usePurchase } from '@/stores/usePurchase';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { InvoiceLine, PurchaseVoucher } from '@/types';

interface LineRow extends InvoiceLine { _id: string; itemName: string; }

export function NewPurchasePage() {
  const params = useParams({ strict: false }) as { id?: string };
  const { vouchers, add, update } = usePurchase();
  const { parties, update: updateParty } = useParties();
  const { items, adjustStock } = useItems();
  const navigate = useNavigate();

  const existing = params.id ? vouchers.find(v => v.id === params.id) : undefined;

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? '');
  const [supplierSearch, setSupplierSearch] = useState(parties.find(p => p.id === existing?.supplierId)?.name ?? '');
  const [showDrop, setShowDrop] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash'|'credit'|'partial'>(existing?.paymentMode ?? 'credit');
  const [discount, setDiscount] = useState(existing?.discount ?? 0);
  const [paidInput, setPaidInput] = useState(existing?.paid ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [lines, setLines] = useState<LineRow[]>(
    (existing?.lines ?? []).map((l, i) => {
      const item = items.find(it => it.id === l.itemId);
      return { ...l, _id: String(i), itemName: item?.name ?? l.itemId };
    })
  );
  const [itemSearch, setItemSearch] = useState<Record<string, string>>({});
  const [showItemDrop, setShowItemDrop] = useState<string | null>(null);

  const suppliers = parties.filter(p => p.type === 'supplier' && p.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const supplier = parties.find(p => p.id === supplierId);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const grandTotal = subtotal - discount;
  const paid = paymentMode === 'cash' ? grandTotal : paymentMode === 'credit' ? 0 : paidInput;
  const balance = grandTotal - paid;

  function addLine() {
    const id = String(Date.now() + Math.random());
    setLines(prev => [...prev, { _id: id, itemId: '', itemName: '', qty: 1, unit: 'meter', rate: 0, amount: 0 }]);
  }

  function updateLine(id: string, field: string, val: any) {
    setLines(prev => prev.map(l => {
      if (l._id !== id) return l;
      const u = { ...l, [field]: val };
      if (field === 'qty' || field === 'rate') u.amount = u.qty * u.rate;
      return u;
    }));
  }

  function selectItem(lineId: string, item: any) {
    setLines(prev => prev.map(l => l._id === lineId ? { ...l, itemId: item.id, itemName: item.name, unit: item.unit, rate: item.purchasePrice, amount: l.qty * item.purchasePrice } : l));
    setItemSearch(p => ({ ...p, [lineId]: item.name }));
    setShowItemDrop(null);
  }

  function save() {
    if (!supplierId || lines.length === 0) return;
    const voucher: PurchaseVoucher = {
      id: existing?.id ?? `PV-${Date.now()}`,
      serial: existing?.serial ?? `PV-${String(Date.now()).slice(-4)}`,
      date,
      supplierId,
      lines: lines.map(l => ({ itemId: l.itemId, qty: l.qty, unit: l.unit, rate: l.rate, amount: l.amount })),
      subtotal,
      discount,
      grandTotal,
      paid,
      balance,
      paymentMode,
      notes,
    };

    if (existing) {
      existing.lines.forEach(l => {
        if (l.itemId) adjustStock(l.itemId, -l.qty);
      });
      voucher.lines.forEach(l => {
        if (l.itemId) adjustStock(l.itemId, l.qty);
      });
      if (existing.supplierId === supplierId) {
        if (supplier) {
          updateParty({ ...supplier, currentBalance: supplier.currentBalance + (balance - existing.balance) });
        }
      } else {
        const oldSupplier = parties.find(p => p.id === existing.supplierId);
        if (oldSupplier) {
          updateParty({ ...oldSupplier, currentBalance: oldSupplier.currentBalance - existing.balance });
        }
        if (supplier) {
          updateParty({ ...supplier, currentBalance: supplier.currentBalance + balance });
        }
      }
      update(voucher);
    } else {
      add(voucher);
      voucher.lines.forEach(l => {
        if (l.itemId) adjustStock(l.itemId, l.qty);
      });
      if (supplier) {
        updateParty({ ...supplier, currentBalance: supplier.currentBalance + balance });
      }
    }
    navigate({ to: '/purchase' });
  }

  useKeyboardShortcuts({ f9: () => save(), 'ctrl+n': () => addLine(), escape: () => navigate({ to: '/purchase' }) });
  const filteredItems = (s: string) => items.filter(it => it.name.toLowerCase().includes(s.toLowerCase())).slice(0, 10);

  return (
    <div className="p-3 sm:p-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">{existing ? 'EDIT' : 'NEW'} PURCHASE VOUCHER</h1>
        <button onClick={() => navigate({ to: '/purchase' })} className="w-full sm:w-auto text-center text-xs font-mono border-2 border-black bg-white px-3 py-1.5 hover:bg-accent brutal-press">← BACK</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-mono uppercase mb-1">Supplier</label>
          <div className="relative">
            <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowDrop(true); }} onFocus={() => setShowDrop(true)}
              placeholder="Type to search supplier…"
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            {showDrop && supplierSearch && (
              <div className="absolute top-full left-0 right-0 border-2 border-black bg-white z-50 shadow-brutal max-h-40 overflow-y-auto">
                {suppliers.map(s => (
                  <button key={s.id} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-accent border-b border-black/20"
                    onClick={() => { setSupplierId(s.id); setSupplierSearch(s.name); setShowDrop(false); }}>
                    {s.name} <span className="text-gray-500">— {formatPKR(s.currentBalance)}</span>
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
          <label className="block text-xs font-mono uppercase mb-1">Payment</label>
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="partial">Partial</option>
          </select>
        </div>
      </div>
      <div className="border-2 border-black shadow-brutal mb-4 bg-white">
        <div className={`overflow-x-auto bg-white ${showItemDrop ? 'pb-44' : ''}`}>
          <table className="w-full min-w-[580px] text-xs font-mono">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-3 py-2 text-left w-8">#</th>
                <th className="px-3 py-2 text-left">Item</th>
                <th className="px-3 py-2 text-right w-20">Qty</th>
                <th className="px-3 py-2 text-left w-20">Unit</th>
                <th className="px-3 py-2 text-right w-24">Rate</th>
                <th className="px-3 py-2 text-right w-28">Amount</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    No items added yet. Click "+ ADD LINE" to start entry.
                  </td>
                </tr>
              )}
              {lines.map((line, i) => (
                <tr key={line._id} className="border-b border-black/20">
                  <td className="px-3 py-1 text-gray-500 whitespace-nowrap">{i+1}</td>
                  <td className="px-2 py-1 relative">
                    <input value={itemSearch[line._id] ?? line.itemName} onChange={e => { setItemSearch(p => ({...p, [line._id]: e.target.value})); setShowItemDrop(line._id); }} onFocus={() => setShowItemDrop(line._id)}
                      placeholder="Search fabric item…"
                      className="w-full border border-black px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" />
                    {showItemDrop === line._id && (itemSearch[line._id] ?? '') !== '' && (
                      <div className="absolute top-full left-0 z-50 border-2 border-black bg-white shadow-brutal min-w-[260px] sm:min-w-[300px] max-h-40 overflow-y-auto">
                        {filteredItems(itemSearch[line._id] ?? '').map(it => (
                          <button key={it.id} className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-accent border-b border-black/20"
                            onClick={() => selectItem(line._id, it)}>{it.name} — {formatPKR(it.purchasePrice)}</button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1"><input type="number" value={line.qty} onChange={e => updateLine(line._id, 'qty', Number(e.target.value))} className="w-full border border-black px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" /></td>
                  <td className="px-2 py-1 text-gray-600 whitespace-nowrap">{line.unit}</td>
                  <td className="px-2 py-1">
                    <input type="number" value={line.rate}
                      onChange={e => updateLine(line._id, 'rate', Number(e.target.value))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && i === lines.length - 1) {
                          e.preventDefault();
                          addLine();
                        }
                      }}
                      className="w-full border border-black px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" />
                  </td>
                  <td className="px-3 py-1 text-right font-bold whitespace-nowrap">{formatPKR(line.amount)}</td>
                  <td className="px-2 py-1 text-center"><button onClick={() => setLines(p => p.filter(l => l._id !== line._id))} className="text-danger text-base px-1">×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-black p-2 bg-muted/40">
          <button onClick={addLine} className="text-xs font-mono border border-black bg-white px-3 py-1 hover:bg-accent brutal-press">+ ADD LINE (Ctrl+N)</button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-start">
        <div className="flex-1 w-full">
          <label className="block text-xs font-mono uppercase mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent h-20 resize-none bg-white" />
        </div>
        <div className="border-2 border-black shadow-brutal p-4 w-full sm:min-w-[300px] sm:w-auto bg-white space-y-2 font-mono text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="whitespace-nowrap">{formatPKR(subtotal)}</span></div>
          <div className="flex justify-between items-center gap-2">
            <span>Discount</span>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
              className="border-2 border-black px-2 py-1 text-right w-28 focus:outline-none focus:ring-1 focus:ring-accent text-xs" />
          </div>
          <div className="flex justify-between bg-black text-white px-3 py-2 font-bold"><span>TOTAL</span><span className="whitespace-nowrap">{formatPKR(grandTotal)}</span></div>
          {paymentMode === 'partial' && (
            <div className="flex justify-between items-center gap-2">
              <span>Paid</span>
              <input type="number" value={paidInput} onChange={e => setPaidInput(Number(e.target.value))}
                className="border-2 border-black px-2 py-1 text-right w-28 focus:outline-none focus:ring-1 focus:ring-accent text-xs" />
            </div>
          )}
          <div className={`flex justify-between font-bold ${balance > 0 ? 'text-danger' : 'text-success'}`}>
            <span>Balance</span><span className="whitespace-nowrap">{formatPKR(balance)}</span>
          </div>
          <button onClick={save} className="w-full border-2 border-black bg-accent py-2.5 font-bold hover:bg-black hover:text-white brutal-press shadow-brutal">SAVE — F9</button>
        </div>
      </div>
    </div>
  );
}
