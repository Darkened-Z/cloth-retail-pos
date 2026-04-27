import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useStockTransfers } from '@/stores/useStockTransfers';
import { useLocations } from '@/stores/useLocations';
import { useItems } from '@/stores/useItems';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';

export function StockTransferPage() {
  const navigate = useNavigate();
  const { transfers, add } = useStockTransfers();
  const { locations } = useLocations();
  const { items } = useItems();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    fromLocationId: '',
    toLocationId: '',
    itemId: '',
    qty: '',
    unit: 'meter' as const,
    rate: '',
    notes: '',
  });

  const locMap = Object.fromEntries(locations.map(l => [l.id, l.name]));
  const itemMap = Object.fromEntries(items.map(i => [i.id, i]));

  function handleSave() {
    if (!form.fromLocationId || !form.toLocationId || !form.itemId || !form.qty || !form.rate) return;
    const qty = parseFloat(form.qty);
    const rate = parseFloat(form.rate);
    add({
      date: form.date,
      fromLocationId: form.fromLocationId,
      toLocationId: form.toLocationId,
      itemId: form.itemId,
      qty,
      unit: form.unit,
      rate,
      amount: qty * rate,
      notes: form.notes,
    });
    setShowForm(false);
    setForm({ date: new Date().toISOString().slice(0, 10), fromLocationId: '', toLocationId: '', itemId: '', qty: '', unit: 'meter', rate: '', notes: '' });
  }

  const sorted = [...transfers].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Stock Transfer</h1>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase hover:shadow-brutal transition-shadow"
        >
          + NEW TRANSFER
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-3">
          <h2 className="font-bold uppercase text-sm">New Stock Transfer</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Item</label>
              <select value={form.itemId} onChange={e => {
                const item = itemMap[e.target.value];
                setForm(f => ({ ...f, itemId: e.target.value, unit: item?.unit ?? 'meter', rate: item?.purchasePrice?.toString() ?? '' }));
              }} className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="">-- Select Item --</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">From Location</label>
              <select value={form.fromLocationId} onChange={e => setForm(f => ({ ...f, fromLocationId: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="">-- Select --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">To Location</label>
              <select value={form.toLocationId} onChange={e => setForm(f => ({ ...f, toLocationId: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="">-- Select --</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Qty</label>
              <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none font-mono" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Rate / Meter</label>
              <input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none font-mono" placeholder="0.00" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none" placeholder="Optional notes" />
            </div>
          </div>
          {form.qty && form.rate && (
            <p className="text-sm font-bold">Amount: <span className="font-mono text-green-700">PKR {formatNumber(parseFloat(form.qty) * parseFloat(form.rate))}</span></p>
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black">SAVE</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">CANCEL</button>
          </div>
        </div>
      )}

      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-2 font-bold uppercase">Serial</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Date</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Item</th>
              <th className="text-left px-4 py-2 font-bold uppercase">From</th>
              <th className="text-left px-4 py-2 font-bold uppercase">To</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Qty</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 font-mono text-xs">{t.serial}</td>
                <td className="px-4 py-2">{formatDate(t.date)}</td>
                <td className="px-4 py-2 font-bold">{itemMap[t.itemId]?.name ?? t.itemId}</td>
                <td className="px-4 py-2">{locMap[t.fromLocationId] ?? t.fromLocationId}</td>
                <td className="px-4 py-2">{locMap[t.toLocationId] ?? t.toLocationId}</td>
                <td className="px-4 py-2 text-right font-mono">{t.qty} {t.unit}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{formatNumber(t.amount)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm">No transfers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
