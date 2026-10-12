import { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/stores/useAuth';
import { useShop } from '@/stores/useShop';
import { setLang, t, type LangMode } from '@/lib/i18n';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { ShortcutFooter } from './ShortcutFooter';
import {
  Menu,
  X,
  Search,
  LogOut,
  Home,
  Receipt,
  Users,
  BarChart3,
  PlusCircle,
  Globe,
  FileCheck2,
  BookOpen,
  Tag,
  ShoppingBag,
  Package,
  MessageSquare,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  Bell,
  Plus,
} from 'lucide-react';

interface PaletteRoute {
  label: string;
  category: string;
  path: string;
  shortcut?: string;
}

const APP_ROUTES: PaletteRoute[] = [
  { label: 'Dashboard', category: 'HOME', path: '/' },
  { label: 'Chart of Accounts', category: 'ACCOUNTING', path: '/coa' },
  { label: 'Items & Fabric Stock', category: 'STOCK', path: '/items' },
  { label: 'Locations / Godowns', category: 'STOCK', path: '/locations' },
  { label: 'Customers', category: 'CRM & SELLING', path: '/customers', shortcut: 'C' },
  { label: 'Suppliers & Dyers', category: 'BUYING & DYEING', path: '/suppliers' },
  { label: 'Employees', category: 'HR', path: '/employees' },
  { label: 'Sales Invoice List', category: 'SELLING', path: '/sales' },
  { label: 'New Sales Invoice (POS)', category: 'SELLING', path: '/sales/new', shortcut: 'N' },
  { label: 'Purchase Voucher List', category: 'BUYING', path: '/purchase' },
  { label: 'New Purchase Voucher', category: 'BUYING', path: '/purchase/new' },
  { label: 'Dyeing & Pretreatment List', category: 'DYEING', path: '/dyeing' },
  { label: 'New Dyeing Voucher', category: 'DYEING', path: '/dyeing/new', shortcut: 'D' },
  { label: 'Stock Transfer', category: 'STOCK', path: '/stock-transfer' },
  { label: 'Receipt / Payment Voucher', category: 'ACCOUNTING', path: '/vouchers/receipt-payment' },
  { label: 'Journal Voucher', category: 'ACCOUNTING', path: '/vouchers/journal' },
  { label: 'Daily Expenses', category: 'ACCOUNTING', path: '/expenses', shortcut: 'E' },
  { label: 'Attendance', category: 'HR', path: '/attendance' },
  { label: 'Payroll & Salary Slips', category: 'HR', path: '/payroll' },
  { label: 'Day Book', category: 'REPORTS', path: '/reports/daybook' },
  { label: 'Cash Book', category: 'REPORTS', path: '/reports/cashbook' },
  { label: 'Party Ledger Report', category: 'REPORTS', path: '/reports/ledger' },
  { label: 'Trial Balance', category: 'REPORTS', path: '/reports/trial-balance' },
  { label: 'Trial Balance 4-Column', category: 'REPORTS', path: '/reports/trial-balance-4col' },
  { label: 'Profit & Loss Statement', category: 'REPORTS', path: '/reports/profit-loss' },
  { label: 'Stock / Fabric Ledger', category: 'REPORTS', path: '/reports/stock' },
  { label: 'Debtors Aging Report', category: 'REPORTS', path: '/reports/debtors' },
  { label: 'Shop Settings & Backup', category: 'SETTINGS', path: '/settings' },
  { label: 'Manage Users', category: 'SETTINGS', path: '/settings/users' },
];

interface SidebarModule {
  id: string;
  label: string;
  icon: any;
  defaultPath: string;
  children?: { label: string; path: string }[];
}

const SIDEBAR_MODULES: SidebarModule[] = [
  {
    id: 'workspace',
    label: 'Dashboard',
    icon: Home,
    defaultPath: '/',
  },
  {
    id: 'dyeing',
    label: 'Fabric Pretreatment',
    icon: FileCheck2,
    defaultPath: '/dyeing',
    children: [
      { label: 'Dyeing Vouchers', path: '/dyeing' },
      { label: '+ New Dyeing Order', path: '/dyeing/new' },
      { label: 'Dyers & Suppliers', path: '/suppliers' },
    ],
  },
  {
    id: 'accounting',
    label: 'Accounting',
    icon: BookOpen,
    defaultPath: '/coa',
    children: [
      { label: 'Chart of Accounts', path: '/coa' },
      { label: 'Receipt / Payment', path: '/vouchers/receipt-payment' },
      { label: 'Journal Voucher', path: '/vouchers/journal' },
      { label: 'Daily Expenses', path: '/expenses' },
    ],
  },
  {
    id: 'selling',
    label: 'Selling',
    icon: Tag,
    defaultPath: '/sales',
    children: [
      { label: 'Sales Invoices', path: '/sales' },
      { label: '+ New Sales Invoice', path: '/sales/new' },
      { label: 'Customers', path: '/customers' },
      { label: 'Debtors Report', path: '/reports/debtors' },
    ],
  },
  {
    id: 'buying',
    label: 'Buying',
    icon: ShoppingBag,
    defaultPath: '/purchase',
    children: [
      { label: 'Purchase Vouchers', path: '/purchase' },
      { label: '+ New Purchase', path: '/purchase/new' },
      { label: 'Suppliers & Dyers', path: '/suppliers' },
    ],
  },
  {
    id: 'stock',
    label: 'Stock',
    icon: Package,
    defaultPath: '/items',
    children: [
      { label: 'Items & Fabrics', path: '/items' },
      { label: 'Stock Transfer', path: '/stock-transfer' },
      { label: 'Locations / Godowns', path: '/locations' },
      { label: 'Fabric Stock Ledger', path: '/reports/stock' },
    ],
  },
  {
    id: 'crm',
    label: 'CRM & Parties',
    icon: MessageSquare,
    defaultPath: '/customers',
    children: [
      { label: 'Customers Directory', path: '/customers' },
      { label: 'Suppliers & Dyers', path: '/suppliers' },
      { label: 'Party Ledger Report', path: '/reports/ledger' },
    ],
  },
  {
    id: 'hr',
    label: 'HR & Payroll',
    icon: UserCheck,
    defaultPath: '/employees',
    children: [
      { label: 'Employees & Advances', path: '/employees' },
      { label: 'Daily Attendance', path: '/attendance' },
      { label: 'Monthly Payroll', path: '/payroll' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    defaultPath: '/reports/daybook',
    children: [
      { label: 'Day Book', path: '/reports/daybook' },
      { label: 'Cash Book', path: '/reports/cashbook' },
      { label: 'Party Ledger', path: '/reports/ledger' },
      { label: 'Trial Balance', path: '/reports/trial-balance' },
      { label: 'Trial Balance (4-Col)', path: '/reports/trial-balance-4col' },
      { label: 'Profit & Loss', path: '/reports/profit-loss' },
      { label: 'Stock Ledger', path: '/reports/stock' },
      { label: 'Debtors Aging', path: '/reports/debtors' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    defaultPath: '/settings',
    children: [
      { label: 'Shop Settings & Backup', path: '/settings' },
      { label: 'Manage Users', path: '/settings/users' },
    ],
  },
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
  { key: 'N / D / E / C', desc: 'Workspace quick keys: New Invoice (N), Dyeing (D), Expenses (E), Customers (C)' },
];

export function Shell() {
  const { user, logout } = useAuth();
  const { shop, update: updateShop } = useShop();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const [showHelp, setShowHelp] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdIndex, setCmdIndex] = useState(0);

  useEffect(() => {
    setLang(shop.language);
  }, [shop.language]);

  useEffect(() => {
    setMobileMenuOpen(false);
    // Auto-expand sidebar module matching current route
    const matching = SIDEBAR_MODULES.find(
      m =>
        m.id !== 'workspace' &&
        (m.defaultPath === pathname ||
          m.children?.some(c => pathname === c.path || pathname.startsWith(c.path + '/')))
    );
    if (matching) {
      setExpandedModule(matching.id);
    }
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
    'ctrl+g': () => {
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
        { key: 'Ctrl+K', label: 'Search / Command' },
        { key: 'F1', label: 'Help' },
        { key: 'Ctrl+P', label: 'Print' },
      ];
    }
    return [
      { key: 'Ctrl+N', label: 'New' },
      { key: 'F9', label: 'Save' },
      { key: 'Esc', label: 'Cancel' },
      { key: 'Ctrl+K', label: 'Search / Command' },
      { key: 'F1', label: 'Help' },
      { key: 'Ctrl+P', label: 'Print' },
    ];
  }, [pathname]);

  const currentRouteMeta = APP_ROUTES.find(r => r.path === pathname);
  const pageTitle =
    pathname === '/'
      ? 'Dashboard'
      : currentRouteMeta?.label || shop.name || 'Hafiz Fabrics';

  const avatarInitial = (user?.displayName || 'Admin').trim().charAt(0).toUpperCase();

  function isModuleActive(mod: SidebarModule): boolean {
    if (mod.id === 'workspace') return pathname === '/';
    if (pathname === mod.defaultPath) return true;
    return Boolean(mod.children?.some(c => pathname === c.path || pathname.startsWith(c.path + '/')));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Frappe / ERPNext Utility Navbar */}
      <header className="h-12 border-b border-slate-200 bg-white px-3 sm:px-5 flex items-center justify-between gap-3 print:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2.5 text-left min-w-0 group"
          >
            <span className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:bg-blue-700 transition-colors">
              HF
            </span>
            <span className="hidden sm:inline font-semibold text-sm text-slate-700 hover:text-slate-900 truncate">
              {shop.name}
            </span>
          </button>
          {currentRouteMeta && pathname !== '/' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline shrink-0" />
              <span className="hidden sm:inline text-sm font-medium text-slate-900 truncate">
                {currentRouteMeta.label}
              </span>
            </>
          )}
        </div>

        {/* Center / Right Search + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* ERPNext Command / Awesomebar Search Input */}
          <button
            type="button"
            onClick={() => {
              setShowCmd(true);
              setCmdQuery('');
              setCmdIndex(0);
            }}
            className="w-40 sm:w-72 md:w-80 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/90 rounded-lg px-3 py-1.5 text-xs text-slate-500 flex items-center justify-between transition-colors"
            title="Search or type a command (Ctrl+K)"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Search or type a command (Ctrl + K)</span>
            </span>
          </button>

          {/* Language Switcher */}
          <div className="hidden lg:flex items-center bg-slate-100 border border-slate-200 rounded-md p-0.5 text-[11px] font-medium">
            {(['en', 'ur', 'dual'] as LangMode[]).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => changeLang(l)}
                className={`px-2 py-0.5 uppercase rounded transition-colors ${
                  shop.language === l
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="text-slate-500 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            title="Notifications & Keyboard Shortcuts"
          >
            <Bell className="w-4 h-4" />
          </button>

          <div className="hidden sm:block h-4 w-px bg-slate-200" />

          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            title="Keyboard Shortcuts Help (F1)"
          >
            <span>Help</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Avatar + Logout */}
          <div className="flex items-center gap-1.5">
            <div
              className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-center border border-emerald-200"
              title={`${user?.displayName || 'Admin'} (${user?.role || 'admin'})`}
            >
              {avatarInitial}
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate({ to: '/login' });
              }}
              className="text-xs font-medium text-slate-600 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t('logout', shop.language)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary ERPNext Workspace Header Bar */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 768) {
                setMobileMenuOpen(prev => !prev);
              } else {
                setSidebarCollapsed(prev => !prev);
              }
            }}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate({ to: '/sales/new' })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>New Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/dyeing/new' })}
            className="hidden sm:flex px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Dyeing Order</span>
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/settings' })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-sm transition-colors"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Body Layout: Left Sidebar + Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Left Sidebar (ERPNext style) */}
        {!sidebarCollapsed && (
          <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-slate-200/80 bg-[#F8FAFC] px-3 py-3 select-none print:hidden pb-16">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ChevronDown className="w-3 h-3" />
              <span>PUBLIC</span>
            </div>

            <nav className="mt-1 space-y-0.5 flex-1 overflow-y-auto">
              {SIDEBAR_MODULES.map(mod => {
                const Icon = mod.icon;
                const active = isModuleActive(mod);
                const isExpanded = expandedModule === mod.id;

                return (
                  <div key={mod.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (mod.children) {
                          setExpandedModule(prev => (prev === mod.id ? null : mod.id));
                        }
                        navigate({ to: mod.defaultPath as string });
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-left text-[13.5px] flex items-center justify-between gap-2.5 transition-colors ${
                        active
                          ? 'bg-slate-200/75 text-slate-900 font-semibold'
                          : 'text-slate-700 font-medium hover:bg-slate-200/40 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-slate-900' : 'text-slate-500'
                          }`}
                        />
                        <span className="truncate">{mod.label}</span>
                      </span>
                      {mod.children && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </button>

                    {/* Expandable Sub-routes */}
                    {mod.children && isExpanded && (
                      <div className="mt-0.5 ml-6 pl-2.5 border-l border-slate-200 space-y-0.5 py-0.5">
                        {mod.children.map(child => {
                          const childActive = pathname === child.path;
                          return (
                            <button
                              key={child.path}
                              type="button"
                              onClick={() => navigate({ to: child.path as string })}
                              className={`w-full px-2.5 py-1.5 rounded-md text-left text-xs transition-colors flex items-center justify-between ${
                                childActive
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              <span className="truncate">{child.label}</span>
                              {childActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content Canvas */}
        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pb-20 md:pb-14">
          <Outlet />
        </main>
      </div>

      {/* Mobile Slide-Out Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] md:hidden print:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs bg-white border-r border-slate-200 h-full flex flex-col overflow-hidden shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  HF
                </span>
                <div>
                  <div className="font-semibold text-sm text-slate-900 leading-none">{shop.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {user?.displayName} · <span className="uppercase">{user?.role}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Language Bar */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Language
              </span>
              <div className="flex bg-slate-100 border border-slate-200 rounded-md p-0.5 text-[11px] font-medium">
                {(['en', 'ur', 'dual'] as LangMode[]).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => changeLang(l)}
                    className={`px-2 py-0.5 uppercase rounded ${
                      shop.language === l ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Drawer Links */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {SIDEBAR_MODULES.map(mod => {
                const Icon = mod.icon;
                const active = isModuleActive(mod);
                return (
                  <div key={mod.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => selectRoute(mod.defaultPath)}
                      className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-2.5 ${
                        active ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span>{mod.label}</span>
                    </button>
                    {mod.children && (
                      <div className="ml-6 pl-2.5 border-l border-slate-200 space-y-0.5">
                        {mod.children.map(child => (
                          <button
                            key={child.path}
                            type="button"
                            onClick={() => selectRoute(child.path)}
                            className={`w-full px-2.5 py-1.5 rounded-md text-left text-xs block ${
                              pathname === child.path
                                ? 'text-blue-600 font-semibold bg-blue-50/60'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden print:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white grid grid-cols-5 shadow-lg">
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
            pathname === '/' ? 'text-blue-600 font-semibold' : 'text-slate-600'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: '/sales' })}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
            pathname === '/sales' ? 'text-blue-600 font-semibold' : 'text-slate-600'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span>Sales</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: '/sales/new' })}
          className="flex flex-col items-center justify-center py-2 text-[11px] font-semibold text-blue-600 bg-blue-50/70"
        >
          <PlusCircle className="w-4 h-4 mb-0.5" />
          <span>+ Invoice</span>
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: '/customers' })}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
            pathname.startsWith('/customers') || pathname.startsWith('/suppliers')
              ? 'text-blue-600 font-semibold'
              : 'text-slate-600'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Parties</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
            mobileMenuOpen ? 'text-blue-600 font-semibold' : 'text-slate-600'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Locked Bottom Keyboard Shortcuts Footer */}
      <ShortcutFooter shortcuts={footerShortcuts} />

      {/* Command Palette Modal (Ctrl+K) */}
      {showCmd && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 print:hidden"
          onClick={() => setShowCmd(false)}
        >
          <div
            className="border border-slate-200 bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                Search or Type a Command (Ctrl+K)
              </span>
              <button
                type="button"
                onClick={() => setShowCmd(false)}
                className="text-xs font-medium border border-slate-200 rounded-md bg-white px-2 py-0.5 text-slate-600 hover:bg-slate-100"
              >
                ESC ✕
              </button>
            </div>
            <div className="p-3 border-b border-slate-200">
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
                placeholder="Search workspaces, documents, reports (e.g. Sales, Dyeing, Ledger)..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredRoutes.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 text-center">No matching screens found</div>
              ) : (
                filteredRoutes.map((route, idx) => (
                  <button
                    key={route.path}
                    type="button"
                    onClick={() => selectRoute(route.path)}
                    onMouseEnter={() => setCmdIndex(idx)}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-2 transition-colors ${
                      idx === cmdIndex ? 'bg-blue-50 text-blue-900' : 'bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="truncate">
                      <span className="font-medium">{route.label}</span>
                      <span className="ml-2 text-[11px] uppercase text-slate-400 font-medium">
                        {route.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {route.shortcut && (
                        <span className="border border-slate-200 bg-slate-100 rounded px-1.5 py-0.5 text-[11px] font-mono text-slate-600">
                          {route.shortcut}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 hidden sm:inline font-mono">{route.path}</span>
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
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4 print:hidden"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="border border-slate-200 bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900">Keyboard Shortcuts (F1)</span>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="text-xs font-medium border border-slate-200 rounded-md bg-white px-2.5 py-1 text-slate-600 hover:bg-slate-100"
              >
                ESC ✕
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-y-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold w-36">Key</th>
                    <th className="text-left px-4 py-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SHORTCUT_DOCS.map(s => (
                    <tr key={s.key}>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <kbd className="border border-slate-300 bg-slate-100 rounded px-2 py-0.5 text-xs font-mono font-semibold text-slate-800">
                          {s.key}
                        </kbd>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{s.desc}</td>
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
