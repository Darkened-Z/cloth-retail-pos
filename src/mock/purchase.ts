import type { PurchaseVoucher, InvoiceLine } from '@/types';
import { mockParties } from './parties';
import { mockItems } from './items';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const mockPurchaseVouchers: PurchaseVoucher[] = Array.from({ length: 20 }, (_, i) => {
  const suppliers = mockParties.filter(p => p.type === 'supplier');
  const s = suppliers[i % suppliers.length];
  const greyItems = mockItems.filter(it => it.subId.startsWith('IS1'));
  const item = greyItems[i % greyItems.length];
  const qty = Math.floor(Math.random() * 200) + 50;
  const lines: InvoiceLine[] = [{ itemId: item.id, qty, unit: item.unit, rate: item.purchasePrice, amount: qty * item.purchasePrice }];
  const subtotal = lines[0].amount;
  const grandTotal = subtotal;
  const paymentMode = i % 2 === 0 ? 'cash' : 'credit';
  const paid = paymentMode === 'cash' ? grandTotal : 0;
  return {
    id: `PV-${String(i + 1).padStart(3, '0')}`,
    serial: `PV-${String(i + 1).padStart(4, '0')}`,
    date: iso(Math.floor(Math.random() * 90)),
    supplierId: s.id,
    lines,
    subtotal,
    discount: 0,
    grandTotal,
    paid,
    balance: grandTotal - paid,
    paymentMode,
  };
});
