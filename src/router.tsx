import { createRouter, createRoute, createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { storage } from '@/lib/storage';
import { Shell } from '@/components/layout/Shell';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CoaPage } from '@/features/coa/CoaPage';
import { ItemsPage } from '@/features/items/ItemsPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { CustomerLedgerPage } from '@/features/customers/CustomerLedgerPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { SupplierLedgerPage } from '@/features/suppliers/SupplierLedgerPage';
import { SalesListPage } from '@/features/sales/SalesListPage';
import { NewInvoicePage } from '@/features/sales/NewInvoicePage';
import { PurchaseListPage } from '@/features/purchase/PurchaseListPage';
import { NewPurchasePage } from '@/features/purchase/NewPurchasePage';
import { DyeingListPage } from '@/features/dyeing/DyeingListPage';
import { NewDyeingPage } from '@/features/dyeing/NewDyeingPage';
import { ExpensesPage } from '@/features/expenses/ExpensesPage';
import { EmployeesPage } from '@/features/employees/EmployeesPage';
import { AttendancePage } from '@/features/attendance/AttendancePage';
import { PayrollPage } from '@/features/payroll/PayrollPage';
import { DayBookPage } from '@/features/reports/DayBookPage';
import { LedgerReportPage } from '@/features/reports/LedgerReportPage';
import { TrialBalancePage } from '@/features/reports/TrialBalancePage';
import { ProfitLossPage } from '@/features/reports/ProfitLossPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { LocationsPage } from '@/features/locations/LocationsPage';
import { StockTransferPage } from '@/features/stockTransfer/StockTransferPage';
import { ReceiptPaymentPage } from '@/features/vouchers/ReceiptPaymentPage';
import { JournalVoucherPage } from '@/features/vouchers/JournalVoucherPage';
import { CashBookPage } from '@/features/reports/CashBookPage';
import { StockReportPage } from '@/features/reports/StockReportPage';
import { DebtorsReportPage } from '@/features/reports/DebtorsReportPage';
import { TrialBalance4ColPage } from '@/features/reports/TrialBalance4ColPage';
import { ManageUsersPage } from '@/features/settings/ManageUsersPage';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_shell',
  component: Shell,
  beforeLoad: () => {
    if (!storage.get('currentUser')) throw redirect({ to: '/login' });
  },
});

const dashboardRoute   = createRoute({ getParentRoute: () => shellRoute, path: '/',          component: DashboardPage });
const coaRoute         = createRoute({ getParentRoute: () => shellRoute, path: '/coa',        component: CoaPage });
const itemsRoute       = createRoute({ getParentRoute: () => shellRoute, path: '/items',      component: ItemsPage });
const customersRoute   = createRoute({ getParentRoute: () => shellRoute, path: '/customers',  component: CustomersPage });
const customerLedger   = createRoute({ getParentRoute: () => shellRoute, path: '/customers/$id', component: CustomerLedgerPage });
const suppliersRoute   = createRoute({ getParentRoute: () => shellRoute, path: '/suppliers',  component: SuppliersPage });
const supplierLedger   = createRoute({ getParentRoute: () => shellRoute, path: '/suppliers/$id', component: SupplierLedgerPage });
const salesRoute       = createRoute({ getParentRoute: () => shellRoute, path: '/sales',      component: SalesListPage });
const newSaleRoute     = createRoute({ getParentRoute: () => shellRoute, path: '/sales/new',  component: NewInvoicePage });
const editSaleRoute    = createRoute({ getParentRoute: () => shellRoute, path: '/sales/$id',  component: NewInvoicePage });
const purchaseRoute    = createRoute({ getParentRoute: () => shellRoute, path: '/purchase',   component: PurchaseListPage });
const newPurchaseRoute = createRoute({ getParentRoute: () => shellRoute, path: '/purchase/new', component: NewPurchasePage });
const editPurchaseRoute= createRoute({ getParentRoute: () => shellRoute, path: '/purchase/$id', component: NewPurchasePage });
const dyeingRoute      = createRoute({ getParentRoute: () => shellRoute, path: '/dyeing',     component: DyeingListPage });
const newDyeingRoute   = createRoute({ getParentRoute: () => shellRoute, path: '/dyeing/new', component: NewDyeingPage });
const editDyeingRoute  = createRoute({ getParentRoute: () => shellRoute, path: '/dyeing/$id', component: NewDyeingPage });
const expensesRoute    = createRoute({ getParentRoute: () => shellRoute, path: '/expenses',   component: ExpensesPage });
const employeesRoute   = createRoute({ getParentRoute: () => shellRoute, path: '/employees',  component: EmployeesPage });
const attendanceRoute  = createRoute({ getParentRoute: () => shellRoute, path: '/attendance', component: AttendancePage });
const payrollRoute     = createRoute({ getParentRoute: () => shellRoute, path: '/payroll',    component: PayrollPage });
const dayBookRoute     = createRoute({ getParentRoute: () => shellRoute, path: '/reports/daybook',          component: DayBookPage });
const ledgerReportRoute= createRoute({ getParentRoute: () => shellRoute, path: '/reports/ledger',            component: LedgerReportPage });
const trialBalRoute    = createRoute({ getParentRoute: () => shellRoute, path: '/reports/trial-balance',     component: TrialBalancePage });
const trialBal4Route   = createRoute({ getParentRoute: () => shellRoute, path: '/reports/trial-balance-4col',component: TrialBalance4ColPage });
const plRoute          = createRoute({ getParentRoute: () => shellRoute, path: '/reports/profit-loss',       component: ProfitLossPage });
const cashBookRoute    = createRoute({ getParentRoute: () => shellRoute, path: '/reports/cashbook',          component: CashBookPage });
const stockReportRoute = createRoute({ getParentRoute: () => shellRoute, path: '/reports/stock',             component: StockReportPage });
const debtorsRoute     = createRoute({ getParentRoute: () => shellRoute, path: '/reports/debtors',           component: DebtorsReportPage });
const settingsRoute    = createRoute({ getParentRoute: () => shellRoute, path: '/settings',                  component: SettingsPage });
const locationsRoute   = createRoute({ getParentRoute: () => shellRoute, path: '/locations',                 component: LocationsPage });
const stockTransferRoute = createRoute({ getParentRoute: () => shellRoute, path: '/stock-transfer',          component: StockTransferPage });
const receiptPayRoute  = createRoute({ getParentRoute: () => shellRoute, path: '/vouchers/receipt-payment',  component: ReceiptPaymentPage });
const journalRoute     = createRoute({ getParentRoute: () => shellRoute, path: '/vouchers/journal',          component: JournalVoucherPage });
const manageUsersRoute = createRoute({ getParentRoute: () => shellRoute, path: '/settings/users',            component: ManageUsersPage });

const routeTree = rootRoute.addChildren([
  loginRoute,
  shellRoute.addChildren([
    dashboardRoute, coaRoute, itemsRoute,
    customersRoute, customerLedger,
    suppliersRoute, supplierLedger,
    salesRoute, newSaleRoute, editSaleRoute,
    purchaseRoute, newPurchaseRoute, editPurchaseRoute,
    dyeingRoute, newDyeingRoute, editDyeingRoute,
    expensesRoute, employeesRoute, attendanceRoute, payrollRoute,
    locationsRoute, stockTransferRoute,
    receiptPayRoute, journalRoute,
    dayBookRoute, ledgerReportRoute, trialBalRoute, trialBal4Route, plRoute,
    cashBookRoute, stockReportRoute, debtorsRoute,
    settingsRoute, manageUsersRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
