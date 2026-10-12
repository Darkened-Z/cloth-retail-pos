import { useCoa } from '@/stores/useCoa';
import { formatPKR } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

export function TrialBalancePage() {
  const { masters, subs, accounts } = useCoa();

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl">TRIAL BALANCE</h1>
        <button onClick={() => window.print()}
          className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>
      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[540px] text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Account</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Sub-Group</th>
              <th className="px-3 py-2.5 text-left whitespace-nowrap">Nature</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap">Debit</th>
              <th className="px-3 py-2.5 text-right whitespace-nowrap">Credit</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a, i) => {
              const sub = subs.find(s => s.id === a.subId);
              const master = masters.find(m => m.id === sub?.masterId);
              const isDebit = ['Assets','Expenses'].includes(master?.nature ?? '');
              return (
                <tr key={a.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'bg-white':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans font-medium">{a.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{sub?.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{master?.nature}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{isDebit ? formatPKR(a.currentBalance) : '—'}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{!isDebit ? formatPKR(a.currentBalance) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-black text-white">
              <td colSpan={3} className="px-3 py-2.5 font-bold">TOTAL</td>
              <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">{formatPKR(accounts.filter(a => { const sub = subs.find(s => s.id === a.subId); const master = masters.find(m => m.id === sub?.masterId); return ['Assets','Expenses'].includes(master?.nature ?? ''); }).reduce((s, a) => s + a.currentBalance, 0))}</td>
              <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">{formatPKR(accounts.filter(a => { const sub = subs.find(s => s.id === a.subId); const master = masters.find(m => m.id === sub?.masterId); return !['Assets','Expenses'].includes(master?.nature ?? ''); }).reduce((s, a) => s + a.currentBalance, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
