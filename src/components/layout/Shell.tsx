import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/stores/useAuth';
import { useShop } from '@/stores/useShop';
import { setLang, t, type LangMode } from '@/lib/i18n';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { TopNav, NAV_ITEMS, formatChildLabel } from './TopNav';
import { ShortcutFooter } from './ShortcutFooter';
import { Menu, X, Search, HelpCircle, LogOut, Home, Receipt, Users, BarChart3, PlusCircle, Globe } from 'lucide-react';

interface PaletteRoute {
  label: string;
  category: string;
  path: string;
  shortcut?: string;
}

const APP_ROUTES: PaletteRoute[] = [
  { label: 'Dashboard / Home', category: 'HOME', path: '/' },
  { label: 'Chart of Accounts', category: 'BASIC DATA', path: '/coa' },
  { label: 'Items', category: 'BASIC DATA', path: '/items' },
  { label: 'Locations', category: 'BASIC DATA', path: '/locations' },
  { label: 'Customers', category: 'BASIC DATA', path: '/customers', shortcut: 'C' },
  { label: 'Suppliers & Dyers', category: 'BASIC DATA', path: '/suppliers' },
  { label: 'Employees', category: 'BASIC DATA', path: '/employees' },
  { label: 'Sales Invoice List', category: 'TRANSACTIONS', path: '/sales' },
  { label: 'New Sales Invoice', category: 'TRANSACTIONS', path: '/sales/new', shortcut: 'N' },
  { label: 'Purchase Voucher List', category: 'TRANSACTIONS', path: '/purchase' },
  { label: 'New Purchase Voucher', category: 'TRANSACTIONS', path: '/purchase/new' },
  { label: 'Dyeing Voucher List', category: 'TRANSACTIONS', path: '/dyeing' },
  { label: 'New Dyeing Voucher', category: 'TRANSACTIONS', path: '/dyeing/new', shortcut: 'D' },
  { label: 'Stock Transfer', category: 'TRANSACTIONS', path: '/stock-transfer' },
  { label: 'Receipt / Payment Voucher', category: 'TRANSACTIONS', path: '/vouchers/receipt-payment' },
  { label: 'Journal Voucher', category: 'TRANSACTIONS', path: '/vouchers/journal' },
  { label: 'Expenses', category: 'TRANSACTIONS', path: '/expenses', shortcut: 'E' },
  { label: 'Attendance', category: 'TRANSACTIONS', path: '/attendance' },
  { label: 'Payroll', category: 'TRANSACTIONS', path: '/payroll' },
  { label: 'Day Book', category: 'REPORTS', path: '/reports/daybook' },
  { label: 'Cash Book', category: 'REPORTS', path: '/reports/cashbook' },
  { label: 'Ledger Report', category: 'REPORTS', path: '/reports/ledger' },
  { label: 'Trial Balance', category: 'REPORTS', path: '/reports/trial-balance' },
  { label: 'Trial Balance 4-Col', category: 'REPORTS', path: '/reports/trial-balance-4col' },
  { label: 'Profit & Loss', category: 'REPORTS', path: '/reports/profit-loss' },
  { label: 'Stock / Item Ledger', category: 'REPORTS', path: '/reports/stock' },
  { label: 'Debtors Report', category: 'REPORTS', path: '/reports/debtors' },
  { label: 'Shop Settings', category: 'SETTINGS', path: '/settings' },
  { label: 'Manage Users', category: 'SETTINGS', path: '/settings/users' },
];

const SHORTCUT_DOCS = [
  { key: 'Enter', desc: 'Move to next field / Submit active form' },
  { key: 'Esc', desc: 'Cancel / Close active modal or form' },
  { key: 'F9', desc: 'Save current invoice, voucher, or form' },
  { key: 'F1', desc: 'Toggle Keyboard Shortcuts Help modal' },
  { key: 'F2', desc: 'Edit selected record / Quick party focus' },
  { key: 'F3', desc: 'Quick search / Focus item or filter input' },
  { key: 'Ctrl+N', desc: 'Create new record / New invoice or voucher' },
  { key: 'Ctrl+P', desc: 'Print current invoice, voucher, or report' },
  { key: 'Ctrl+S', desc: 'Save current form or download PDF' },
  { key: 'Ctrl+K', desc: 'Open Command Palette (Quick Route Navigation)' },
  { key: 'Ctrl+D', desc: 'Duplicate line item in sales invoice' },
  { key: 'N / D / E / C', desc: 'Dashboard quick keys: New Invoice (N), Dyeing (D), Expenses (E), Customers (C)' },
];

