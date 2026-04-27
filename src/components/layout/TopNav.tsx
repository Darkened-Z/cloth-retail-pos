import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/cn';

const NAV_ITEMS = [
  { label: 'HOME', path: '/' },
  { label: 'BASIC DATA', children: [
    { label: 'Chart of Accounts', path: '/coa' },
    { label: 'Items', path: '/items' },
    { label: 'Locations', path: '/locations' },
    { label: 'Customers', path: '/customers' },
    { label: 'Suppliers & Dyers', path: '/suppliers' },
    { label: 'Employees', path: '/employees' },
  ]},
  { label: 'TRANSACTIONS', children: [
    { label: 'Sales Invoice', path: '/sales' },
    { label: 'Purchase Voucher', path: '/purchase' },
    { label: 'Dyeing Voucher', path: '/dyeing' },
    { label: 'Stock Transfer', path: '/stock-transfer' },
    { label: 'Receipt / Payment', path: '/vouchers/receipt-payment' },
    { label: 'Journal Voucher', path: '/vouchers/journal' },
    { label: 'Expenses', path: '/expenses' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'Payroll', path: '/payroll' },
  ]},
  { label: 'REPORTS', children: [
    { label: 'Day Book', path: '/reports/daybook' },
    { label: 'Cash Book', path: '/reports/cashbook' },
    { label: 'Ledger', path: '/reports/ledger' },
    { label: 'Trial Balance', path: '/reports/trial-balance' },
    { label: 'Trial Balance 4-Col', path: '/reports/trial-balance-4col' },
    { label: 'Profit & Loss', path: '/reports/profit-loss' },
    { label: 'Stock / Item Ledger', path: '/reports/stock' },
    { label: 'Debtors Report', path: '/reports/debtors' },
  ]},
  { label: 'SETTINGS', children: [
    { label: 'Shop Settings', path: '/settings' },
    { label: 'Manage Users', path: '/settings/users' },
  ]},
];

export function TopNav({ currentPath }: { currentPath: string }) {
  const navigate = useNavigate();
  return (
    <nav className="border-b-2 border-black bg-white flex">
      {NAV_ITEMS.map((item) => (
        item.children ? (
          <div key={item.label} className="relative group">
            <button className={cn(
              'px-4 py-2.5 text-xs font-sans font-semibold uppercase tracking-wider border-r-2 border-black hover:bg-black hover:text-white transition-colors',
              item.children.some(c => c.path === currentPath) && 'bg-black text-white'
            )}>
              {item.label} ▾
            </button>
            <div className="absolute top-full left-0 hidden group-hover:flex flex-col z-50 border-2 border-black bg-white shadow-brutal min-w-[200px]">
              {item.children.map(child => (
                <button
                  key={child.path}
                  onClick={() => navigate({ to: child.path as string })}
                  className={cn(
                    'px-4 py-2.5 text-xs font-sans text-left border-b border-black last:border-0 hover:bg-accent hover:text-black transition-colors whitespace-nowrap',
                    currentPath === child.path && 'bg-accent'
                  )}
                >
                  {child.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            key={item.label}
            onClick={() => navigate({ to: item.path as string })}
            className={cn(
              'px-4 py-2.5 text-xs font-sans font-semibold uppercase tracking-wider border-r-2 border-black hover:bg-black hover:text-white transition-colors',
              currentPath === item.path && 'bg-black text-white'
            )}
          >
            {item.label}
          </button>
        )
      ))}
    </nav>
  );
}
