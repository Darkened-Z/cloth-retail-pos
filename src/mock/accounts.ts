import type { AccountMaster, AccountSub, Account } from '@/types';

export const mockAccountMasters: AccountMaster[] = [
  { id: 'AM1', nature: 'Capital',      name: 'OWNER CAPITAL' },
  { id: 'AM2', nature: 'Liabilities',  name: 'CURRENT LIABILITIES' },
  { id: 'AM3', nature: 'Liabilities',  name: 'NON CURRENT LIABILITIES' },
  { id: 'AM4', nature: 'Assets',       name: 'CURRENT ASSETS' },
  { id: 'AM5', nature: 'Assets',       name: 'NON CURRENT ASSETS' },
  { id: 'AM6', nature: 'Incomes',      name: 'INCOMES' },
  { id: 'AM7', nature: 'Expenses',     name: 'COST OF SALES' },
  { id: 'AM8', nature: 'Expenses',     name: 'OPERATING EXPENSES' },
];

export const mockAccountSubs: AccountSub[] = [
  { id: 'AS10', masterId: 'AM1', name: 'Capital Account' },
  { id: 'AS20', masterId: 'AM2', name: 'Creditors' },
  { id: 'AS21', masterId: 'AM2', name: 'Accrued Expenses' },
  { id: 'AS30', masterId: 'AM3', name: 'Long-term Loans' },
  { id: 'AS40', masterId: 'AM4', name: 'Debtors' },
  { id: 'AS41', masterId: 'AM4', name: 'Cash & Bank' },
  { id: 'AS42', masterId: 'AM4', name: 'Stock in Trade' },
  { id: 'AS50', masterId: 'AM5', name: 'Fixed Assets' },
  { id: 'AS60', masterId: 'AM6', name: 'Sales Revenue' },
  { id: 'AS61', masterId: 'AM6', name: 'Other Income' },
  { id: 'AS70', masterId: 'AM7', name: 'Purchase' },
  { id: 'AS71', masterId: 'AM7', name: 'Dyeing Cost' },
  { id: 'AS80', masterId: 'AM8', name: 'Salaries' },
  { id: 'AS81', masterId: 'AM8', name: 'Utilities' },
  { id: 'AS82', masterId: 'AM8', name: 'Rent' },
  { id: 'AS83', masterId: 'AM8', name: 'Miscellaneous' },
];

export const mockAccounts: Account[] = [
  { id: 'A100', subId: 'AS10', name: "Owner's Capital",        openingBalance: 4500000, currentBalance: 4500000 },
  { id: 'A200', subId: 'AS20', name: 'Trade Creditors',       openingBalance: 160000,  currentBalance: 160000 },
  { id: 'A210', subId: 'AS21', name: 'Accrued Rent',          openingBalance: 0,       currentBalance: 0 },
  { id: 'A300', subId: 'AS30', name: 'Bank Loan',             openingBalance: 300000,  currentBalance: 300000 },
  { id: 'A400', subId: 'AS40', name: 'Trade Debtors',         openingBalance: 1135000, currentBalance: 1135000 },
  { id: 'A410', subId: 'AS41', name: 'Cash in Hand',          openingBalance: 125000,  currentBalance: 125000 },
  { id: 'A411', subId: 'AS41', name: 'Bank — HBL',            openingBalance: 450000,  currentBalance: 450000 },
  { id: 'A420', subId: 'AS42', name: 'Fabric Stock',          openingBalance: 3000000, currentBalance: 3000000 },
  { id: 'A500', subId: 'AS50', name: 'Furniture & Fixtures',  openingBalance: 150000,  currentBalance: 150000 },
  { id: 'A501', subId: 'AS50', name: 'Computer & Equipment',  openingBalance: 100000,  currentBalance: 100000 },
  { id: 'A600', subId: 'AS60', name: 'Fabric Sales',          openingBalance: 0,       currentBalance: 0 },
  { id: 'A700', subId: 'AS70', name: 'Fabric Purchases',      openingBalance: 0,       currentBalance: 0 },
  { id: 'A710', subId: 'AS71', name: 'Dyeing Charges',        openingBalance: 0,       currentBalance: 0 },
  { id: 'A800', subId: 'AS80', name: 'Staff Salaries',        openingBalance: 0,       currentBalance: 0 },
  { id: 'A810', subId: 'AS81', name: 'Electricity Bill',      openingBalance: 0,       currentBalance: 0 },
  { id: 'A811', subId: 'AS81', name: 'Gas Bill',              openingBalance: 0,       currentBalance: 0 },
  { id: 'A820', subId: 'AS82', name: 'Shop Rent',             openingBalance: 0,       currentBalance: 0 },
  { id: 'A830', subId: 'AS83', name: 'Miscellaneous Expense', openingBalance: 0,       currentBalance: 0 },
];
