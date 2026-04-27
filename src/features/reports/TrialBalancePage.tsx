import { useCoa } from '@/stores/useCoa';
import { formatPKR } from '@/lib/formatNumber';

export function TrialBalancePage() {
  const { masters, subs, accounts } = useCoa();

  const total = accounts.reduce((s, a) => s + a.currentBalance, 0);

  return (
    <div className="p-4">
      <h1 className="font-display text-2xl mb-4">TRIAL BALANCE</h1>
      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-3 py-2 text-left">Account</th>
              <th className="px-3 py-2 text-left">Sub-Group</th>
              <th className="px-3 py-2 text-left">Nature</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a, i) => {
              const sub = subs.find(s => s.id === a.subId);
              const master = masters.find(m => m.id === sub?.masterId);
              const isDebit = ['Assets','Expenses'].includes(master?.nature ?? '');
              return (
                <tr key={a.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans font-medium">{a.name}</td>
                  <td className="px-3 py-2">{sub?.name}</td>
                  <td className="px-3 py-2">{master?.nature}</td>
                  <td className="px-3 py-2 text-right">{isDebit ? formatPKR(a.currentBalance) : '—'}</td>
                  <td className="px-3 py-2 text-right">{!isDebit ? formatPKR(a.currentBalance) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-black text-white">
              <td colSpan={3} className="px-3 py-2 font-bold">TOTAL</td>
              <td className="px-3 py-2 text-right font-bold">{formatPKR(accounts.filter(a => { const sub = subs.find(s => s.id === a.subId); const master = masters.find(m => m.id === sub?.masterId); return ['Assets','Expenses'].includes(master?.nature ?? ''); }).reduce((s, a) => s + a.currentBalance, 0))}</td>
              <td className="px-3 py-2 text-right font-bold">{formatPKR(accounts.filter(a => { const sub = subs.find(s => s.id === a.subId); const master = masters.find(m => m.id === sub?.masterId); return !['Assets','Expenses'].includes(master?.nature ?? ''); }).reduce((s, a) => s + a.currentBalance, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
