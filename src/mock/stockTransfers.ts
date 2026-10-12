import type { StockTransfer } from '@/types';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const mockStockTransfers: StockTransfer[] = [
  { id: 'ST001', serial: 'ST-001', date: iso(3),  fromLocationId: 'L1', toLocationId: 'L3', itemId: 'IT001', qty: 200, unit: 'meter', rate: 85,  amount: 17000, notes: 'Grey WnW 50/50 for dyeing' },
  { id: 'ST002', serial: 'ST-002', date: iso(4),  fromLocationId: 'L3', toLocationId: 'L1', itemId: 'IT009', qty: 193, unit: 'meter', rate: 165, amount: 31845, notes: 'Dyed WnW Black returned' },
  { id: 'ST003', serial: 'ST-003', date: iso(6),  fromLocationId: 'L1', toLocationId: 'L4', itemId: 'IT003', qty: 150, unit: 'meter', rate: 120, amount: 18000, notes: 'Grey Boski for dyeing' },
  { id: 'ST004', serial: 'ST-004', date: iso(8),  fromLocationId: 'L4', toLocationId: 'L1', itemId: 'IT011', qty: 144, unit: 'meter', rate: 220, amount: 31680, notes: 'Dyed Boski Maroon returned' },
  { id: 'ST005', serial: 'ST-005', date: iso(10), fromLocationId: 'L1', toLocationId: 'L2', itemId: 'IT009', qty: 100, unit: 'meter', rate: 165, amount: 16500, notes: 'To packing — customer order' },
  { id: 'ST006', serial: 'ST-006', date: iso(14), fromLocationId: 'L1', toLocationId: 'L5', itemId: 'IT002', qty: 180, unit: 'meter', rate: 75,  amount: 13500, notes: 'Grey WnW 40/40 for dyeing' },
  { id: 'ST007', serial: 'ST-007', date: iso(16), fromLocationId: 'L5', toLocationId: 'L1', itemId: 'IT010', qty: 174, unit: 'meter', rate: 165, amount: 28710, notes: 'Dyed WnW Navy returned' },
  { id: 'ST008', serial: 'ST-008', date: iso(19), fromLocationId: 'L1', toLocationId: 'L2', itemId: 'IT012', qty: 60,  unit: 'meter', rate: 220, amount: 13200, notes: 'To packing — order' },
  { id: 'ST009', serial: 'ST-009', date: iso(22), fromLocationId: 'L1', toLocationId: 'L3', itemId: 'IT005', qty: 200, unit: 'meter', rate: 60,  amount: 12000, notes: 'Grey Cotton Plain for dyeing' },
  { id: 'ST010', serial: 'ST-010', date: iso(25), fromLocationId: 'L3', toLocationId: 'L1', itemId: 'IT013', qty: 196, unit: 'meter', rate: 85,  amount: 16660, notes: 'Khadar Brown returned from dyeing' },
  { id: 'ST011', serial: 'ST-011', date: iso(30), fromLocationId: 'L1', toLocationId: 'L6', itemId: 'IT004', qty: 120, unit: 'meter', rate: 140, amount: 16800, notes: 'Grey Boski Heavy for dyeing' },
  { id: 'ST012', serial: 'ST-012', date: iso(33), fromLocationId: 'L6', toLocationId: 'L1', itemId: 'IT012', qty: 115, unit: 'meter', rate: 220, amount: 25300, notes: 'Dyed Boski Bottle Green returned' },
  { id: 'ST013', serial: 'ST-013', date: iso(38), fromLocationId: 'L1', toLocationId: 'L2', itemId: 'IT013', qty: 80,  unit: 'meter', rate: 85,  amount: 6800,  notes: 'To packing' },
  { id: 'ST014', serial: 'ST-014', date: iso(42), fromLocationId: 'L1', toLocationId: 'L4', itemId: 'IT001', qty: 160, unit: 'meter', rate: 85,  amount: 13600, notes: 'Grey WnW for dyeing — batch 2' },
  { id: 'ST015', serial: 'ST-015', date: iso(46), fromLocationId: 'L4', toLocationId: 'L1', itemId: 'IT009', qty: 155, unit: 'meter', rate: 165, amount: 25575, notes: 'Dyed WnW Black returned' },
  { id: 'ST016', serial: 'ST-016', date: iso(55), fromLocationId: 'L1', toLocationId: 'L3', itemId: 'IT006', qty: 200, unit: 'meter', rate: 70,  amount: 14000, notes: 'Grey Cotton Dobby for dyeing' },
  { id: 'ST017', serial: 'ST-017', date: iso(60), fromLocationId: 'L3', toLocationId: 'L1', itemId: 'IT014', qty: 195, unit: 'meter', rate: 90,  amount: 17550, notes: 'Khadar Multi returned' },
  { id: 'ST018', serial: 'ST-018', date: iso(70), fromLocationId: 'L1', toLocationId: 'L5', itemId: 'IT003', qty: 100, unit: 'meter', rate: 120, amount: 12000, notes: 'Grey Boski for dyeing — batch 2' },
  { id: 'ST019', serial: 'ST-019', date: iso(75), fromLocationId: 'L5', toLocationId: 'L1', itemId: 'IT011', qty: 96,  unit: 'meter', rate: 220, amount: 21120, notes: 'Dyed Boski Maroon returned' },
  { id: 'ST020', serial: 'ST-020', date: iso(85), fromLocationId: 'L1', toLocationId: 'L2', itemId: 'IT010', qty: 50,  unit: 'meter', rate: 165, amount: 8250,  notes: 'To packing' },
];
