import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/cn';
import { t, type LangMode } from '@/lib/i18n';
import { useShop } from '@/stores/useShop';
import { Home, Database, Receipt, BarChart3, Settings, ChevronDown } from 'lucide-react';

export interface NavChild {
  key: string;
  subKey?: string;
  path: string;
}

export interface NavItem {
  key: string;
  path?: string;
  icon: any;
  children?: NavChild[];
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', path: '/', icon: Home },
  { key: 'basicData', icon: Database, children: [
    { key: 'chartOfAccounts', path: '/coa' },
    { key: 'items', path: '/items' },
    { key: 'locations', path: '/locations' },
    { key: 'customers', path: '/customers' },
    { key: 'suppliersDyers', path: '/suppliers' },
    { key: 'employees', path: '/employees' },
  ]},
  { key: 'transactions', icon: Receipt, children: [
    { key: 'sales', subKey: 'invoice', path: '/sales' },
    { key: 'purchase', subKey: 'voucher', path: '/purchase' },
    { key: 'dyeing', subKey: 'voucher', path: '/dyeing' },
    { key: 'stockTransfer', path: '/stock-transfer' },
    { key: 'receiptPayment', path: '/vouchers/receipt-payment' },
    { key: 'journalVoucher', path: '/vouchers/journal' },
    { key: 'expenses', path: '/expenses' },
    { key: 'attendance', path: '/attendance' },
    { key: 'payroll', path: '/payroll' },
  ]},
  { key: 'reports', icon: BarChart3, children: [
    { key: 'dayBook', path: '/reports/daybook' },
    { key: 'cashBook', path: '/reports/cashbook' },
    { key: 'generalJournal', path: '/reports/general-journal' },
    { key: 'salesReport', path: '/reports/sales-report' },
    { key: 'purchaseReport', path: '/reports/purchase-report' },
    { key: 'ledger', path: '/reports/ledger' },
    { key: 'trialBalance', path: '/reports/trial-balance' },
    { key: 'trialBalance4Col', path: '/reports/trial-balance-4col' },
    { key: 'profitLoss', path: '/reports/profit-loss' },
    { key: 'stockReport', path: '/reports/stock' },
    { key: 'debtorsReport', path: '/reports/debtors' },
  ]},
  { key: 'settings', icon: Settings, children: [
    { key: 'shopSettings', path: '/settings' },
    { key: 'manageUsers', path: '/settings/users' },
  ]},
];

export function formatChildLabel(child: NavChild, lang: LangMode): string {
  if (!child.subKey) return t(child.key, lang);
  if (lang === 'en') return `${t(child.key, 'en')} ${t(child.subKey, 'en')}`;
  if (lang === 'ur') return `${t(child.key, 'ur')} ${t(child.subKey, 'ur')}`;
  return `${t(child.key, 'en')} ${t(child.subKey, 'en')} / ${t(child.key, 'ur')} ${t(child.subKey, 'ur')}`;
}

export function TopNav({ currentPath, lang }: { currentPath: string; lang?: LangMode }) {
  const navigate = useNavigate();
  const { shop } = useShop();
  const activeLang: LangMode = lang ?? shop.language ?? 'en';
  const [openKey, setOpenKey] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenKey(null);
  }, [currentPath]);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenKey(null);
      }
    }
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  return (
    <nav ref={navRef} className="hidden md:flex border-b-2 border-black bg-white flex-wrap print:hidden sticky top-0 z-30">
      {NAV_ITEMS.map((item) => {
        const topLabel = t(item.key, activeLang);
        const Icon = item.icon;
        const isActiveGroup = item.children
          ? item.children.some(c => currentPath === c.path || currentPath.startsWith(c.path + '/'))
          : currentPath === item.path;
        const isOpen = openKey === item.key;

        return item.children ? (
          <div
            key={item.key}
            className="relative group"
            onMouseEnter={() => setOpenKey(item.key)}
            onMouseLeave={() => setOpenKey(prev => (prev === item.key ? null : prev))}
          >
            <button
              type="button"
              onClick={() => setOpenKey(prev => (prev === item.key ? null : item.key))}
              className={cn(
                'px-4 py-3 text-sm font-sans font-bold uppercase tracking-wider border-r-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2',
                isActiveGroup && 'bg-black text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{topLabel}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
            </button>
            <div
              className={cn(
                'absolute top-full left-0 flex-col z-50 border-2 border-black bg-white shadow-brutal min-w-[240px]',
                isOpen ? 'flex' : 'hidden group-hover:flex'
              )}
            >
              {item.children.map(child => {
                const childActive = currentPath === child.path || currentPath.startsWith(child.path + '/');
                return (
                  <button
                    key={child.path}
                    type="button"
                    onClick={() => {
                      setOpenKey(null);
                      navigate({ to: child.path as string });
                    }}
                    className={cn(
                      'px-4 py-3 text-sm font-sans font-medium text-left border-b border-black/20 last:border-0 hover:bg-accent hover:text-black transition-colors whitespace-nowrap flex items-center justify-between gap-3',
                      childActive && 'bg-accent font-bold'
                    )}
                  >
                    <span>{formatChildLabel(child, activeLang)}</span>
                    {childActive && <span className="w-2 h-2 bg-black shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate({ to: item.path as string })}
            className={cn(
              'px-4 py-3 text-sm font-sans font-bold uppercase tracking-wider border-r-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-2',
              isActiveGroup && 'bg-black text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{topLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
