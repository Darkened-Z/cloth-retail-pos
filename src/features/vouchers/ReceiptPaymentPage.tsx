import { useState } from 'react';
import { useVouchers } from '@/stores/useVouchers';
import { useParties } from '@/stores/useParties';
import { useCoa } from '@/stores/useCoa';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import type { ReceiptVoucher, PaymentVoucher } from '@/types';

type Tab = 'receipt' | 'payment';

export function ReceiptPaymentPage() {
  const { receipts, payments, addReceipt, addPayment } = useVouchers();
  const { parties } = useParties();
  const { accounts } = useCoa();
  const [tab, setTab] = useState<Tab>('receipt');
  const [showForm, setShowForm] = useState(false);
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

  function save() {
    if (!form.partyId || !form.amount || !form.description) return;
    const base = {
      date: form.date,
      partyId: form.partyId,
      amount: parseFloat(form.amount),
      description: form.description,
      bankAccountId: form.mode === 'bank' ? form.bankAccountId : undefined,
    };
    if (tab === 'receipt') addReceipt({ ...base, receivedIn: form.mode });
    else addPayment({ ...base, paidFrom: form.mode });
    setShowForm(false);
    setForm({ date: new Date().toISOString().slice(0, 10), partyId: '', amount: '', mode: 'cash', bankAccountId: '', description: '' });
  }

  const partyOptions = tab === 'receipt'
    ? parties.filter(p => p.type === 'customer')
    : parties.filter(p => p.type === 'supplier' || p.type === 'dyer');

  const rows: (ReceiptVoucher | PaymentVoucher)[] = tab === 'receipt'
    ? [...receipts].sort((a, b) => b.date.localeCompare(a.date))
    : [...payments].sort((a, b) => b.date.localeCompare(a.date));

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Receipt / Payment Vouchers</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase hover:shadow-brutal transition-shadow">
          + NEW VOUCHER
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-2 border-black w-fit">
        {(['receipt', 'payment'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 text-sm font-bold uppercase border-r-2 border-black last:border-0 ${tab === t ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>
            {t === 'receipt' ? 'Receipt Vouchers' : 'Payment Vouchers'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-3">
          <h2 className="font-bold uppercase text-sm">
            New {tab === 'receipt' ? 'Receipt' : 'Payment'} Voucher
          </h2>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none"
                placeholder="Payment details..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black">SAVE</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border-2 border-black font-bold text-sm uppercase hover:bg-gray-100">CANCEL</button>
          </div>
        </div>
      )}

      <div className="border-2 border-black">
        <table className="w-full text-sm">
          <thead className="bg-black text-white">
            <tr>
              <th className="text-left px-4 py-2 font-bold uppercase">Serial</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Date</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Party</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Mode</th>
              <th className="text-left px-4 py-2 font-bold uppercase">Description</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2 font-mono text-xs">{r.serial}</td>
                <td className="px-4 py-2">{formatDate(r.date)}</td>
                <td className="px-4 py-2 font-bold">{partyMap[r.partyId] ?? r.partyId}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 text-xs font-bold uppercase border border-black ${
                    ('receivedIn' in r ? r.receivedIn : (r as PaymentVoucher).paidFrom) === 'cash' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {'receivedIn' in r ? r.receivedIn : (r as PaymentVoucher).paidFrom}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600 text-xs">{r.description}</td>
                <td className="px-4 py-2 text-right font-mono font-bold">{formatNumber(r.amount)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No vouchers found</td></tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-gray-100 border-t-2 border-black">
              <tr>
                <td colSpan={5} className="px-4 py-2 font-bold uppercase text-sm text-right">Total</td>
                <td className="px-4 py-2 text-right font-mono font-black text-base">{formatNumber(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
