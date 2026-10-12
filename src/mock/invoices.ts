import type { SalesInvoice, InvoiceLine } from '@/types';
import { mockParties } from './parties';
import { mockItems } from './items';

function iso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const customers = mockParties.filter(p => p.type === 'customer');
// Exclude pure service items from random product lines
const productItems = mockItems.filter(it => !['IT016', 'IT017'].includes(it.id));

function makeInvoice(i: number, daysAgo: number): SalesInvoice {
  const c = customers[i % customers.length];
  const lineCount = (i % 3) + 1;
  const lines: InvoiceLine[] = [];
  for (let j = 0; j < lineCount; j++) {
    const item = productItems[(i * 3 + j * 7) % productItems.length];
    const qty = ((i * 2 + j * 5) % 40) + 5;
    lines.push({ itemId: item.id, qty, unit: item.unit, rate: item.salePrice, amount: qty * item.salePrice });
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const discount = Math.floor(subtotal * (i % 5 === 0 ? 0.03 : 0.015));
  const grandTotal = subtotal - discount;
  const pm: 'cash' | 'credit' | 'partial' =
    i % 4 === 0 ? 'cash' : i % 4 === 1 ? 'credit' : i % 4 === 2 ? 'partial' : 'cash';
  const paid = pm === 'cash' ? grandTotal : pm === 'credit' ? 0 : Math.floor(grandTotal * 0.5);
  return {
    id: `INV-${String(i + 1).padStart(3, '0')}`,
    serial: `120-${String(i + 1).padStart(4, '0')}`,
    date: iso(daysAgo),
    customerId: c.id,
    lines,
    subtotal,
    discount,
    grandTotal,
    paid,
    balance: grandTotal - paid,
    paymentMode: pm,
    notes: '',
  };
}

// Build day-offset list: dense recent, tapering older
const dayOffsets: number[] = [];
// Today: 6 invoices
for (let i = 0; i < 6; i++) dayOffsets.push(0);
// Days 1-6 (this week): 4 per day
for (let d = 1; d <= 6; d++) for (let i = 0; i < 4; i++) dayOffsets.push(d);
// Days 7-27 (earlier this month): 2–3 per day
for (let d = 7; d <= 27; d++) for (let i = 0; i < (d % 3 === 0 ? 3 : 2); i++) dayOffsets.push(d);
// Days 28-58 (last month): 1–2 per day
for (let d = 28; d <= 58; d++) for (let i = 0; i < (d % 3 === 0 ? 2 : 1); i++) dayOffsets.push(d);
// Days 59-89 (two months ago): 1 every other day
for (let d = 59; d <= 89; d += 2) dayOffsets.push(d);
// Days 90-179 (months 3-6): 1 every 3 days
for (let d = 90; d <= 179; d += 3) dayOffsets.push(d);
// Days 180-364 (months 6-12): 1 every 5 days
for (let d = 180; d <= 364; d += 5) dayOffsets.push(d);

export const mockInvoices: SalesInvoice[] = dayOffsets
  .map((daysAgo, i) => makeInvoice(i, daysAgo))
  .sort((a, b) => b.date.localeCompare(a.date));
