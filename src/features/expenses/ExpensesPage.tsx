import { useState } from 'react';
import { useExpenses } from '@/stores/useExpenses';
import { useCoa } from '@/stores/useCoa';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { ExpenseVoucher } from '@/types';

export function ExpensesPage() {
  const { expenses, add, remove } = useExpenses();
  const { accounts } = useCoa();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), accountId: '', amount: '', description: '', paidFrom: 'cash' as 'cash' | 'bank' });
  const [search, setSearch] = useState('');

  const expenseAccounts = accounts.filter(a => {
    const sub = a;
    return true; // show all accounts for flexibility
  });

  const filtered = expenses.filter(e => {
    const acc = accounts.find(a => a.id === e.accountId);
    return (acc?.name ?? '').toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
  });

  function save() {
    const exp: ExpenseVoucher = {
      id: `EXP-${Date.now()}`, date: form.date, accountId: form.accountId,
      amount: Number(form.amount), description: form.description, paidFrom: form.paidFrom,
    };
    add(exp);
    setModal(false);
    setForm({ date: todayISO(), accountId: '', amount: '', description: '', paidFrom: 'cash' });
  }

  useKeyboardShortcuts({ 'ctrl+n': () => setModal(true), escape: () => setModal(false) });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">EXPENSES</h1>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-48" />
          <button onClick={() => setModal(true)} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
            + NEW (Ctrl+N)
          </button>
        </div>
      </div>
      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Date','Account','Description','Amount','Paid From',''].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const acc = accounts.find(a => a.id === e.accountId);
              return (
                <tr key={e.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2">{formatDate(e.date)}</td>
                  <td className="px-3 py-2 font-sans">{acc?.name ?? e.accountId}</td>
                  <td className="px-3 py-2">{e.description}</td>
                  <td className="px-3 py-2 font-bold text-danger">{formatPKR(e.amount)}</td>
                  <td className="px-3 py-2 uppercase">{e.paidFrom}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => { if(confirm('Delete?')) remove(e.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-black text-white">
              <td colSpan={3} className="px-3 py-2 font-bold">TOTAL</td>
              <td className="px-3 py-2 font-bold">{formatPKR(filtered.reduce((s, e) => s + e.amount, 0))}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-md">
            <div className="border-b-2 border-black px-4 py-3 font-display text-lg bg-accent">NEW EXPENSE</div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Account</label>
                <select value={form.accountId} onChange={e => setForm(p => ({...p, accountId: e.target.value}))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="">— select —</option>
                  {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Amount</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({...p, amount: e.target.value}))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Paid From</label>
                  <select value={form.paidFrom} onChange={e => setForm(p => ({...p, paidFrom: e.target.value as any}))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press shadow-brutal hover:bg-black hover:text-white">SAVE</button>
                <button onClick={() => setModal(false)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
