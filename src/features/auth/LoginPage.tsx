import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/stores/useAuth';
import { useShop } from '@/stores/useShop';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function LoginPage() {
  const { login } = useAuth();
  const { shop } = useShop();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin() {
    if (login(username, password)) {
      navigate({ to: '/' });
    } else {
      setError('Invalid username or password');
    }
  }

  useKeyboardShortcuts({ f9: () => handleLogin() });

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-10 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-6 text-center">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-sm flex items-center justify-center mx-auto mb-3 shadow-sm">
            HF
          </div>
          <div className="text-xl font-semibold text-slate-900 tracking-tight">
            {shop?.name || 'Hafiz Fabrics'}
          </div>
          <div className="text-xs mt-1 text-slate-500">Sign in to your ERP Workspace</div>
        </div>

        {/* Form */}
        <div className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Username</label>
            <input
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && document.getElementById('pw')?.focus()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 rounded-lg px-3 py-2 text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full rounded-lg bg-slate-900 text-white font-semibold text-sm py-2.5 hover:bg-slate-800 transition-colors shadow-sm"
          >
            Sign In (F9)
          </button>
          <p className="text-xs text-center text-slate-400">
            Demo: admin / admin123 (or ejaz / admin123)
          </p>
        </div>
      </div>
    </div>
  );
}
