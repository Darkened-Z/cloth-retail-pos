const EN: Record<string, string> = {
  customer: 'Customer', customers: 'Customers', supplier: 'Supplier', suppliers: 'Suppliers',
  dyer: 'Dyer', dyers: 'Dyers', sales: 'Sales', purchase: 'Purchase', dyeing: 'Dyeing',
  expenses: 'Expenses', employees: 'Employees', attendance: 'Attendance', payroll: 'Payroll',
  reports: 'Reports', settings: 'Settings', dashboard: 'Dashboard', logout: 'Log Out',
  newInvoice: 'New Invoice', newPurchase: 'New Purchase', newDyeing: 'New Dyeing',
  newExpense: 'New Expense', newCustomer: 'New Customer', save: 'Save', cancel: 'Cancel',
  delete: 'Delete', edit: 'Edit', print: 'Print', download: 'Download', search: 'Search',
  name: 'Name', phone: 'Phone', address: 'Address', balance: 'Balance', dues: 'Dues',
  date: 'Date', amount: 'Amount', qty: 'Qty', rate: 'Rate', unit: 'Unit', item: 'Item',
  subtotal: 'Subtotal', discount: 'Discount', grandTotal: 'Grand Total', paid: 'Paid',
  unpaid: 'Unpaid', partial: 'Partial', cash: 'Cash', credit: 'Credit', bank: 'Bank',
  serial: 'Serial', invoice: 'Invoice', voucher: 'Voucher', ledger: 'Ledger',
  stock: 'Stock', minStock: 'Min Stock', purchasePrice: 'Purchase Price', salePrice: 'Sale Price',
  meter: 'Meter', yard: 'Yard', thaan: 'Thaan', salary: 'Salary', advance: 'Advance',
  bonus: 'Bonus', deduction: 'Deduction', netPay: 'Net Pay', present: 'Present',
  absent: 'Absent', half: 'Half Day', leave: 'Leave', todaySales: "Today's Sales",
  todayCollection: "Today's Collection", totalDues: 'Total Dues', cashInHand: 'Cash in Hand',
  recentTransactions: 'Recent Transactions', lowStock: 'Low Stock', overdue: 'Overdue',
  shopInfo: 'Shop Info', invoiceBranding: 'Invoice Branding', language: 'Language',
  users: 'Users', dangerZone: 'Danger Zone', resetData: 'Reset Demo Data',
  chartOfAccounts: 'Chart of Accounts', items: 'Items', login: 'Login',
  username: 'Username', password: 'Password', signIn: 'Sign In',
  home: 'Home', basicData: 'Basic Data', transactions: 'Transactions',
  nature: 'Nature', master: 'Master', sub: 'Sub', account: 'Account',
  capital: 'Capital', liabilities: 'Liabilities', assets: 'Assets', incomes: 'Incomes',
  opening: 'Opening', current: 'Current', remarks: 'Remarks', description: 'Description',
  month: 'Month', year: 'Year', today: 'Today', week: 'Week', custom: 'Custom',
  dayBook: 'Day Book', trialBalance: 'Trial Balance', profitLoss: 'Profit & Loss',
  locations: 'Locations', stockTransfer: 'Stock Transfer', receiptPayment: 'Receipt / Payment',
  journalVoucher: 'Journal Voucher', cashBook: 'Cash Book', stockReport: 'Stock / Item Ledger',
  debtorsReport: 'Debtors Report', trialBalance4Col: 'Trial Balance 4-Col',
  generalJournal: 'General Journal', salesReport: 'Sales Report', purchaseReport: 'Purchase Report',
  salesReportDatewise: 'Sales Report Datewise', salesReportPartywise: 'Sales Report Partywise', salesReportItemwise: 'Sales Report Itemwise',
  purchaseReportDatewise: 'Purchase Report Datewise', purchaseReportPartywise: 'Purchase Report Partywise', purchaseReportItemwise: 'Purchase Report Itemwise',
  shopSettings: 'Shop Settings', manageUsers: 'Manage Users', suppliersDyers: 'Suppliers & Dyers',
};

