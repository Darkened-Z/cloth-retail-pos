import type { JournalVoucher } from '@/types';

export const mockJournalVouchers: JournalVoucher[] = [
  {
    id: 'JV1', serial: 'JV-001', date: '2025-01-31',
    narration: 'Depreciation adjustment for January',
    lines: [
      { accountId: 'A830', debit: 5000,  credit: 0,    description: 'Depreciation expense' },
      { accountId: 'A500', debit: 0,     credit: 5000, description: 'Accumulated depreciation' },
    ],
  },
  {
    id: 'JV2', serial: 'JV-002', date: '2025-02-28',
    narration: 'Opening stock adjustment',
    lines: [
      { accountId: 'A420', debit: 50000, credit: 0,     description: 'Stock adjustment debit' },
      { accountId: 'A100', debit: 0,     credit: 50000, description: 'Capital adjustment' },
    ],
  },
];
