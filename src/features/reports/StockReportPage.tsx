import { useState } from 'react';
import { useItems } from '@/stores/useItems';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useStockTransfers } from '@/stores/useStockTransfers';
import { useLocations } from '@/stores/useLocations';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';

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
  const { transfers } = useStockTransfers();
  const { locations } = useLocations();
  const locMap = Object.fromEntries(locations.map(l => [l.id, l.name]));

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
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-2xl font-black uppercase tracking-tight">Stock Reports</h1>

      <div className="flex border-2 border-black w-fit">
        {(['stock', 'ledger'] as ReportTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-bold uppercase border-r-2 border-black last:border-0 ${tab === t ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
            {t === 'stock' ? 'Stock Report' : 'Item Ledger'}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <div className="space-y-3">
          {lowStock.length > 0 && (
            <div className="border-2 border-red-500 bg-red-50 p-3">
              <p className="text-sm font-bold text-red-700">⚠ {lowStock.length} item(s) below minimum stock level</p>
            </div>
          )}
          <div className="border-2 border-black">
            <table className="w-full text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left px-4 py-2 font-bold uppercase">Item</th>
                  <th className="text-left px-4 py-2 font-bold uppercase">Category</th>
                  <th className="text-left px-4 py-2 font-bold uppercase">Unit</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Stock</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Min Stock</th>
                  <th className="text-right px-4 py-2 font-bold uppercase">Value (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const sub = itemSubs.find(s => s.id === item.subId);
                  const master = itemMasters.find(m => m.id === sub?.masterId);
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isLow ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-2 font-bold">{item.name}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{master?.name} › {sub?.name}</td>
                      <td className="px-4 py-2">{item.unit}</td>
                      <td className={`px-4 py-2 text-right font-mono font-bold ${isLow ? 'text-red-600' : ''}`}>{item.stock}</td>
                      <td className="px-4 py-2 text-right font-mono text-gray-500">{item.minStock}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatNumber(item.stock * item.purchasePrice)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-black">
                <tr>
                  <td colSpan={5} className="px-4 py-2 font-bold uppercase text-right text-sm">Total Stock Value</td>
                  <td className="px-4 py-2 text-right font-mono font-black">
                    {formatNumber(items.reduce((s, i) => s + i.stock * i.purchasePrice, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Select Item</label>
            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)}
              className="border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white min-w-[300px]">
              <option value="">-- Select Item --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          {selectedItem && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Current Stock', value: `${selectedItem.stock} ${selectedItem.unit}` },
                { label: 'Purchase Price', value: `PKR ${formatNumber(selectedItem.purchasePrice)}` },
                { label: 'Stock Value', value: `PKR ${formatNumber(selectedItem.stock * selectedItem.purchasePrice)}` },
              ].map(c => (
                <div key={c.label} className="border-2 border-black p-3">
                  <p className="text-xs font-bold uppercase text-gray-500">{c.label}</p>
                  <p className="text-lg font-black font-mono">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {selectedItemId && (
            <div className="border-2 border-black">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-4 py-2 font-bold uppercase">Date</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Type</th>
                    <th className="text-left px-4 py-2 font-bold uppercase">Ref</th>
                    <th className="text-right px-4 py-2 font-bold uppercase">In</th>
                    <th className="text-right px-4 py-2 font-bold uppercase">Out</th>
                    <th className="text-right px-4 py-2 font-bold uppercase">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2">{formatDate(m.date)}</td>
                      <td className="px-4 py-2">{m.type}</td>
                      <td className="px-4 py-2 font-mono text-xs">{m.ref}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-700">{m.qtyIn > 0 ? m.qtyIn : ''}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-600">{m.qtyOut > 0 ? m.qtyOut : ''}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold">{m.balance}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No movements found for this item</td></tr>
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
