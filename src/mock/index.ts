import { storage } from '@/lib/storage';
import { mockShop } from './shop';
import { mockUsers } from './users';
import { mockAccountMasters, mockAccountSubs, mockAccounts } from './accounts';
import { mockItemMasters, mockItemSubs, mockItems } from './items';
import { mockParties } from './parties';
import { mockInvoices } from './invoices';
import { mockPurchaseVouchers } from './purchase';
import { mockDyeingVouchers } from './dyeing';
import { mockExpenses } from './expenses';
import { mockEmployees } from './employees';
import { mockAttendance } from './attendance';
import { mockLocations } from './locations';
import { mockStockTransfers } from './stockTransfers';
import { mockReceiptVouchers, mockPaymentVouchers } from './vouchers';
import { mockJournalVouchers } from './journals';

export {
  mockShop, mockUsers,
  mockAccountMasters, mockAccountSubs, mockAccounts,
  mockItemMasters, mockItemSubs, mockItems,
  mockParties,
  mockInvoices,
  mockPurchaseVouchers,
  mockDyeingVouchers,
  mockExpenses,
  mockEmployees,
  mockAttendance,
  mockLocations,
  mockStockTransfers,
  mockReceiptVouchers,
  mockPaymentVouchers,
  mockJournalVouchers,
};

export function seedAll() {
  if (storage.get('seeded_v5')) return;
  storage.set('shop', mockShop);
  storage.set('users', mockUsers);
  storage.set('accountMasters', mockAccountMasters);
  storage.set('accountSubs', mockAccountSubs);
  storage.set('accounts', mockAccounts);
  storage.set('itemMasters', mockItemMasters);
  storage.set('itemSubs', mockItemSubs);
  storage.set('items', mockItems);
  storage.set('parties', mockParties);
  storage.set('invoices', mockInvoices);
  storage.set('purchaseVouchers', mockPurchaseVouchers);
  storage.set('dyeingVouchers', mockDyeingVouchers);
  storage.set('expenses', mockExpenses);
  storage.set('employees', mockEmployees);
  storage.set('attendance', mockAttendance);
  storage.set('advances', []);
  storage.set('payrollRuns', []);
  storage.set('locations', mockLocations);
  storage.set('stockTransfers', mockStockTransfers);
  storage.set('receiptVouchers', mockReceiptVouchers);
  storage.set('paymentVouchers', mockPaymentVouchers);
  storage.set('journalVouchers', mockJournalVouchers);
  storage.set('seeded_v5', true);
}

export function resetAll() {
  storage.clear();
  seedAll();
  window.location.reload();
}
