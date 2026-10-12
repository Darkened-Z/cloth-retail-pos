export type AccountNature = 'Capital' | 'Liabilities' | 'Assets' | 'Incomes' | 'Expenses';

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  ntn?: string;
  logoUrl?: string;
  terms: string;
  invoicePrefix: string;
  language: 'en' | 'ur' | 'dual';
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'cashier' | 'accountant';
  displayName: string;
  active?: boolean;
}

export interface AccountMaster { id: string; nature: AccountNature; name: string; }
export interface AccountSub    { id: string; masterId: string; name: string; }
export interface Account       { id: string; subId: string; name: string; openingBalance: number; currentBalance: number; }

export interface ItemMaster { id: string; name: string; }
export interface ItemSub    { id: string; masterId: string; name: string; }
export interface Item {
  id: string;
  subId: string;
  name: string;
  unit: 'meter' | 'yard' | 'thaan';
  purchasePrice: number;
  salePrice: number;
  gazana: number;
  stock: number;
  minStock: number;
}

export interface Party {
  id: string;
  type: 'customer' | 'supplier' | 'dyer';
  name: string;
  phone: string;
  address: string;
  cnic?: string;
  openingBalance: number;
  currentBalance: number;
  creditDays: number;
}

export interface InvoiceLine {
  itemId: string;
  qty: number;
  unit: Item['unit'];
  rate: number;
  amount: number;
}

export interface SalesInvoice {
  id: string;
  serial: string;
  date: string;
  customerId: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paid: number;
  balance: number;
  paymentMode: 'cash' | 'credit' | 'partial';
  notes?: string;
}

export interface PurchaseVoucher {
  id: string;
  serial: string;
  date: string;
  supplierId: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paid: number;
  balance: number;
  paymentMode: 'cash' | 'credit' | 'partial';
  notes?: string;
}

export interface DyeingVoucher {
  id: string;
  serial: string;
  date: string;
  dyerId: string;
  greyItemId: string;
  dyedItemId: string;
  qtyIn: number;
  qtyOut: number;
  ratePerMeter: number;
  totalValue: number;
  paid?: number;
  balance?: number;
  paymentMode?: 'cash' | 'credit' | 'partial';
  remarks?: string;
}

export interface ExpenseVoucher {
  id: string;
  date: string;
  accountId: string;
  amount: number;
  description: string;
  paidFrom: 'cash' | 'bank';
}

export interface Employee {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  address: string;
  role: string;
  joiningDate: string;
  salaryType: 'monthly' | 'daily';
  salaryAmount: number;
  deductForAbsence: boolean;
  active: boolean;
  photoUrl?: string;
}

export interface AttendanceRecord {
  date: string;
  employeeId: string;
  status: 'P' | 'A' | 'H' | 'L';
}

export interface Advance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface PayrollRun {
  month: string;
  employeeId: string;
  basicSalary: number;
  presentDays: number;
  absenceDeduction: number;
  advances: number;
  bonus: number;
  deduction: number;
  netPay: number;
  slipGenerated: boolean;
}

export interface Location {
  id: string;
  name: string;
  type: 'shop' | 'packing' | 'dyer' | 'other';
}

export interface StockTransfer {
  id: string;
  serial: string;
  date: string;
  fromLocationId: string;
  toLocationId: string;
  itemId: string;
  qty: number;
  unit: Item['unit'];
  rate: number;
  amount: number;
  notes?: string;
}

export interface ReceiptVoucher {
  id: string;
  serial: string;
  date: string;
  partyId: string;
  amount: number;
  receivedIn: 'cash' | 'bank';
  bankAccountId?: string;
  description: string;
}

export interface PaymentVoucher {
  id: string;
  serial: string;
  date: string;
  partyId: string;
  amount: number;
  paidFrom: 'cash' | 'bank';
  bankAccountId?: string;
  description: string;
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

export interface JournalVoucher {
  id: string;
  serial: string;
  date: string;
  narration: string;
  lines: JournalLine[];
}

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'cashier' | 'accountant';
  displayName: string;
  active: boolean;
}
