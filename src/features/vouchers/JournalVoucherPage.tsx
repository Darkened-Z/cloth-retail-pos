import { useState } from 'react';
import { useJournals } from '@/stores/useJournals';
import { useCoa } from '@/stores/useCoa';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import type { JournalLine } from '@/types';

export function JournalVoucherPage() {
  const { journals, add } = useJournals();
  const { accounts } = useCoa();
  const [showForm, setShowForm] = useState(false);
  const [narration, setNarration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

  function addLine() {
    setLines(l => [...l, { accountId: '', debit: 0, credit: 0, description: '' }]);
  }

  function removeLine(i: number) {
    setLines(l => l.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof JournalLine, value: string | number) {
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [field]: value } : line));
  }

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  function save() {
    const validLines = lines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0));
    if (!narration || validLines.length < 2 || !isBalanced) return;
    add({ date, narration, lines: validLines });
    setShowForm(false);
    setNarration('');
    setDate(new Date().toISOString().slice(0, 10));
    setLines([
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ]);
  }

  const sorted = [...journals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tight">Journal Vouchers</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase hover:shadow-brutal transition-shadow">
          + NEW JOURNAL
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-4">
          <h2 className="font-bold uppercase text-sm">New Journal Voucher</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Narration</label>
              <input value={narration} onChange={e => setNarration(e.target.value)}
                className="w-full border-2 border-black px-3 py-2 text-sm focus:outline-none"
                placeholder="Purpose of this entry..." />
            </div>
          </div>

          <table className="w-full text-sm border-2 border-black">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left px-3 py-2 font-bold uppercase">Account</th>
                <th className="text-left px-3 py-2 font-bold uppercase">Description</th>
                <th className="text-right px-3 py-2 font-bold uppercase">Debit</th>
                <th className="text-right px-3 py-2 font-bold uppercase">Credit</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="border-b border-black">
                  <td className="px-2 py-1">
                    <select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}
                      className="w-full border border-black px-2 py-1 text-xs focus:outline-none bg-white">
                      <option value="">-- Select --</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                      className="w-full border border-black px-2 py-1 text-xs focus:outline-none"
                      placeholder="Description" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)}
                      className="w-full border border-black px-2 py-1 text-xs font-mono text-right focus:outline-none"
                      placeholder="0" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)}
                      className="w-full border border-black px-2 py-1 text-xs font-mono text-right focus:outline-none"
                      placeholder="0" />
                  </td>
                  <td className="px-2 py-1">
                    <button onClick={() => removeLine(i)} className="text-red-600 font-bold text-xs hover:underline">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-black">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-right font-bold uppercase text-xs">Totals</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>{formatNumber(totalDebit)}</td>
                <td className={`px-3 py-2 text-right font-mono font-bold ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>{formatNumber(totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {!isBalanced && (
            <p className="text-red-600 text-xs font-bold">⚠ Debit and Credit must be equal to save</p>
          )}

          <div className="flex gap-2">
            <button onClick={addLine} className="px-3 py-1.5 border-2 border-black font-bold text-xs uppercase hover:bg-gray-100">+ ADD LINE</button>
            <button onClick={save} disabled={!isBalanced}
              className="px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black disabled:opacity-40 disabled:cursor-not-allowed">
              SAVE
            </button>
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
              <th className="text-left px-4 py-2 font-bold uppercase">Narration</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Lines</th>
              <th className="text-right px-4 py-2 font-bold uppercase">Total Dr</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((j, i) => {
              const totalDr = j.lines.reduce((s, l) => s + l.debit, 0);
              return (
                <tr key={j.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-mono text-xs">{j.serial}</td>
                  <td className="px-4 py-2">{formatDate(j.date)}</td>
                  <td className="px-4 py-2">{j.narration}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{j.lines.length}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold">{formatNumber(totalDr)}</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">No journal entries found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
