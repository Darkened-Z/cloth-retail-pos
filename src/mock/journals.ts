import type { JournalVoucher } from '@/types';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function monthEnd(monthsAgo: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return d.toISOString().slice(0, 10);
}

export const mockJournalVouchers: JournalVoucher[] = [
  {
    id: 'JV001', serial: 'JV-001', date: monthEnd(1),
    narration: 'Monthly depreciation — furniture & equipment',
    lines: [
      { accountId: 'A830', debit: 3500, credit: 0,    description: 'Depreciation expense' },
      { accountId: 'A500', debit: 0,    credit: 2000, description: 'Acc. dep — furniture' },
      { accountId: 'A501', debit: 0,    credit: 1500, description: 'Acc. dep — equipment' },
    ],
  },
  {
    id: 'JV002', serial: 'JV-002', date: monthEnd(2),
    narration: 'Monthly depreciation — furniture & equipment',
    lines: [
      { accountId: 'A830', debit: 3500, credit: 0,    description: 'Depreciation expense' },
      { accountId: 'A500', debit: 0,    credit: 2000, description: 'Acc. dep — furniture' },
      { accountId: 'A501', debit: 0,    credit: 1500, description: 'Acc. dep — equipment' },
    ],
  },
  {
    id: 'JV003', serial: 'JV-003', date: monthEnd(3),
    narration: 'Monthly depreciation — furniture & equipment',
    lines: [
      { accountId: 'A830', debit: 3500, credit: 0,    description: 'Depreciation expense' },
      { accountId: 'A500', debit: 0,    credit: 2000, description: 'Acc. dep — furniture' },
      { accountId: 'A501', debit: 0,    credit: 1500, description: 'Acc. dep — equipment' },
    ],
  },
  {
    id: 'JV004', serial: 'JV-004', date: iso(15),
    narration: 'Stock shortage adjustment — Dyed Boski Maroon',
    lines: [
      { accountId: 'A830', debit: 2400, credit: 0,    description: 'Shortage loss' },
      { accountId: 'A420', debit: 0,    credit: 2400, description: 'Stock reduction' },
    ],
  },
  {
    id: 'JV005', serial: 'JV-005', date: iso(45),
    narration: 'Stock shortage adjustment — Polythene bags',
    lines: [
      { accountId: 'A830', debit: 700, credit: 0,   description: 'Shortage loss' },
      { accountId: 'A420', debit: 0,   credit: 700, description: 'Stock reduction' },
    ],
  },
  {
    id: 'JV006', serial: 'JV-006', date: iso(5),
    narration: 'Bank charges — HBL current account',
    lines: [
      { accountId: 'A830', debit: 500, credit: 0,   description: 'Bank charges' },
      { accountId: 'A411', debit: 0,   credit: 500, description: 'Bank — HBL' },
    ],
  },
  {
    id: 'JV007', serial: 'JV-007', date: iso(35),
    narration: 'Bank charges — HBL current account',
    lines: [
      { accountId: 'A830', debit: 500, credit: 0,   description: 'Bank charges' },
      { accountId: 'A411', debit: 0,   credit: 500, description: 'Bank — HBL' },
    ],
  },
  {
    id: 'JV008', serial: 'JV-008', date: iso(90),
    narration: 'Opening stock value adjustment — quarterly review',
    lines: [
      { accountId: 'A420', debit: 120000, credit: 0,      description: 'Opening stock debit' },
      { accountId: 'A100', debit: 0,      credit: 120000, description: 'Capital adjustment' },
    ],
  },
  {
    id: 'JV009', serial: 'JV-009', date: iso(22),
    narration: 'Advance salary settlement — Salman Raza',
    lines: [
      { accountId: 'A800', debit: 5000, credit: 0,    description: 'Salary expense' },
      { accountId: 'A410', debit: 0,    credit: 5000, description: 'Cash in hand' },
    ],
  },
  {
    id: 'JV010', serial: 'JV-010', date: iso(10),
    narration: 'Accrued rent reversal — current month',
    lines: [
      { accountId: 'A210', debit: 35000, credit: 0,     description: 'Accrued rent cleared' },
      { accountId: 'A411', debit: 0,     credit: 35000, description: 'Bank payment' },
    ],
  },
  {
    id: 'JV011', serial: 'JV-011', date: iso(55),
    narration: 'Accrued rent reversal — previous month',
    lines: [
      { accountId: 'A210', debit: 35000, credit: 0,     description: 'Accrued rent cleared' },
      { accountId: 'A411', debit: 0,     credit: 35000, description: 'Bank payment' },
    ],
  },
  {
    id: 'JV012', serial: 'JV-012', date: monthEnd(4),
    narration: 'Monthly depreciation — furniture & equipment',
    lines: [
      { accountId: 'A830', debit: 3500, credit: 0,    description: 'Depreciation expense' },
      { accountId: 'A500', debit: 0,    credit: 2000, description: 'Acc. dep — furniture' },
      { accountId: 'A501', debit: 0,    credit: 1500, description: 'Acc. dep — equipment' },
    ],
  },
];
