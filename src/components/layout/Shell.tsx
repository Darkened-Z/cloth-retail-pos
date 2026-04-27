import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useAuth } from '@/stores/useAuth';
import { useShop } from '@/stores/useShop';
import { TopNav } from './TopNav';
import { ShortcutFooter } from './ShortcutFooter';

export function Shell() {
  const { user, logout } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();
  const routerState = useRouterState();

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Header */}
      <header className="border-b-2 border-black bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display text-xl tracking-tight">{shop.name}</span>
          <span className="text-xs text-gray-500 font-mono uppercase">{shop.address}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono border border-black px-2 py-1">{user.displayName} · {user.role}</span>
          <button
            onClick={() => { logout(); navigate({ to: '/login' }); }}
            className="text-xs font-mono border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors brutal-press"
          >
            LOG OUT
          </button>
        </div>
      </header>

      <TopNav currentPath={routerState.location.pathname} />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <ShortcutFooter shortcuts={[
        { key: 'Ctrl+N', label: 'New' },
        { key: 'F9', label: 'Save' },
        { key: 'Esc', label: 'Cancel' },
        { key: 'F1', label: 'Help' },
        { key: 'Ctrl+P', label: 'Print' },
      ]} />
    </div>
  );
}
