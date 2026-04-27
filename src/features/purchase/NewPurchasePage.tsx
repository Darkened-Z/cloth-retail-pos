import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePurchase } from '@/stores/usePurchase';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useShop } from '@/stores/useShop';
import { formatPKR } from '@/lib/formatNumber';
import { todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { InvoiceLine, PurchaseVoucher } from '@/types';

interface LineRow extends InvoiceLine { _id: string; itemName: string; }

export function NewPurchasePage() {
  const { add } = usePurchase();
  const { parties } = useParties();
  const { items, adjustStock } = useItems();
  const { shop } = useShop();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayISO());
  const [supplierId, setSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash'|'credit'>('credit');
  const [lines, setLines] = useState<LineRow[]>([]);
  const [itemSearch, setItemSearch] = useState<Record<string, string>>({});
  const [showItemDrop, setShowItemDrop] = useState<string | null>(null);

  const suppliers = parties.filter(p => p.type === 'supplier' && p.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const paid = paymentMode === 'cash' ? subtotal : 0;

  function addLine() {
    const id = String(Date.now());
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
      id: `PV-${Date.now()}`, serial: `PV-${String(Date.now()).slice(-4)}`, date, supplierId,
      lines: lines.map(l => ({ itemId: l.itemId, qty: l.qty, unit: l.unit, rate: l.rate, amount: l.amount })),
      subtotal, discount: 0, grandTotal: subtotal, paid, balance: subtotal - paid, paymentMode,
    };
    add(voucher);
    lines.forEach(l => { if (l.itemId) adjustStock(l.itemId, l.qty); });
    navigate({ to: '/purchase' });
  }
  useKeyboardShortcuts({ f9: () => save(), 'ctrl+n': () => addLine(), escape: () => navigate({ to: '/purchase' }) });
  const filteredItems = (s: string) => items.filter(it => it.name.toLowerCase().includes(s.toLowerCase())).slice(0, 10);

  return (
    <div className="p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">NEW PURCHASE VOUCHER</h1>
        <button onClick={() => navigate({ to: '/purchase' })} className="text-xs font-mono border-2 border-black px-3 py-1 hover:bg-accent brutal-press">← BACK</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Supplier</label>
          <div className="relative">
            <input value={supplierSearch} onChange={e => { setSupplierSearch(e.target.value); setShowDrop(true); }} onFocus={() => setShowDrop(true)}
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            {showDrop && supplierSearch && (
              <div className="absolute top-full left-0 right-0 border-2 border-black bg-white z-50 shadow-brutal max-h-40 overflow-y-auto">
                {suppliers.map(s => (
                  <button key={s.id} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-accent border-b border-black/20"
                    onClick={() => { setSupplierId(s.id); setSupplierSearch(s.name); setShowDrop(false); }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Payment</label>
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
          </select>
        </div>
      </div>
      <div className="border-2 border-black shadow-brutal mb-4">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 w-6"></th></tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line._id} className="border-b border-black/20">
                <td className="px-3 py-1 text-gray-500">{i+1}</td>
                <td className="px-2 py-1 relative">
                  <input value={itemSearch[line._id] ?? line.itemName} onChange={e => { setItemSearch(p => ({...p, [line._id]: e.target.value})); setShowItemDrop(line._id); }} onFocus={() => setShowItemDrop(line._id)}
                    className="w-full border border-black px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" />
                  {showItemDrop === line._id && (itemSearch[line._id] ?? '') !== '' && (
                    <div className="absolute top-full left-0 z-50 border-2 border-black bg-white shadow-brutal min-w-[300px] max-h-40 overflow-y-auto">
                      {filteredItems(itemSearch[line._id] ?? '').map(it => (
                        <button key={it.id} className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-accent border-b border-black/20"
                          onClick={() => selectItem(line._id, it)}>{it.name} — {formatPKR(it.purchasePrice)}</button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1"><input type="number" value={line.qty} onChange={e => updateLine(line._id, 'qty', Number(e.target.value))} className="w-full border border-black px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" /></td>
                <td className="px-2 py-1 text-gray-600">{line.unit}</td>
                <td className="px-2 py-1"><input type="number" value={line.rate} onChange={e => updateLine(line._id, 'rate', Number(e.target.value))} className="w-full border border-black px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" /></td>
                <td className="px-3 py-1 text-right font-bold">{formatPKR(line.amount)}</td>
                <td className="px-2 py-1"><button onClick={() => setLines(p => p.filter(l => l._id !== line._id))} className="text-danger text-base">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t-2 border-black p-2">
          <button onClick={addLine} className="text-xs font-mono border border-black px-3 py-1 hover:bg-accent brutal-press">+ ADD LINE</button>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="border-2 border-black shadow-brutal p-4 min-w-[240px] space-y-2 font-mono text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></div>
          <div className="flex justify-between bg-black text-white px-3 py-2 font-bold"><span>TOTAL</span><span>{formatPKR(subtotal)}</span></div>
          <button onClick={save} className="w-full border-2 border-black bg-accent py-2.5 font-bold hover:bg-black hover:text-white brutal-press shadow-brutal">SAVE — F9</button>
        </div>
      </div>
    </div>
  );
}
