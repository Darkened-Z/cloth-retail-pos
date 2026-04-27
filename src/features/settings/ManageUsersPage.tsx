import { useState } from 'react';
import { useAuth } from '@/stores/useAuth';
import { storage } from '@/lib/storage';
import type { User, UserAccount } from '@/types';

export function ManageUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>(() => {
    return (storage.get<User[]>('users') ?? []).map(u => ({ ...u, active: true }));
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [form, setForm] = useState({ username: '', displayName: '', role: 'cashier' as User['role'], password: '', active: true });
  const [error, setError] = useState('');

  function openNew() {
    setForm({ username: '', displayName: '', role: 'cashier', password: '', active: true });
    setEditing(null);
    setShowForm(true);
    setError('');
  }

  function openEdit(u: UserAccount) {
    setForm({ username: u.username, displayName: u.displayName, role: u.role, password: '', active: u.active });
    setEditing(u);
    setShowForm(true);
    setError('');
  }

  function save() {
    if (!form.username.trim() || !form.displayName.trim()) { setError('Username and display name required'); return; }
    if (!editing && !form.password) { setError('Password required for new user'); return; }
    if (users.some(u => u.username === form.username.trim() && u.id !== editing?.id)) {
      setError('Username already exists'); return;
    }
    let updated: UserAccount[];
    if (editing) {
      updated = users.map(u => u.id === editing.id ? {
        ...u,
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        role: form.role,
        active: form.active,
        passwordHash: form.password ? btoa(form.password) : u.passwordHash,
      } : u);
    } else {
      const newUser: UserAccount = {
        id: `U${Date.now()}`,
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        role: form.role,
        passwordHash: btoa(form.password),
        active: true,
      };
      updated = [...users, newUser];
    }
    storage.set('users', updated);
    setUsers(updated);
    setShowForm(false);
    setEditing(null);
    setError('');
  }

  function toggleActive(id: string) {
    if (id === currentUser?.id) return;
    const updated = users.map(u => u.id === id ? { ...u, active: !u.active } : u);
    storage.set('users', updated);
    setUsers(updated);
  }

  const ROLES: User['role'][] = ['admin', 'cashier', 'accountant'];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Manage Users</h1>
        <button onClick={openNew}
          className="px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase hover:shadow-brutal transition-shadow">
          + ADD USER
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-3">
          <h2 className="font-bold uppercase text-sm">{editing ? 'Edit User' : 'New User'}</h2>
          {error && <p className="text-red-600 text-xs font-bold">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Username</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none font-mono"
                placeholder="e.g. admin" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Display Name</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none"
                placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white uppercase">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none font-mono"
                placeholder={editing ? '(unchanged)' : 'Enter password'} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black">SAVE</button>
            <button onClick={() => { setShowForm(false); setEditing(null); setError(''); }}
              className="px-4 py-2 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">CANCEL</button>
          </div>
        </div>
      )}

      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-2 font-bold uppercase">Username</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Display Name</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Role</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 font-mono font-bold">{u.username}</td>
                <td className="px-4 py-2">{u.displayName}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase border border-black ${
                    u.role === 'admin' ? 'bg-accent' : u.role === 'accountant' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase border border-black ${u.active ? 'bg-green-100' : 'bg-red-100'}`}>
                    {u.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button onClick={() => openEdit(u)} className="text-xs font-bold underline hover:text-blue-600">Edit</button>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => toggleActive(u.id)} className={`text-xs font-bold underline ${u.active ? 'hover:text-red-600' : 'hover:text-green-600'}`}>
                      {u.active ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