export function Shell() {
  const { user, logout } = useAuth();
  const { shop, update: updateShop } = useShop();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const [showHelp, setShowHelp] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);

  useEffect(() => {
    setLang(shop.language);
  }, [shop.language]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const filteredRoutes = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return APP_ROUTES;
    return APP_ROUTES.filter(
      r =>
        r.label.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q)
    );
  }, [cmdQuery]);

  useKeyboardShortcuts({
    f1: () => setShowHelp(prev => !prev),
    'ctrl+k': () => {
      setShowCmd(prev => !prev);
      setCmdQuery('');
      setCmdIndex(0);
    },
    'ctrl+p': () => window.print(),
    escape: () => {
      if (showHelp) setShowHelp(false);
      if (showCmd) setShowCmd(false);
      if (mobileMenuOpen) setMobileMenuOpen(false);
    },
  });

  function selectRoute(path: string) {
    setShowCmd(false);
    setMobileMenuOpen(false);
    setCmdQuery('');
    navigate({ to: path as string });
  }

  function changeLang(lang: LangMode) {
    setLang(lang);
    updateShop({ language: lang });
  }

  const footerShortcuts = useMemo(() => {
    if (pathname === '/') {
      return [
        { key: 'N', label: 'New Invoice' },
        { key: 'D', label: 'New Dyeing' },
        { key: 'E', label: 'Expenses' },
        { key: 'C', label: 'Customers' },
        { key: 'Ctrl+N', label: 'New' },
        { key: 'F9', label: 'Save' },
        { key: 'Esc', label: 'Cancel' },
        { key: 'Ctrl+K', label: 'Command Palette' },
        { key: 'F1', label: 'Help' },
        { key: 'Ctrl+P', label: 'Print' },
      ];
    }
    return [
      { key: 'Ctrl+N', label: 'New' },
      { key: 'F9', label: 'Save' },
      { key: 'Esc', label: 'Cancel' },
      { key: 'Ctrl+K', label: 'Command Palette' },
      { key: 'F1', label: 'Help' },
      { key: 'Ctrl+P', label: 'Print' },
    ];
  }, [pathname]);

  const currentRouteMeta = APP_ROUTES.find(r => r.path === pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-black">
      {/* Header */}
      <header className="border-b-2 border-black bg-white px-3 sm:px-4 py-2 flex items-center justify-between gap-2 print:hidden sticky top-0 md:static z-40">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden border-2 border-black p-1.5 bg-accent hover:bg-black hover:text-white brutal-press shrink-0"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2.5 text-left min-w-0 group"
          >
            <span className="w-7 h-7 border-2 border-black bg-accent font-display text-xs flex items-center justify-center shrink-0 shadow-brutal-sm group-hover:bg-black group-hover:text-accent transition-colors">
              HF
            </span>
            <div className="min-w-0">
              <div className="font-display text-base sm:text-xl tracking-tight leading-none truncate">
                {shop.name}
              </div>
              <div className="hidden lg:block text-[11px] text-gray-500 font-mono uppercase truncate mt-0.5">
                {shop.address} {shop.phone ? `· ${shop.phone}` : ''}
              </div>
            </div>
          </button>
          {currentRouteMeta && (
            <span className="hidden xl:inline-flex items-center text-[10px] font-mono uppercase bg-muted border border-black px-2 py-0.5 ml-2">
              {currentRouteMeta.category} / <strong className="ml-1">{currentRouteMeta.label}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick Language Switcher */}
          <div className="hidden sm:flex border-2 border-black bg-white text-[10px] font-mono font-bold">
            {(['en', 'ur', 'dual'] as LangMode[]).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => changeLang(l)}
                className={`px-2 py-1 uppercase border-r border-black last:border-0 transition-colors ${
                  shop.language === l ? 'bg-black text-accent' : 'hover:bg-accent text-black'
                }`}
                title={`Language: ${l.toUpperCase()}`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCmd(true);
              setCmdQuery('');
              setCmdIndex(0);
            }}
            className="text-xs font-mono border-2 border-black px-2 sm:px-2.5 py-1 bg-white hover:bg-accent transition-colors brutal-press flex items-center gap-1.5"
            title="Open Command Palette (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">Ctrl+K</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="hidden sm:flex text-xs font-mono border-2 border-black px-2.5 py-1 bg-white hover:bg-accent transition-colors brutal-press items-center gap-1"
            title="Keyboard Shortcuts Help (F1)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-bold">F1</span>
          </button>

          <span className="hidden md:inline-flex items-center text-xs font-mono border-2 border-black bg-muted px-2.5 py-1 font-bold">
            {user?.displayName} <span className="text-gray-500 ml-1 uppercase text-[10px]">({user?.role})</span>
          </span>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate({ to: '/login' });
            }}
            className="text-xs font-mono border-2 border-black px-2 sm:px-3 py-1 bg-white hover:bg-danger hover:text-white transition-colors brutal-press uppercase flex items-center gap-1 font-bold"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">{t('logout', shop.language)}</span>
          </button>
        </div>
      </header>

      <TopNav currentPath={pathname} lang={shop.language} />

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden print:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs bg-white border-r-2 border-black h-full flex flex-col overflow-hidden shadow-brutal-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b-2 border-black bg-accent px-4 py-3 flex items-center justify-between">
              <div>
                <div className="font-display text-base leading-none">{shop.name}</div>
                <div className="font-mono text-[11px] mt-1">
                  {user?.displayName} · <span className="uppercase">{user?.role}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="border-2 border-black bg-white p-1 hover:bg-black hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Language Bar */}
            <div className="px-4 py-2.5 border-b-2 border-black bg-muted flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Language
              </span>
              <div className="flex border-2 border-black bg-white text-[11px] font-mono font-bold">
                {(['en', 'ur', 'dual'] as LangMode[]).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => changeLang(l)}
                    className={`px-2 py-0.5 uppercase border-r border-black last:border-0 ${
                      shop.language === l ? 'bg-black text-accent' : 'text-black'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Links */}
            <div className="flex-1 overflow-y-auto divide-y-2 divide-black">
              {NAV_ITEMS.map(section => {
                const Icon = section.icon;
                if (!section.children) {
                  const active = pathname === section.path;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => selectRoute(section.path!)}
                      className={`w-full px-4 py-3 text-left font-sans font-bold text-xs uppercase flex items-center gap-2.5 ${
                        active ? 'bg-black text-accent' : 'bg-white hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{t(section.key, shop.language)}</span>
                    </button>
                  );
                }
                return (
                  <div key={section.key} className="bg-white">
                    <div className="px-4 py-2 bg-muted/70 text-[11px] font-mono font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2 border-b border-black/20">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t(section.key, shop.language)}</span>
                    </div>
                    <div className="divide-y divide-black/10">
                      {section.children.map(child => {
                        const active = pathname === child.path || pathname.startsWith(child.path + '/');
                        return (
                          <button
                            key={child.path}
                            type="button"
                            onClick={() => selectRoute(child.path)}
                            className={`w-full px-5 py-2.5 text-left text-xs font-sans flex items-center justify-between ${
                              active ? 'bg-accent font-bold text-black' : 'hover:bg-muted text-gray-900'
                            }`}
                          >
                            <span>{formatChildLabel(child, shop.language)}</span>
                            {active && <span className="w-2 h-2 bg-black" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t-2 border-black p-3 bg-white flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowHelp(true);
                }}
                className="flex-1 border-2 border-black py-2 text-xs font-mono font-bold hover:bg-accent"
              >
                SHORTCUTS
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate({ to: '/login' });
                }}
                className="flex-1 border-2 border-black bg-danger text-white py-2 text-xs font-mono font-bold uppercase"
              >
                {t('logout', shop.language)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (padded on bottom for mobile bottom nav) */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-30 border-t-2 border-black bg-white grid grid-cols-5 shadow-[0_-2px_0_#000]">
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className={`flex flex-col items-center justify-center py-2 text-[10px] font-mono font-bold border-r border-black/20 ${
            pathname === '/' ? 'bg-black text-accent' : 'text-black active:bg-accent'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: '/sales' })}
          className={`flex flex-col items-center justify-center py-2 text-[10px] font-mono font-bold border-r border-black/20 ${
            pathname === '/sales' ? 'bg-black text-accent' : 'text-black active:bg-accent'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span>Sales</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: '/sales/new' })}
          className={`flex flex-col items-center justify-center py-2 text-[10px] font-mono font-bold border-r border-black/20 ${
            pathname === '/sales/new' ? 'bg-black text-accent' : 'bg-accent text-black'
          }`}
        >
          <PlusCircle className="w-4 h-4 mb-0.5" />
          <span>+ Invoice</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: '/customers' })}
          className={`flex flex-col items-center justify-center py-2 text-[10px] font-mono font-bold border-r border-black/20 ${
            pathname.startsWith('/customers') || pathname.startsWith('/suppliers')
              ? 'bg-black text-accent'
              : 'text-black active:bg-accent'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Parties</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-2 text-[10px] font-mono font-bold ${
            mobileMenuOpen ? 'bg-black text-accent' : 'text-black active:bg-accent'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>All Menu</span>
        </button>
      </nav>

      <ShortcutFooter shortcuts={footerShortcuts} />

      {/* Command Palette Modal (Ctrl+K) */}
      {showCmd && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 print:hidden"
          onClick={() => setShowCmd(false)}
        >
          <div
            className="border-2 border-black bg-white shadow-brutal-lg w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b-2 border-black bg-accent px-4 py-2.5 flex items-center justify-between">
              <span className="font-display text-sm uppercase tracking-wider">COMMAND PALETTE (CTRL+K)</span>
              <button
                type="button"
                onClick={() => setShowCmd(false)}
                className="text-xs font-mono border border-black bg-white px-2 py-0.5 hover:bg-black hover:text-white"
              >
                ESC ✕
              </button>
            </div>
            <div className="p-3 border-b-2 border-black">
              <input
                autoFocus
                value={cmdQuery}
                onChange={e => {
                  setCmdQuery(e.target.value);
                  setCmdIndex(0);
                }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCmdIndex(i => (filteredRoutes.length ? (i + 1) % filteredRoutes.length : 0));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCmdIndex(i =>
                      filteredRoutes.length ? (i - 1 + filteredRoutes.length) % filteredRoutes.length : 0
                    );
                  } else if (e.key === 'Enter' && filteredRoutes[cmdIndex]) {
                    e.preventDefault();
                    selectRoute(filteredRoutes[cmdIndex].path);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowCmd(false);
                  }
                }}
                placeholder="Type a screen name or path (e.g. Sales, Ledger, Settings)..."
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-black/20">
              {filteredRoutes.length === 0 ? (
                <div className="p-4 text-xs font-mono text-gray-500 text-center">No matching screens found</div>
              ) : (
                filteredRoutes.map((route, idx) => (
                  <button
                    key={route.path}
                    type="button"
                    onClick={() => selectRoute(route.path)}
                    onMouseEnter={() => setCmdIndex(idx)}
                    className={`w-full px-4 py-2.5 text-left font-mono text-xs flex items-center justify-between gap-2 transition-colors ${
                      idx === cmdIndex ? 'bg-black text-white' : 'bg-white hover:bg-accent text-black'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-bold">{route.label}</span>
                      <span className={`ml-2 text-[10px] uppercase ${idx === cmdIndex ? 'text-accent' : 'text-gray-500'}`}>
                        [{route.category}]
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {route.shortcut && (
                        <span className="border border-current px-1.5 py-0.5 text-[10px]">{route.shortcut}</span>
                      )}
                      <span className="opacity-70 hidden sm:inline">{route.path}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal (F1) */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 print:hidden"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="border-2 border-black bg-white shadow-brutal-lg w-full max-w-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b-2 border-black bg-accent px-4 py-3 flex items-center justify-between">
              <span className="font-display text-sm sm:text-base uppercase tracking-wider">KEYBOARD SHORTCUTS HELP (F1)</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-xs font-mono border-2 border-black bg-white px-2.5 py-0.5 font-bold hover:bg-black hover:text-white"
              >
                ESC ✕
              </button>
            </div>
            <div className="p-3 sm:p-4 max-h-[75vh] overflow-y-auto">
              <table className="w-full text-xs font-mono border-2 border-black">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="text-left px-3 py-2 uppercase w-32 sm:w-40">Key</th>
                    <th className="text-left px-3 py-2 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {SHORTCUT_DOCS.map(s => (
                    <tr key={s.key} className="odd:bg-white even:bg-gray-50">
                      <td className="px-3 py-2 font-bold whitespace-nowrap">
                        <span className="border border-black bg-accent px-1.5 py-0.5 text-black">{s.key}</span>
                      </td>
                      <td className="px-3 py-2">{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
