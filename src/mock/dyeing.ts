import type { DyeingVoucher } from '@/types';
import { mockParties } from './parties';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const mockDyeingVouchers: DyeingVoucher[] = Array.from({ length: 15 }, (_, i) => {
  const dyers = mockParties.filter(p => p.type === 'dyer');
  const dyer = dyers[i % dyers.length];
  const qtyIn = Math.floor(Math.random() * 200) + 50;
  const qtyOut = qtyIn - Math.floor(Math.random() * 10);
  const rate = 25 + Math.floor(Math.random() * 20);
  return {
    id: `DV-${String(i + 1).padStart(3, '0')}`,
    serial: `DV-${String(i + 1).padStart(4, '0')}`,
    date: iso(Math.floor(Math.random() * 90)),
    dyerId: dyer.id,
    greyItemId: 'IT001',
    dyedItemId: 'IT009',
    qtyIn,
    qtyOut,
    ratePerMeter: rate,
    totalValue: qtyOut * rate,
    remarks: '',
  };
});
