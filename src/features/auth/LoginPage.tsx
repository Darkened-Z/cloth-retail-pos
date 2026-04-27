import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/stores/useAuth';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function LoginPage() {
  const { login } = useAuth();
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-sm">
        {/* Header */}
        <div className="border-b-2 border-black bg-black text-white px-8 py-6">
          <div className="font-display text-3xl tracking-tight">MY STORE</div>
          <div className="font-mono text-xs mt-1 text-gray-400 uppercase tracking-widest">POS / ERP System</div>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1">Username</label>
            <input
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              onKeyDown={e => e.key === 'Enter' && document.getElementById('pw')?.focus()}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest mb-1">Password</label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="border-2 border-danger bg-danger/10 px-3 py-2 text-xs font-mono text-danger">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full border-2 border-black bg-accent text-black font-sans font-bold text-sm py-2.5 hover:bg-black hover:text-white transition-colors brutal-press shadow-brutal"
          >
            SIGN IN — F9
          </button>
          <p className="text-xs text-center font-mono text-gray-400">Demo: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}
