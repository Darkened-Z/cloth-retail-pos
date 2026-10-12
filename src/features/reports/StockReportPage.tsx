import { useState } from 'react';
import { useItems } from '@/stores/useItems';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useStockTransfers } from '@/stores/useStockTransfers';
import { useLocations } from '@/stores/useLocations';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

type ReportTab = 'stock' | 'ledger';

interface ItemMovement {
  date: string;
  type: string;
  ref: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
}

export function StockReportPage() {
  const [tab, setTab] = useState<ReportTab>('stock');
  const [selectedItemId, setSelectedItemId] = useState('');
  const { items, masters: itemMasters, subs: itemSubs } = useItems();
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { transfers } = useStockTransfers();
  const { locations } = useLocations();
  const locMap = Object.fromEntries(locations.map(l => [l.id, l.name]));

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  // Low stock items
  const lowStock = items.filter(i => i.stock <= i.minStock);

  // Item ledger
  const movements: ItemMovement[] = [];
  if (selectedItemId) {
    let running = 0;

    // Purchases
    purchases.forEach(p => {
      p.lines.filter(l => l.itemId === selectedItemId).forEach(l => {
        running += l.qty;
        movements.push({ date: p.date, type: 'Purchase', ref: p.serial, qtyIn: l.qty, qtyOut: 0, balance: running });
      });
    });

    // Sales
    invoices.forEach(inv => {
      inv.lines.filter(l => l.itemId === selectedItemId).forEach(l => {
        running -= l.qty;
        movements.push({ date: inv.date, type: 'Sale', ref: inv.serial, qtyIn: 0, qtyOut: l.qty, balance: running });
      });
    });

    // Dyeing
    dyeings.forEach(v => {
      if (v.greyItemId === selectedItemId) {
        running -= v.qtyIn;
        movements.push({ date: v.date, type: 'DYEING OUT', ref: v.serial, qtyIn: 0, qtyOut: v.qtyIn, balance: running });
      }
      if (v.dyedItemId === selectedItemId) {
        running += v.qtyOut;
        movements.push({ date: v.date, type: 'DYEING IN', ref: v.serial, qtyIn: v.qtyOut, qtyOut: 0, balance: running });
      }
    });

    // Transfers in
    transfers.filter(t => t.itemId === selectedItemId && t.toLocationId === 'L1').forEach(t => {
      running += t.qty;
      movements.push({ date: t.date, type: `Transfer In (${locMap[t.fromLocationId] ?? t.fromLocationId})`, ref: t.serial, qtyIn: t.qty, qtyOut: 0, balance: running });
    });

    // Transfers out
    transfers.filter(t => t.itemId === selectedItemId && t.fromLocationId === 'L1').forEach(t => {
      running -= t.qty;
      movements.push({ date: t.date, type: `Transfer Out (${locMap[t.toLocationId] ?? t.toLocationId})`, ref: t.serial, qtyIn: 0, qtyOut: t.qty, balance: running });
    });

    movements.sort((a, b) => a.date.localeCompare(b.date));
    // Recalculate running balance in order
    let bal = 0;
    movements.forEach(m => {
      bal += m.qtyIn - m.qtyOut;
      m.balance = bal;
    });
  }

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl uppercase tracking-tight">Stock Reports</h1>
        <button onClick={() => window.print()}
          className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>

      <div className="flex border-2 border-black w-full sm:w-fit bg-white shadow-brutal-sm">
        {(['stock', 'ledger'] as ReportTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold uppercase border-r-2 border-black last:border-0 whitespace-nowrap ${tab === t ? 'bg-black text-white' : 'bg-white hover:bg-accent'}`}>
            {t === 'stock' ? 'Stock Report' : 'Item Ledger'}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="space-y-4">
          {lowStock.length > 0 && (
            <div className="border-2 border-danger bg-white shadow-brutal-sm p-3">
              <p className="text-xs sm:text-sm font-mono font-bold text-danger">⚠ {lowStock.length} item(s) below minimum stock level</p>
            </div>
          )}
          <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Item</th>
                  <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Category</th>
                  <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Unit</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Stock</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Min Stock</th>
                  <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Value (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const sub = itemSubs.find(s => s.id === item.subId);
                  const master = itemMasters.find(m => m.id === sub?.masterId);
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isLow ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-2 font-bold">{item.name}</td>
                      <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{master?.name} › {sub?.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs uppercase">{item.unit}</td>
                      <td className={`px-4 py-2 text-right font-mono font-bold whitespace-nowrap ${isLow ? 'text-red-600' : ''}`}>{item.stock}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-500 whitespace-nowrap">{item.minStock}</td>
                      <td className="px-4 py-2 text-right font-mono whitespace-nowrap">{formatNumber(item.stock * item.purchasePrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-black text-white border-t-2 border-black">
                <tr>
                  <td colSpan={5} className="px-4 py-2.5 font-bold uppercase text-right text-sm">Total Stock Value</td>
                  <td className="px-4 py-2.5 text-right font-mono font-black whitespace-nowrap">
                    {formatNumber(items.reduce((s, i) => s + i.stock * i.purchasePrice, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-black shadow-brutal p-4">
            <label className="block text-xs font-mono font-bold uppercase mb-1">Select Item</label>
            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white w-full sm:w-auto sm:min-w-[300px]">
              <option value="">-- Select Item --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          {selectedItem && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Current Stock', value: `${selectedItem.stock} ${selectedItem.unit}` },
                { label: 'Min Stock Level', value: `${selectedItem.minStock} ${selectedItem.unit}` },
                { label: 'Purchase Price', value: `PKR ${formatNumber(selectedItem.purchasePrice)}` },
                { label: 'Stock Value', value: `PKR ${formatNumber(selectedItem.stock * selectedItem.purchasePrice)}` },
              ].map(c => (
                <div key={c.label} className="bg-white border-2 border-black shadow-brutal p-4">
                  <p className="text-xs font-mono font-bold uppercase text-gray-500">{c.label}</p>
                  <p className="text-lg font-display font-mono mt-1 whitespace-nowrap">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {selectedItemId && (
            <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
              <table className="w-full min-w-[540px] text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Date</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Type</th>
                    <th className="text-left px-4 py-2.5 font-bold uppercase whitespace-nowrap">Ref</th>
                    <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">In</th>
                    <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Out</th>
                    <th className="text-right px-4 py-2.5 font-bold uppercase whitespace-nowrap">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={i} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{formatDate(m.date)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{m.type}</td>
                      <td className="px-4 py-2 font-mono text-xs font-bold whitespace-nowrap">{m.ref}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-700 whitespace-nowrap">{m.qtyIn > 0 ? m.qtyIn : '—'}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-600 whitespace-nowrap">{m.qtyOut > 0 ? m.qtyOut : '—'}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap">{m.balance}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm font-mono">No movements found for this item</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
