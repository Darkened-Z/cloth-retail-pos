import type { DyeingVoucher } from '@/types';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const mockDyeingVouchers: DyeingVoucher[] = [
  // NAZAKAT DYEING (P201) — 4 vouchers, Total Value: PKR 25,835
  {
    id: 'DV-001', serial: 'DV-0001', date: iso(5), dyerId: 'P201',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 180, qtyOut: 175,
    ratePerMeter: 36, totalValue: 6300, paid: 0, balance: 6300, paymentMode: 'credit', remarks: 'Batch #1 dyed black'
  },
  {
    id: 'DV-005', serial: 'DV-0005', date: iso(25), dyerId: 'P201',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 220, qtyOut: 215,
    ratePerMeter: 40, totalValue: 8600, paid: 0, balance: 8600, paymentMode: 'credit', remarks: 'Batch #5 dyed navy'
  },
  {
    id: 'DV-009', serial: 'DV-0009', date: iso(45), dyerId: 'P201',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 150, qtyOut: 145,
    ratePerMeter: 38, totalValue: 5510, paid: 0, balance: 5510, paymentMode: 'credit', remarks: 'Batch #9 dyed maroon'
  },
  {
    id: 'DV-013', serial: 'DV-0013', date: iso(65), dyerId: 'P201',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 160, qtyOut: 155,
    ratePerMeter: 35, totalValue: 5425, paid: 0, balance: 5425, paymentMode: 'credit', remarks: 'Batch #13 dyed olive'
  },

  // RS DYEING (P202) — 4 vouchers, Total Value: PKR 24,415
  {
    id: 'DV-002', serial: 'DV-0002', date: iso(8), dyerId: 'P202',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 200, qtyOut: 195,
    ratePerMeter: 35, totalValue: 6825, paid: 0, balance: 6825, paymentMode: 'credit', remarks: 'Batch #2 dyed charcoal'
  },
  {
    id: 'DV-006', serial: 'DV-0006', date: iso(28), dyerId: 'P202',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 160, qtyOut: 155,
    ratePerMeter: 42, totalValue: 6510, paid: 0, balance: 6510, paymentMode: 'credit', remarks: 'Batch #6 dyed royal blue'
  },
  {
    id: 'DV-010', serial: 'DV-0010', date: iso(52), dyerId: 'P202',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 180, qtyOut: 175,
    ratePerMeter: 34, totalValue: 5950, paid: 0, balance: 5950, paymentMode: 'credit', remarks: 'Batch #10 dyed bottle green'
  },
  {
    id: 'DV-014', serial: 'DV-0014', date: iso(72), dyerId: 'P202',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 140, qtyOut: 135,
    ratePerMeter: 38, totalValue: 5130, paid: 0, balance: 5130, paymentMode: 'credit', remarks: 'Batch #14 dyed rust'
  },

  // HQ DYEING (P203) — 4 vouchers, Total Value: PKR 21,185
  {
    id: 'DV-003', serial: 'DV-0003', date: iso(12), dyerId: 'P203',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 190, qtyOut: 185,
    ratePerMeter: 32, totalValue: 5920, paid: 0, balance: 5920, paymentMode: 'credit', remarks: 'Batch #3 dyed teal'
  },
  {
    id: 'DV-007', serial: 'DV-0007', date: iso(35), dyerId: 'P203',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 170, qtyOut: 165,
    ratePerMeter: 36, totalValue: 5940, paid: 0, balance: 5940, paymentMode: 'credit', remarks: 'Batch #7 dyed mustard'
  },
  {
    id: 'DV-011', serial: 'DV-0011', date: iso(58), dyerId: 'P203',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 150, qtyOut: 145,
    ratePerMeter: 35, totalValue: 5075, paid: 0, balance: 5075, paymentMode: 'credit', remarks: 'Batch #11 dyed plum'
  },
  {
    id: 'DV-015', serial: 'DV-0015', date: iso(80), dyerId: 'P203',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 130, qtyOut: 125,
    ratePerMeter: 34, totalValue: 4250, paid: 0, balance: 4250, paymentMode: 'credit', remarks: 'Batch #15 dyed zinc'
  },

  // FAZAL-E-RABBI DYEING (P204) — 3 vouchers, Total Value: PKR 14,935
  {
    id: 'DV-004', serial: 'DV-0004', date: iso(15), dyerId: 'P204',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 180, qtyOut: 175,
    ratePerMeter: 30, totalValue: 5250, paid: 0, balance: 5250, paymentMode: 'credit', remarks: 'Batch #4 dyed steel grey'
  },
  {
    id: 'DV-008', serial: 'DV-0008', date: iso(40), dyerId: 'P204',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 160, qtyOut: 155,
    ratePerMeter: 32, totalValue: 4960, paid: 0, balance: 4960, paymentMode: 'credit', remarks: 'Batch #8 dyed burgundy'
  },
  {
    id: 'DV-012', serial: 'DV-0012', date: iso(62), dyerId: 'P204',
    greyItemId: 'IT001', dyedItemId: 'IT009', qtyIn: 140, qtyOut: 135,
    ratePerMeter: 35, totalValue: 4725, paid: 0, balance: 4725, paymentMode: 'credit', remarks: 'Batch #12 dyed copper'
  },
];