const UR: Record<string, string> = {
  customer: 'گاہک', customers: 'گاہکان', supplier: 'سپلائر', suppliers: 'سپلائرز',
  dyer: 'ڈائر', dyers: 'ڈائرز', sales: 'فروخت', purchase: 'خریداری', dyeing: 'رنگائی',
  expenses: 'اخراجات', employees: 'ملازمین', attendance: 'حاضری', payroll: 'تنخواہ',
  reports: 'رپورٹس', settings: 'ترتیبات', dashboard: 'ڈیش بورڈ', logout: 'لاگ آؤٹ',
  newInvoice: 'نیا بل', newPurchase: 'نئی خریداری', newDyeing: 'نئی رنگائی',
  newExpense: 'نیا خرچ', newCustomer: 'نیا گاہک', save: 'محفوظ کریں', cancel: 'منسوخ',
  delete: 'حذف', edit: 'ترمیم', print: 'پرنٹ', download: 'ڈاؤن لوڈ', search: 'تلاش',
  name: 'نام', phone: 'فون', address: 'پتہ', balance: 'بیلنس', dues: 'واجبات',
  date: 'تاریخ', amount: 'رقم', qty: 'مقدار', rate: 'نرخ', unit: 'اکائی', item: 'آئٹم',
  subtotal: 'ذیلی کل', discount: 'رعایت', grandTotal: 'کل رقم', paid: 'ادا شدہ',
  unpaid: 'غیر ادا شدہ', partial: 'جزوی', cash: 'نقد', credit: 'ادھار', bank: 'بینک',
  serial: 'نمبر', invoice: 'بل', voucher: 'واؤچر', ledger: 'کھاتہ',
  stock: 'اسٹاک', minStock: 'کم از کم اسٹاک', purchasePrice: 'قیمت خرید', salePrice: 'قیمت فروخت',
  meter: 'میٹر', yard: 'گز', thaan: 'تھان', salary: 'تنخواہ', advance: 'پیشگی',
  bonus: 'بونس', deduction: 'کٹوتی', netPay: 'خالص تنخواہ', present: 'حاضر',
  absent: 'غیر حاضر', half: 'نصف', leave: 'چھٹی', todaySales: 'آج کی فروخت',
  todayCollection: 'آج کی وصولی', totalDues: 'کل واجبات', cashInHand: 'نقد رقم',
  recentTransactions: 'حالیہ لین دین', lowStock: 'کم اسٹاک', overdue: 'واجب الادا',
  shopInfo: 'دکان کی معلومات', invoiceBranding: 'بل برانڈنگ', language: 'زبان',
  users: 'صارفین', dangerZone: 'خطرناک زون', resetData: 'ڈیٹا ری سیٹ کریں',
  chartOfAccounts: 'کھاتوں کی فہرست', items: 'اشیاء', login: 'لاگ ان',
  username: 'صارف نام', password: 'پاس ورڈ', signIn: 'داخل ہوں',
  home: 'ہوم', basicData: 'بنیادی ڈیٹا', transactions: 'لین دین',
  nature: 'نوعیت', master: 'ماسٹر', sub: 'ذیلی', account: 'کھاتہ',
  capital: 'سرمایہ', liabilities: 'واجبات', assets: 'اثاثے', incomes: 'آمدنی',
  opening: 'ابتدائی', current: 'موجودہ', remarks: 'کیفیت', description: 'تفصیل',
  month: 'مہینہ', year: 'سال', today: 'آج', week: 'ہفتہ', custom: 'کسٹم',
  dayBook: 'روز نامچہ', trialBalance: 'آزمائشی توازن', profitLoss: 'نفع نقصان',
  locations: 'مقامات', stockTransfer: 'اسٹاک منتقلی', receiptPayment: 'وصولی / ادائیگی',
  journalVoucher: 'جرنل واؤچر', cashBook: 'کیش بک', stockReport: 'اسٹاک کھاتہ',
  debtorsReport: 'قرض خواہ رپورٹ', trialBalance4Col: '4 کالم آزمائشی توازن',
  generalJournal: 'جنرل جرنل', salesReport: 'فروخت رپورٹ', purchaseReport: 'خریداری رپورٹ',
  salesReportDatewise: 'فروخت رپورٹ تاریخ وار', salesReportPartywise: 'فروخت رپورٹ کھاتہ دار وار', salesReportItemwise: 'فروخت رپورٹ آئٹم وار',
  purchaseReportDatewise: 'خریداری رپورٹ تاریخ وار', purchaseReportPartywise: 'خریداری رپورٹ کھاتہ دار وار', purchaseReportItemwise: 'خریداری رپورٹ آئٹم وار',
  shopSettings: 'دکان کی ترتیبات', manageUsers: 'صارفین کا انتظام', suppliersDyers: 'سپلائرز اور ڈائرز',
};

export type LangMode = 'en' | 'ur' | 'dual';

let _mode: LangMode = 'en';
export function setLang(m: LangMode) { _mode = m; }
export function getLang(): LangMode { return _mode; }

export function t(key: string, mode?: LangMode): string {
  const m = mode ?? _mode;
  if (m === 'en') return EN[key] ?? key;
  if (m === 'ur') return UR[key] ?? key;
  const en = EN[key] ?? key;
  const ur = UR[key];
  return ur ? `${en} / ${ur}` : en;
}
