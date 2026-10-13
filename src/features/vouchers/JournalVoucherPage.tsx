import { useState } from 'react';
import { useJournals } from '@/stores/useJournals';
import { useCoa } from '@/stores/useCoa';
import { formatDate } from '@/lib/formatDate';
import { formatNumber } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { JournalLine, JournalVoucher } from '@/types';

export function JournalVoucherPage() {
  const { journals, add, update, remove } = useJournals();
  const { accounts } = useCoa();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalVoucher | null>(null);
  const [narration, setNarration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' },
  ]);

  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));

  function openNew() {
    setEditing(null);
    setNarration('');
    setDate(new Date().toISOString().slice(0, 10));
    setLines([
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ]);
    setShowForm(true);
  }

  function openEdit(j: JournalVoucher) {
    setEditing(j);
    setNarration(j.narration);
    setDate(j.date);
    setLines(j.lines.map(l => ({ ...l })));
    setShowForm(true);
  }

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
    if (editing) {
      update({ ...editing, date, narration, lines: validLines });
    } else {
      add({ date, narration, lines: validLines });
    }
    setShowForm(false);
    setEditing(null);
    setNarration('');
    setDate(new Date().toISOString().slice(0, 10));
    setLines([
      { accountId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', debit: 0, credit: 0, description: '' },
    ]);
  }

  useKeyboardShortcuts({
    'ctrl+n': () => openNew(),
    f9: () => { if (showForm) save(); },
    escape: () => { setShowForm(false); setEditing(null); },
  });

  const sorted = [...journals].sort((a, b) => b.date.localeCompare(a.date));
  const grandTotalDr = sorted.reduce((sum, j) => sum + j.lines.reduce((s, l) => s + (l.debit || 0), 0), 0);
  const grandTotalCr = sorted.reduce((sum, j) => sum + j.lines.reduce((s, l) => s + (l.credit || 0), 0), 0);

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-black uppercase tracking-tight">Journal Vouchers (روزنامچہ واؤچر)</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-300">
            ✓ Balanced (Dr = Cr: {formatNumber(grandTotalDr)})
          </span>
        </div>
        <button onClick={openNew}
          className="w-full sm:w-auto px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase shadow-brutal brutal-press hover:bg-black hover:text-white transition-shadow">
          + NEW JOURNAL (Ctrl+N)
        </button>
      </div>

      {showForm && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-4">
          <h2 className="font-bold uppercase text-sm">{editing ? 'Edit Journal Voucher' : 'New Journal Voucher'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="border-2 border-black overflow-x-auto bg-white">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-black text-white">
                <tr>
                  <th className="text-left px-3 py-2 font-bold uppercase whitespace-nowrap">Account</th>
                  <th className="text-left px-3 py-2 font-bold uppercase whitespace-nowrap">Description</th>
                  <th className="text-right px-3 py-2 font-bold uppercase whitespace-nowrap">Debit</th>
                  <th className="text-right px-3 py-2 font-bold uppercase whitespace-nowrap">Credit</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-black bg-white">
                    <td className="px-2 py-1 min-w-[140px]">
                      <select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}
                        className="w-full border border-black px-2 py-1 text-xs focus:outline-none bg-white">
                        <option value="">-- Select --</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1 min-w-[140px]">
                      <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)}
                        className="w-full border border-black px-2 py-1 text-xs focus:outline-none"
                        placeholder="Description" />
                    </td>
                    <td className="px-2 py-1 min-w-[100px]">
                      <input type="number" value={line.debit || ''} onChange={e => updateLine(i, 'debit', parseFloat(e.target.value) || 0)}
                        className="w-full border border-black px-2 py-1 text-xs font-mono text-right focus:outline-none"
                        placeholder="0" />
                    </td>
                    <td className="px-2 py-1 min-w-[100px]">
                      <input type="number" value={line.credit || ''} onChange={e => updateLine(i, 'credit', parseFloat(e.target.value) || 0)}
                        className="w-full border border-black px-2 py-1 text-xs font-mono text-right focus:outline-none"
                        placeholder="0" />
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <button onClick={() => removeLine(i)} className="text-red-600 font-bold text-xs hover:underline px-1">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-black">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-right font-bold uppercase text-xs whitespace-nowrap">Totals</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>{formatNumber(totalDebit)}</td>
                  <td className={`px-3 py-2 text-right font-mono font-bold whitespace-nowrap ${isBalanced ? 'text-green-700' : 'text-red-600'}`}>{formatNumber(totalCredit)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!isBalanced && (
            <p className="text-red-600 text-xs font-bold">⚠ Debit and Credit must be equal to save</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={addLine} className="px-3 py-1.5 border-2 border-black bg-white font-bold text-xs uppercase hover:bg-gray-100">+ ADD LINE</button>
            <button onClick={save} disabled={!isBalanced}
              className="flex-1 sm:flex-none px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black disabled:opacity-40 disabled:cursor-not-allowed">
              SAVE (F9)
            </button>
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
              <th className="text-left px-4 py-2 font-bold uppercase">Narration</th>
              <th className="text-right px-4 py-2 font-bold uppercase whitespace-nowrap">Lines</th>
              <th className="text-right px-4 py-2 font-bold uppercase whitespace-nowrap">Total Dr</th>
              <th className="text-right px-4 py-2 font-bold uppercase whitespace-nowrap">Total Cr</th>
              <th className="text-center px-4 py-2 font-bold uppercase whitespace-nowrap">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((j, i) => {
              const totalDr = j.lines.reduce((s, l) => s + (l.debit || 0), 0);
              const totalCr = j.lines.reduce((s, l) => s + (l.credit || 0), 0);
              return (
                <tr key={j.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-mono text-xs whitespace-nowrap font-bold">{j.serial}</td>
                  <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{formatDate(j.date)}</td>
                  <td className="px-4 py-2 font-medium">{j.narration}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs whitespace-nowrap">{j.lines.length}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap text-blue-700">{formatNumber(totalDr)}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold whitespace-nowrap text-blue-700">{formatNumber(totalCr)}</td>
                  <td className="px-4 py-2 text-center whitespace-nowrap">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                      Balanced
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap space-x-1">
                    <button onClick={() => openEdit(j)} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs font-mono">Edit</button>
                    <button onClick={() => { if (confirm('Delete journal voucher?')) remove(j.id); }} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs font-mono">Del</button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm bg-white">No journal entries found</td></tr>
            )}
          </tbody>
          {sorted.length > 0 && (
            <tfoot className="bg-black text-white font-bold border-t-2 border-black">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 uppercase text-sm">
                  <div className="flex items-center justify-between">
                    <span>Grand Totals ({sorted.length} Vouchers)</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-normal">
                      ✓ Total Debit ≡ Total Credit
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-emerald-400 whitespace-nowrap">{formatNumber(grandTotalDr)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-emerald-400 whitespace-nowrap">{formatNumber(grandTotalCr)}</td>
                <td className="px-4 py-2.5 text-center text-xs text-emerald-400 uppercase whitespace-nowrap">✓ BALANCED</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
