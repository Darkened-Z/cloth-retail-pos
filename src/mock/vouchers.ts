import type { ReceiptVoucher, PaymentVoucher } from '@/types';

export const mockReceiptVouchers: ReceiptVoucher[] = [
  { id: 'RV1', serial: 'RV-001', date: '2025-01-08', partyId: 'C1', amount: 50000, receivedIn: 'cash', description: 'Payment received against invoice INV-001' },
  { id: 'RV2', serial: 'RV-002', date: '2025-01-15', partyId: 'C2', amount: 30000, receivedIn: 'bank', bankAccountId: 'A411', description: 'Partial payment received' },
  { id: 'RV3', serial: 'RV-003', date: '2025-02-01', partyId: 'C1', amount: 25000, receivedIn: 'cash', description: 'Balance payment received' },
  { id: 'RV4', serial: 'RV-004', date: '2025-02-10', partyId: 'C3', amount: 15000, receivedIn: 'cash', description: 'Advance payment' },
];

export const mockPaymentVouchers: PaymentVoucher[] = [
  { id: 'PV1', serial: 'PV-001', date: '2025-01-10', partyId: 'S1', amount: 40000, paidFrom: 'cash', description: 'Payment to supplier against purchase' },
  { id: 'PV2', serial: 'PV-002', date: '2025-01-20', partyId: 'D1', amount: 12000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Dyeing charges payment' },
  { id: 'PV3', serial: 'PV-003', date: '2025-02-05', partyId: 'S2', amount: 35000, paidFrom: 'cash', description: 'Fabric purchase payment' },
];
