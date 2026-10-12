import { useState } from 'react';
import type { SalesInvoice, Shop, Party, Item } from '@/types';
import { useShop } from '@/stores/useShop';
import { useParties } from '@/stores/useParties';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate } from '@/lib/formatDate';
import { toWords } from '@/lib/numberToWords';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { downloadInvoicePdf } from './InvoicePdf';

export interface InvoicePreviewProps {
  invoice: SalesInvoice;
  shop?: Shop;
  customer?: Party;
  items?: Item[];
  onClose: () => void;
}

export function InvoicePreview({ invoice, shop, customer, items, onClose }: InvoicePreviewProps) {
  const { shop: storeShop } = useShop();
  const { parties } = useParties();
  const { items: storeItems } = useItems();
  const [downloading, setDownloading] = useState(false);

  const activeShop = shop ?? storeShop;
  const activeItems = items ?? storeItems;
  const activeCustomer = customer ?? parties.find(p => p.id === invoice.customerId);

  const prevBalance = activeCustomer ? activeCustomer.currentBalance - invoice.balance : 0;
  const newBalance = activeCustomer ? activeCustomer.currentBalance : invoice.balance;

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice, activeShop, activeCustomer, activeItems);
    } finally {
      setDownloading(false);
    }
  }

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
    'ctrl+s': () => { void handleDownload(); },
    escape: () => onClose(),
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border-2 border-black shadow-brutal-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col print:max-w-none print:max-h-none print:border-0 print:shadow-none">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b-2 border-black bg-black text-white px-3 sm:px-4 py-2.5 sm:py-3 print:hidden sticky top-0 z-10">
          <span className="font-mono text-xs font-bold uppercase tracking-wider truncate">
            INVOICE PREVIEW — {invoice.serial}
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-initial border-2 border-white bg-accent text-black px-2.5 sm:px-3 py-1 text-xs font-mono font-bold hover:bg-white brutal-press whitespace-nowrap"
            >
              PRINT (Ctrl+P)
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 sm:flex-initial border-2 border-white bg-white text-black px-2.5 sm:px-3 py-1 text-xs font-mono font-bold hover:bg-accent brutal-press disabled:opacity-50 whitespace-nowrap"
            >
              {downloading ? 'GENERATING…' : 'PDF (Ctrl+S)'}
            </button>
            <button
              onClick={onClose}
              className="border-2 border-white bg-danger text-white px-2.5 sm:px-3 py-1 text-xs font-mono font-bold hover:bg-red-700 brutal-press whitespace-nowrap"
            >
              CLOSE (Esc)
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet */}
        <div className="p-4 sm:p-8 overflow-y-auto font-mono text-xs text-black space-y-4 print:p-4 print:overflow-visible">
          {/* Shop Header */}
          <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start gap-3 border-2 border-black p-3 sm:p-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl uppercase">{activeShop.name}</h2>
              <p className="text-xs text-gray-700">{activeShop.address}</p>
              <p className="text-xs text-gray-700">Phone: {activeShop.phone}</p>
              {activeShop.ntn && <p className="text-xs text-gray-700">NTN: {activeShop.ntn}</p>}
            </div>
            <div className="sm:text-right print:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-black/20">
              <div className="inline-block border-2 border-black bg-accent px-3 py-1 font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                INVOICE
              </div>
              <div className="text-xs">
                <span className="text-gray-500">Serial:</span> <span className="font-bold">{invoice.serial}</span>
              </div>
              <div className="text-xs">
                <span className="text-gray-500">Date:</span> <span className="font-bold">{formatDate(invoice.date)}</span>
              </div>
            </div>
          </div>

          {/* Bill-To Block */}
          <div className="flex flex-col sm:flex-row print:flex-row justify-between sm:items-center gap-2 border-2 border-black bg-muted p-3">
            <div>
              <div className="text-[10px] font-bold uppercase text-gray-500">BILL TO</div>
              <div className="font-sans text-sm font-bold">{activeCustomer?.name ?? 'Walk-in Customer'}</div>
              {activeCustomer?.phone && <div className="text-xs">{activeCustomer.phone}</div>}
              {activeCustomer?.address && <div className="text-xs text-gray-600">{activeCustomer.address}</div>}
            </div>
            <div className="sm:text-right print:text-right">
              <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">PAYMENT MODE</div>
              <span className="inline-block border-2 border-black bg-white px-2.5 py-1 text-xs font-bold uppercase">
                {invoice.paymentMode}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border-2 border-black overflow-x-auto bg-white">
            <table className="w-full min-w-[480px] text-xs font-mono">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-10">#</th>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-right w-20">Qty</th>
                  <th className="px-3 py-2 text-left w-20">Unit</th>
                  <th className="px-3 py-2 text-right w-28">Rate</th>
                  <th className="px-3 py-2 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, i) => {
                  const item = activeItems.find(it => it.id === line.itemId);
                  return (
                    <tr
                      key={`${line.itemId}-${i}`}
                      className={`border-t border-black ${i % 2 === 1 ? 'bg-muted/60' : ''}`}
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap">{i + 1}</td>
                      <td className="px-3 py-1.5 font-sans font-medium">{item?.name ?? line.itemId}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{line.qty}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{line.unit}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{formatPKR(line.rate)}</td>
                      <td className="px-3 py-1.5 text-right font-bold whitespace-nowrap">{formatPKR(line.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="border-2 border-black bg-muted p-2.5">
                <div className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">AMOUNT IN WORDS</div>
                <div className="italic text-xs">{toWords(invoice.grandTotal)}</div>
              </div>
              {activeCustomer && (
                <div className="border-2 border-black p-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-gray-500">ACCOUNT SUMMARY</div>
                  <div className="flex justify-between">
                    <span>Previous Balance:</span>
                    <span className="whitespace-nowrap">{formatPKR(prevBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Invoice Balance:</span>
                    <span className="whitespace-nowrap">{formatPKR(invoice.balance)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-black pt-1">
                    <span>New Balance:</span>
                    <span className="whitespace-nowrap">{formatPKR(newBalance)}</span>
                  </div>
                </div>
              )}
              {invoice.notes && (
                <div className="border-2 border-black p-2.5">
                  <div className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">NOTES</div>
                  <div>{invoice.notes}</div>
                </div>
              )}
            </div>

            <div className="border-2 border-black self-start">
              <div className="flex justify-between px-3 py-1.5 border-b border-black">
                <span>Subtotal</span>
                <span className="whitespace-nowrap">{formatPKR(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 border-b border-black">
                <span>Discount</span>
                <span className="whitespace-nowrap">{formatPKR(invoice.discount)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-black text-white font-bold text-sm">
                <span>GRAND TOTAL</span>
                <span className="whitespace-nowrap">{formatPKR(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 border-b border-black">
                <span>Paid</span>
                <span className="text-success font-bold whitespace-nowrap">{formatPKR(invoice.paid)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 font-bold">
                <span>Balance</span>
                <span className={`whitespace-nowrap ${invoice.balance > 0 ? 'text-danger' : 'text-success'}`}>
                  {formatPKR(invoice.balance)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signatures */}
          <div className="border-t-2 border-black pt-3 mt-6">
            <div className="text-[10px] font-bold uppercase text-gray-500">TERMS & CONDITIONS</div>
            <p className="text-xs text-gray-700 mb-8 sm:mb-10">{activeShop.terms}</p>
            <div className="flex justify-between gap-4 pt-6">
              <div className="w-36 sm:w-48 border-t-2 border-black pt-1 text-center text-[10px] font-bold uppercase">
                CUSTOMER SIGNATURE
              </div>
              <div className="w-36 sm:w-48 border-t-2 border-black pt-1 text-center text-[10px] font-bold uppercase">
                AUTHORIZED SIGNATURE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
