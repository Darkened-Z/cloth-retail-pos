import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useInvoices } from '@/stores/useInvoices';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { useShop } from '@/stores/useShop';
import { formatPKR } from '@/lib/formatNumber';
import { toWords } from '@/lib/numberToWords';
import { todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { downloadInvoicePdf } from '@/components/invoice/InvoicePdf';
import type { InvoiceLine, SalesInvoice } from '@/types';

interface LineRow extends InvoiceLine { _id: string; itemName: string; }

export function NewInvoicePage() {
  const params = useParams({ strict: false }) as { id?: string };
  const { invoices, add, update } = useInvoices();
  const { parties, update: updateParty } = useParties();
  const { items, adjustStock } = useItems();
  const { shop } = useShop();
  const navigate = useNavigate();

  const existing = params.id ? invoices.find(i => i.id === params.id) : undefined;

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [customerId, setCustomerId] = useState(existing?.customerId ?? '');
  const [paymentMode, setPaymentMode] = useState<'cash'|'credit'|'partial'>(existing?.paymentMode ?? 'credit');
  const [discount, setDiscount] = useState(existing?.discount ?? 0);
  const [paid, setPaid] = useState(existing?.paid ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [lines, setLines] = useState<LineRow[]>(
    (existing?.lines ?? []).map((l, i) => {
      const item = items.find(it => it.id === l.itemId);
      return { ...l, _id: String(i), itemName: item?.name ?? l.itemId };
    })
  );
  const [customerSearch, setCustomerSearch] = useState(parties.find(p => p.id === existing?.customerId)?.name ?? '');
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const [itemSearch, setItemSearch] = useState<Record<string, string>>({});
  const [showItemDrop, setShowItemDrop] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<SalesInvoice | null>(null);
  const [exitAfterPreview, setExitAfterPreview] = useState(false);

  const customers = parties.filter(p => p.type === 'customer' && p.name.toLowerCase().includes(customerSearch.toLowerCase()));
  const customer = parties.find(p => p.id === customerId);
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const grandTotal = subtotal - discount;
  const effectivePaid = paymentMode === 'cash' ? grandTotal : paymentMode === 'credit' ? 0 : paid;
  const balance = grandTotal - effectivePaid;

  const prevCustomerBalance = customer
    ? (existing && existing.customerId === customer.id
        ? customer.currentBalance - existing.balance
        : customer.currentBalance)
    : 0;

  function addLine() {
    const id = String(Date.now() + Math.random());
    setLines(prev => [...prev, { _id: id, itemId: '', itemName: '', qty: 1, unit: 'meter', rate: 0, amount: 0 }]);
    setItemSearch(p => ({ ...p, [id]: '' }));
  }

  function duplicateLastLine() {
    if (lines.length === 0) {
      addLine();
      return;
    }
    const last = lines[lines.length - 1];
    const id = String(Date.now() + Math.random());
    setLines(prev => [...prev, { ...last, _id: id }]);
    setItemSearch(p => ({ ...p, [id]: last.itemName }));
  }

  function updateLine(id: string, field: string, val: any) {
    setLines(prev => prev.map(l => {
      if (l._id !== id) return l;
      const updated = { ...l, [field]: val };
      if (field === 'qty' || field === 'rate') updated.amount = updated.qty * updated.rate;
      return updated;
    }));
  }

  function removeLine(id: string) {
    setLines(prev => prev.filter(l => l._id !== id));
  }

  function selectItem(lineId: string, item: any) {
    setLines(prev => prev.map(l => l._id === lineId ? { ...l, itemId: item.id, itemName: item.name, unit: item.unit, rate: item.salePrice, amount: l.qty * item.salePrice } : l));
    setItemSearch(p => ({ ...p, [lineId]: item.name }));
    setShowItemDrop(null);
  }

  function buildInvoiceObj(): SalesInvoice {
    const serial = existing?.serial ?? `${shop.invoicePrefix}-${String(Date.now()).slice(-4)}`;
    return {
      id: existing?.id ?? `INV-${Date.now()}`,
      serial,
      date,
      customerId,
      lines: lines.map(l => ({ itemId: l.itemId, qty: l.qty, unit: l.unit, rate: l.rate, amount: l.amount })),
      subtotal,
      discount,
      grandTotal,
      paid: effectivePaid,
      balance,
      paymentMode,
      notes,
    };
  }

  function save(andPrint = false) {
    if (!customerId || lines.length === 0) return;
    const inv = buildInvoiceObj();
    if (existing) {
      existing.lines.forEach(l => {
        if (l.itemId) adjustStock(l.itemId, l.qty);
      });
      inv.lines.forEach(l => {
        if (l.itemId) adjustStock(l.itemId, -l.qty);
      });
      if (existing.customerId === customerId) {
        if (customer) {
          updateParty({ ...customer, currentBalance: customer.currentBalance + (balance - existing.balance) });
        }
      } else {
        const oldCustomer = parties.find(p => p.id === existing.customerId);
        if (oldCustomer) {
          updateParty({ ...oldCustomer, currentBalance: oldCustomer.currentBalance - existing.balance });
        }
        if (customer) {
          updateParty({ ...customer, currentBalance: customer.currentBalance + balance });
        }
      }
      update(inv);
    } else {
      add(inv);
      inv.lines.forEach(l => {
        if (l.itemId) adjustStock(l.itemId, -l.qty);
      });
      if (customer) {
        updateParty({ ...customer, currentBalance: customer.currentBalance + balance });
      }
    }

    if (andPrint) {
      setExitAfterPreview(true);
      setPreviewInvoice(inv);
      setTimeout(() => window.print(), 100);
    } else {
      navigate({ to: '/sales' });
    }
  }

  const previewCustomer = customer
    ? { ...customer, currentBalance: prevCustomerBalance + balance }
    : undefined;

  useKeyboardShortcuts({
    f9: () => save(false),
    'ctrl+n': () => addLine(),
    'ctrl+d': () => duplicateLastLine(),
    'ctrl+p': () => {
      if (lines.length > 0) setPreviewInvoice(buildInvoiceObj());
    },
    'ctrl+s': () => {
      if (lines.length > 0) {
        void downloadInvoicePdf(buildInvoiceObj(), shop, previewCustomer, items);
      }
    },
    escape: () => {
      if (previewInvoice) {
        setPreviewInvoice(null);
        if (exitAfterPreview) navigate({ to: '/sales' });
      } else {
        navigate({ to: '/sales' });
      }
    },
  });

  const filteredItems = (search: string) => items.filter(it => it.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

  return (
    <div className="p-3 sm:p-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">{existing ? 'EDIT' : 'NEW'} SALES INVOICE</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(existing || lines.length > 0) && (
            <button
              onClick={() => setPreviewInvoice(buildInvoiceObj())}
              className="flex-1 sm:flex-initial text-xs font-mono border-2 border-black bg-white px-3 py-1.5 font-bold hover:bg-accent brutal-press whitespace-nowrap"
            >
              PREVIEW / PDF (Ctrl+P)
            </button>
          )}
          <button onClick={() => navigate({ to: '/sales' })} className="flex-1 sm:flex-initial text-xs font-mono border-2 border-black bg-white px-3 py-1.5 hover:bg-accent brutal-press whitespace-nowrap">← BACK</button>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs font-mono uppercase mb-1">Customer</label>
          <div className="relative">
            <input value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); }}
              onFocus={() => setShowCustomerDrop(true)}
              placeholder="Type to search customer…"
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
            {showCustomerDrop && customerSearch && (
              <div className="absolute top-full left-0 right-0 border-2 border-black bg-white z-50 shadow-brutal max-h-48 overflow-y-auto">
                {customers.map(c => (
                  <button key={c.id} className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-accent border-b border-black/20"
                    onClick={() => { setCustomerId(c.id); setCustomerSearch(c.name); setShowCustomerDrop(false); }}>
                    {c.name} <span className="text-gray-500">— {formatPKR(c.currentBalance)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white" />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase mb-1">Payment</label>
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as any)}
            className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white">
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
            <option value="partial">Partial</option>
          </select>
        </div>
      </div>

      {/* Lines Table */}
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
                    No items added yet. Click "+ ADD LINE" to start billing.
                  </td>
                </tr>
              )}
              {lines.map((line, i) => (
                <tr key={line._id} className="border-b border-black/20">
                  <td className="px-3 py-1 text-gray-500 whitespace-nowrap">{i + 1}</td>
                  <td className="px-2 py-1 relative">
                    <input value={itemSearch[line._id] ?? line.itemName}
                      onChange={e => { setItemSearch(p => ({...p, [line._id]: e.target.value})); setShowItemDrop(line._id); }}
                      onFocus={() => setShowItemDrop(line._id)}
                      placeholder="Search fabric item…"
                      className="w-full border border-black px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" />
                    {showItemDrop === line._id && (itemSearch[line._id] ?? '') !== '' && (
                      <div className="absolute top-full left-0 z-50 border-2 border-black bg-white shadow-brutal min-w-[260px] sm:min-w-[300px] max-h-40 overflow-y-auto">
                        {filteredItems(itemSearch[line._id] ?? '').map(it => (
                          <button key={it.id} className="w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-accent border-b border-black/20"
                            onClick={() => selectItem(line._id, it)}>
                            {it.name} <span className="text-gray-500">— {formatPKR(it.salePrice)} (Stock: {it.stock})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={line.qty} min={1}
                      onChange={e => updateLine(line._id, 'qty', Number(e.target.value))}
                      className="w-full border border-black px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-accent font-mono text-xs" />
                  </td>
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
                  <td className="px-2 py-1 text-center">
                    <button onClick={() => removeLine(line._id)} className="text-danger hover:text-red-700 text-base leading-none px-1">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-black p-2 flex flex-wrap gap-2 bg-muted/40">
          <button onClick={addLine} className="text-xs font-mono border border-black bg-white px-3 py-1 hover:bg-accent brutal-press">
            + ADD LINE (Ctrl+N)
          </button>
          {lines.length > 0 && (
            <button onClick={duplicateLastLine} className="text-xs font-mono border border-black bg-white px-3 py-1 hover:bg-accent brutal-press">
              DUPLICATE LAST (Ctrl+D)
            </button>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
        <div className="flex-1 space-y-2 w-full">
          {customer && (
            <div className="border-2 border-black bg-white p-3 text-xs font-mono space-y-1">
              <div className="font-bold">{customer.name}</div>
              <div className="flex justify-between">
                <span>Previous Balance:</span>
                <span className="text-danger">{formatPKR(prevCustomerBalance)}</span>
              </div>
              <div className="flex justify-between border-t border-black/20 pt-1">
                <span>After This Invoice:</span>
                <span className="font-bold text-danger">{formatPKR(prevCustomerBalance + balance)}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent h-20 resize-none bg-white" />
          </div>
        </div>
        <div className="border-2 border-black shadow-brutal p-4 w-full sm:min-w-[300px] md:w-80 bg-white space-y-2 font-mono text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="whitespace-nowrap">{formatPKR(subtotal)}</span></div>
          <div className="flex justify-between items-center gap-2">
            <span>Discount</span>
            <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))}
              className="border-2 border-black px-2 py-1 text-right w-28 focus:outline-none focus:ring-1 focus:ring-accent text-xs" />
          </div>
          <div className="flex justify-between bg-black text-white px-3 py-2 text-base font-bold">
            <span>GRAND TOTAL</span><span className="whitespace-nowrap">{formatPKR(grandTotal)}</span>
          </div>
          {paymentMode === 'partial' && (
            <div className="flex justify-between items-center gap-2">
              <span>Paid</span>
              <input type="number" value={paid} onChange={e => setPaid(Number(e.target.value))}
                className="border-2 border-black px-2 py-1 text-right w-28 focus:outline-none focus:ring-1 focus:ring-accent text-xs" />
            </div>
          )}
          <div className={`flex justify-between font-bold ${balance > 0 ? 'text-danger' : 'text-success'}`}>
            <span>Balance</span><span className="whitespace-nowrap">{formatPKR(balance)}</span>
          </div>
          <div className="text-xs text-gray-600 italic border-t border-black pt-2">{toWords(grandTotal)}</div>
          <button onClick={() => save(false)}
            className="w-full border-2 border-black bg-accent py-2.5 font-bold hover:bg-black hover:text-white brutal-press shadow-brutal mt-2">
            SAVE — F9
          </button>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button onClick={() => save(true)}
              className="border-2 border-black bg-white py-2 text-xs font-bold hover:bg-accent brutal-press">
              SAVE & PRINT
            </button>
            <button onClick={() => { if (lines.length > 0) setPreviewInvoice(buildInvoiceObj()); }}
              disabled={lines.length === 0}
              className="border-2 border-black bg-white py-2 text-xs font-bold hover:bg-accent brutal-press disabled:opacity-40">
              PREVIEW / PDF
            </button>
          </div>
        </div>
      </div>

      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          shop={shop}
          customer={previewCustomer}
          items={items}
          onClose={() => {
            setPreviewInvoice(null);
            if (exitAfterPreview) navigate({ to: '/sales' });
          }}
        />
      )}
    </div>
  );
}
