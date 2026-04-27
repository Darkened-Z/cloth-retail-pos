import type { StockTransfer } from '@/types';

export const mockStockTransfers: StockTransfer[] = [
  {
    id: 'ST1', serial: 'ST-001', date: '2025-01-05',
    fromLocationId: 'L1', toLocationId: 'L3',
    itemId: 'I1', qty: 200, unit: 'meter', rate: 120, amount: 24000,
    notes: 'Grey fabric for dyeing',
  },
  {
    id: 'ST2', serial: 'ST-002', date: '2025-01-10',
    fromLocationId: 'L3', toLocationId: 'L1',
    itemId: 'I2', qty: 190, unit: 'meter', rate: 180, amount: 34200,
    notes: 'Dyed fabric returned',
  },
  {
    id: 'ST3', serial: 'ST-003', date: '2025-01-15',
    fromLocationId: 'L1', toLocationId: 'L2',
    itemId: 'I2', qty: 100, unit: 'meter', rate: 180, amount: 18000,
    notes: 'To packing for order',
  },
];
