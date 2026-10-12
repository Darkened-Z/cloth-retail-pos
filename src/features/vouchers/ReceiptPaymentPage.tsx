import { useState } from 'react';
import { useVouchers } from '@/stores/useVouchers';
import { useParties } from '@/stores/useParties';
import { useCoa } from '@/stores/useCoa';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { ReceiptVoucher, PaymentVoucher } from '@/types';

type Tab = 'receipt' | 'payment';

export function ReceiptPaymentPage() {
  const { receipts, payments, addReceipt, updateReceipt, removeReceipt, addPayment, updatePayment, removePayment } = useVouchers();
  const { parties, update: updateParty } = useParties();
  const { accounts } = useCoa();
  const [tab, setTab] = useState<Tab>('receipt');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ReceiptVoucher | PaymentVoucher | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    partyId: '',
    amount: '',
    mode: 'cash' as 'cash' | 'bank',
    bankAccountId: '',
    description: '',
  });

  const partyMap = Object.fromEntries(parties.map(p => [p.id, p.name]));
  const bankAccounts = accounts.filter(a => a.subId === 'AS41');

  function openNew() {
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), partyId: '', amount: '', mode: 'cash', bankAccountId: '', description: '' });
    setShowForm(true);
  }

  function openEdit(r: ReceiptVoucher | PaymentVoucher) {
    setEditing(r);
    setForm({
      date: r.date,
      partyId: r.partyId,
      amount: String(r.amount),
      mode: 'receivedIn' in r ? r.receivedIn : r.paidFrom,
      bankAccountId: r.bankAccountId ?? '',
      description: r.description,
    });
    setShowForm(true);
  }

  function save() {
    if (!form.partyId || !form.amount || !form.description) return;
    const amount = parseFloat(form.amount);
    const base = {
      date: form.date,
      partyId: form.partyId,
      amount,
      description: form.description,
      bankAccountId: form.mode === 'bank' ? form.bankAccountId : undefined,
    };

    if (editing) {
      if (editing.partyId === form.partyId) {
        const party = parties.find(p => p.id === form.partyId);
        if (party) {
          updateParty({ ...party, currentBalance: party.currentBalance + editing.amount - amount });
        }
      } else {
        const oldParty = parties.find(p => p.id === editing.partyId);
        if (oldParty) {
          updateParty({ ...oldParty, currentBalance: oldParty.currentBalance + editing.amount });
        }
        const newParty = parties.find(p => p.id === form.partyId);
        if (newParty) {
          updateParty({ ...newParty, currentBalance: newParty.currentBalance - amount });
        }
      }
      if (tab === 'receipt') {
        updateReceipt({ ...(editing as ReceiptVoucher), ...base, receivedIn: form.mode });
      } else {
        updatePayment({ ...(editing as PaymentVoucher), ...base, paidFrom: form.mode });
      }
    } else {
      const party = parties.find(p => p.id === form.partyId);
      if (party) {
        updateParty({ ...party, currentBalance: party.currentBalance - amount });
      }
      if (tab === 'receipt') addReceipt({ ...base, receivedIn: form.mode });
      else addPayment({ ...base, paidFrom: form.mode });
    }

    setShowForm(false);
    setEditing(null);
    setForm({ date: new Date().toISOString().slice(0, 10), partyId: '', amount: '', mode: 'cash', bankAccountId: '', description: '' });
  }

  function handleDelete(r: ReceiptVoucher | PaymentVoucher) {
    if (!confirm('Delete voucher?')) return;
    const party = parties.find(p => p.id === r.partyId);
    if (party) {
      updateParty({ ...party, currentBalance: party.currentBalance + r.amount });
    }
    if (tab === 'receipt') removeReceipt(r.id);
    else removePayment(r.id);
  }

  useKeyboardShortcuts({
    'ctrl+n': () => openNew(),
    f9: () => { if (showForm) save(); },
    escape: () => { setShowForm(false); setEditing(null); },
  });

  const partyOptions = tab === 'receipt'
    ? parties.filter(p => p.type === 'customer')
    : parties.filter(p => p.type === 'supplier' || p.type === 'dyer');

  const rows: (ReceiptVoucher | PaymentVoucher)[] = tab === 'receipt'
    ? [...receipts].sort((a, b) => b.date.localeCompare(a.date))
    : [...payments].sort((a, b) => b.date.localeCompare(a.date));

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">Receipt / Payment Vouchers</h1>
        <button onClick={openNew}
          className="w-full sm:w-auto px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase shadow-brutal brutal-press hover:bg-black hover:text-white transition-shadow">
          + NEW VOUCHER (Ctrl+N)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-2 border-black w-full sm:w-fit bg-white">
        {(['receipt', 'payment'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false); setEditing(null); }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold uppercase border-r-2 border-black last:border-0 ${tab === t ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
            {t === 'receipt' ? 'Receipt Vouchers' : 'Payment Vouchers'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-3">
          <h2 className="font-bold uppercase text-sm">
            {editing ? 'Edit' : 'New'} {tab === 'receipt' ? 'Receipt' : 'Payment'} Voucher
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">{tab === 'receipt' ? 'Customer' : 'Supplier / Dyer'}</label>
              <select value={form.partyId} onChange={e => setForm(f => ({ ...f, partyId: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="">-- Select Party --</option>
                {partyOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Amount (PKR)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none font-mono" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">{tab === 'receipt' ? 'Received In' : 'Paid From'}</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as 'cash' | 'bank' }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white">
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            {form.mode === 'bank' && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Bank Account</label>
                <select value={form.bankAccountId} onChange={e => setForm(f => ({ ...f, bankAccountId: e.target.value }))}
                  className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none bg-white">
                  <option value="">-- Select Bank --</option>
                  {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none"
                placeholder="Payment details..." />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={save} className="flex-1 sm:flex-none px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black">SAVE (F9)</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 sm:flex-none px-4 py-2 border-2 border-black bg-white font-bold text-sm uppercase hover:bg-gray-100">CANCEL</button>
          </div>
        </div>
      )}

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">Serial</th>
              <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">Date</th>
              <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">Party</th>
              <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">Mode</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Description</th>
              <th className="text-right px-4 py-2 font-bold uppercase whitespace-nowrap">Amount</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{r.serial}</td>
                <td className="px-4 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                <td className="px-4 py-2 font-bold whitespace-nowrap">{partyMap[r.partyId] ?? r.partyId}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase border border-black ${
                    ('receivedIn' in r ? r.receivedIn : (r as PaymentVoucher).paidFrom) === 'cash' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {'receivedIn' in r ? r.receivedIn : (r as PaymentVoucher).paidFrom}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600 text-xs">{r.description}</td>
                <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap">{formatNumber(r.amount)}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap space-x-1">
                  <button onClick={() => openEdit(r)} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs font-mono">Edit</button>
                  <button onClick={() => handleDelete(r)} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs font-mono">Del</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400 text-sm bg-white">No vouchers found</td></tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-100 border-t-2 border-black">
              <tr>
                <td colSpan={5} className="px-4 py-2 font-bold uppercase text-sm text-right">Total</td>
                <td className="px-4 py-2 text-right font-mono font-black text-base whitespace-nowrap">{formatNumber(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
