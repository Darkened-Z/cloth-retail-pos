import type { ReceiptVoucher, PaymentVoucher } from '@/types';
import { mockParties } from './parties';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const customers = mockParties.filter(p => p.type === 'customer');
const suppliers = mockParties.filter(p => p.type === 'supplier');
const dyers     = mockParties.filter(p => p.type === 'dyer');

export const mockReceiptVouchers: ReceiptVoucher[] = [
  { id: 'RV001', serial: 'RV-001', date: iso(1),  partyId: customers[0].id,  amount: 85000,  receivedIn: 'cash',              description: 'Payment received — Muhammad Arshad' },
  { id: 'RV002', serial: 'RV-002', date: iso(2),  partyId: customers[1].id,  amount: 120000, receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Haji Bashir Ahmed' },
  { id: 'RV003', serial: 'RV-003', date: iso(3),  partyId: customers[2].id,  amount: 50000,  receivedIn: 'cash',              description: 'Partial payment — Tariq Cloth House' },
  { id: 'RV004', serial: 'RV-004', date: iso(5),  partyId: customers[3].id,  amount: 40000,  receivedIn: 'cash',              description: 'Payment received — Riaz Fabrics' },
  { id: 'RV005', serial: 'RV-005', date: iso(6),  partyId: customers[4].id,  amount: 75000,  receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Khalid Traders' },
  { id: 'RV006', serial: 'RV-006', date: iso(8),  partyId: customers[5].id,  amount: 30000,  receivedIn: 'cash',              description: 'Payment received — Sajid Cloth Center' },
  { id: 'RV007', serial: 'RV-007', date: iso(10), partyId: customers[6].id,  amount: 60000,  receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Imran General Store' },
  { id: 'RV008', serial: 'RV-008', date: iso(12), partyId: customers[7].id,  amount: 95000,  receivedIn: 'cash',              description: 'Payment received — Shahzad Fabrics' },
  { id: 'RV009', serial: 'RV-009', date: iso(15), partyId: customers[8].id,  amount: 40000,  receivedIn: 'cash',              description: 'Payment received — Ali Brothers' },
  { id: 'RV010', serial: 'RV-010', date: iso(17), partyId: customers[9].id,  amount: 100000, receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Usman Cloth Mart' },
  { id: 'RV011', serial: 'RV-011', date: iso(20), partyId: customers[0].id,  amount: 50000,  receivedIn: 'cash',              description: 'Balance payment — Muhammad Arshad' },
  { id: 'RV012', serial: 'RV-012', date: iso(22), partyId: customers[2].id,  amount: 80000,  receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Tariq Cloth House' },
  { id: 'RV013', serial: 'RV-013', date: iso(25), partyId: customers[10].id, amount: 25000,  receivedIn: 'cash',              description: 'Payment received — Farooq Traders' },
  { id: 'RV014', serial: 'RV-014', date: iso(28), partyId: customers[11].id, amount: 70000,  receivedIn: 'cash',              description: 'Payment received — Hassan Fabrics' },
  { id: 'RV015', serial: 'RV-015', date: iso(32), partyId: customers[1].id,  amount: 120000, receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Haji Bashir Ahmed' },
  { id: 'RV016', serial: 'RV-016', date: iso(35), partyId: customers[3].id,  amount: 45000,  receivedIn: 'cash',              description: 'Payment received — Riaz Fabrics' },
  { id: 'RV017', serial: 'RV-017', date: iso(40), partyId: customers[4].id,  amount: 65000,  receivedIn: 'cash',              description: 'Payment received — Khalid Traders' },
  { id: 'RV018', serial: 'RV-018', date: iso(45), partyId: customers[12].id, amount: 45000,  receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Bilal Cloth House' },
  { id: 'RV019', serial: 'RV-019', date: iso(50), partyId: customers[13].id, amount: 55000,  receivedIn: 'cash',              description: 'Payment received — Naeem Brothers' },
  { id: 'RV020', serial: 'RV-020', date: iso(55), partyId: customers[14].id, amount: 70000,  receivedIn: 'bank', bankAccountId: 'A411', description: 'Payment received — Aamir Textile' },
];

export const mockPaymentVouchers: PaymentVoucher[] = [
  { id: 'PYV001', serial: 'PYV-001', date: iso(2),  partyId: suppliers[0].id, amount: 85000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Master Weaving Mills' },
  { id: 'PYV002', serial: 'PYV-002', date: iso(4),  partyId: dyers[0].id,     amount: 15000, paidFrom: 'cash',                      description: 'Dyeing charges — Nazakat Dyeing' },
  { id: 'PYV003', serial: 'PYV-003', date: iso(7),  partyId: suppliers[1].id, amount: 60000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Al-Rehman Textiles' },
  { id: 'PYV004', serial: 'PYV-004', date: iso(9),  partyId: dyers[1].id,     amount: 12000, paidFrom: 'cash',                      description: 'Dyeing charges — RS Dyeing' },
  { id: 'PYV005', serial: 'PYV-005', date: iso(12), partyId: suppliers[2].id, amount: 95000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Chaudhry Mills' },
  { id: 'PYV006', serial: 'PYV-006', date: iso(16), partyId: dyers[2].id,     amount: 18000, paidFrom: 'cash',                      description: 'Dyeing charges — HQ Dyeing' },
  { id: 'PYV007', serial: 'PYV-007', date: iso(20), partyId: suppliers[0].id, amount: 70000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Master Weaving Mills' },
  { id: 'PYV008', serial: 'PYV-008', date: iso(25), partyId: dyers[3].id,     amount: 10000, paidFrom: 'cash',                      description: 'Dyeing charges — Fazal-e-Rabbi Dyeing' },
  { id: 'PYV009', serial: 'PYV-009', date: iso(30), partyId: suppliers[1].id, amount: 50000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Al-Rehman Textiles' },
  { id: 'PYV010', serial: 'PYV-010', date: iso(35), partyId: dyers[0].id,     amount: 20000, paidFrom: 'cash',                      description: 'Dyeing charges — Nazakat Dyeing' },
  { id: 'PYV011', serial: 'PYV-011', date: iso(40), partyId: suppliers[2].id, amount: 75000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Chaudhry Mills' },
  { id: 'PYV012', serial: 'PYV-012', date: iso(50), partyId: dyers[1].id,     amount: 14000, paidFrom: 'cash',                      description: 'Dyeing charges — RS Dyeing' },
  { id: 'PYV013', serial: 'PYV-013', date: iso(60), partyId: suppliers[0].id, amount: 90000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Master Weaving Mills' },
  { id: 'PYV014', serial: 'PYV-014', date: iso(75), partyId: dyers[2].id,     amount: 22000, paidFrom: 'cash',                      description: 'Dyeing charges — HQ Dyeing' },
  { id: 'PYV015', serial: 'PYV-015', date: iso(90), partyId: suppliers[1].id, amount: 55000, paidFrom: 'bank', bankAccountId: 'A411', description: 'Payment to Al-Rehman Textiles' },
];
