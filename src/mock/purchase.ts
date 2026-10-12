import type { PurchaseVoucher, InvoiceLine } from '@/types';
import { mockParties } from './parties';
import { mockItems } from './items';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const schedule: Array<{ daysAgo: number; si: number; ii: number; qty: number; pm: 'cash' | 'credit' }> = [
  { daysAgo: 3,   si: 0, ii: 0, qty: 200, pm: 'cash'   },
  { daysAgo: 7,   si: 1, ii: 1, qty: 150, pm: 'credit' },
  { daysAgo: 10,  si: 2, ii: 2, qty: 120, pm: 'cash'   },
  { daysAgo: 14,  si: 0, ii: 3, qty: 180, pm: 'credit' },
  { daysAgo: 18,  si: 1, ii: 0, qty: 100, pm: 'cash'   },
  { daysAgo: 22,  si: 2, ii: 4, qty: 160, pm: 'credit' },
  { daysAgo: 26,  si: 0, ii: 1, qty: 130, pm: 'cash'   },
  { daysAgo: 30,  si: 1, ii: 2, qty: 90,  pm: 'credit' },
  { daysAgo: 35,  si: 2, ii: 3, qty: 200, pm: 'cash'   },
  { daysAgo: 40,  si: 0, ii: 0, qty: 140, pm: 'credit' },
  { daysAgo: 45,  si: 1, ii: 4, qty: 85,  pm: 'cash'   },
  { daysAgo: 50,  si: 2, ii: 1, qty: 170, pm: 'credit' },
  { daysAgo: 55,  si: 0, ii: 2, qty: 110, pm: 'cash'   },
  { daysAgo: 60,  si: 1, ii: 3, qty: 190, pm: 'credit' },
  { daysAgo: 70,  si: 2, ii: 0, qty: 130, pm: 'cash'   },
  { daysAgo: 80,  si: 0, ii: 4, qty: 95,  pm: 'credit' },
  { daysAgo: 90,  si: 1, ii: 1, qty: 165, pm: 'cash'   },
  { daysAgo: 100, si: 2, ii: 2, qty: 145, pm: 'credit' },
  { daysAgo: 120, si: 0, ii: 3, qty: 200, pm: 'cash'   },
  { daysAgo: 140, si: 1, ii: 0, qty: 175, pm: 'credit' },
  { daysAgo: 160, si: 2, ii: 4, qty: 115, pm: 'cash'   },
  { daysAgo: 180, si: 0, ii: 1, qty: 155, pm: 'credit' },
  { daysAgo: 210, si: 1, ii: 2, qty: 120, pm: 'cash'   },
  { daysAgo: 240, si: 2, ii: 3, qty: 180, pm: 'credit' },
  { daysAgo: 270, si: 0, ii: 0, qty: 200, pm: 'cash'   },
  { daysAgo: 300, si: 1, ii: 4, qty: 130, pm: 'credit' },
  { daysAgo: 330, si: 2, ii: 1, qty: 160, pm: 'cash'   },
  { daysAgo: 360, si: 0, ii: 2, qty: 140, pm: 'credit' },
];

export const mockPurchaseVouchers: PurchaseVoucher[] = schedule.map((p, i) => {
  const suppliers = mockParties.filter(s => s.type === 'supplier');
  const greyItems = mockItems.filter(it => it.subId.startsWith('IS1'));
  const s    = suppliers[p.si % suppliers.length];
  const item = greyItems[p.ii % greyItems.length];
  const lines: InvoiceLine[] = [{ itemId: item.id, qty: p.qty, unit: item.unit, rate: item.purchasePrice, amount: p.qty * item.purchasePrice }];
  const subtotal = lines[0].amount;
  const paid = p.pm === 'cash' ? subtotal : 0;
  return {
    id:     `PV-${String(i + 1).padStart(3, '0')}`,
    serial: `PV-${String(i + 1).padStart(4, '0')}`,
    date: iso(p.daysAgo),
    supplierId: s.id,
    lines,
    subtotal,
    discount: 0,
    grandTotal: subtotal,
    paid,
    balance: subtotal - paid,
    paymentMode: p.pm,
  };
});
