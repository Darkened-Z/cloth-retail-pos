import { useCoa } from '@/stores/useCoa';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useExpenses } from '@/stores/useExpenses';
import { useVouchers } from '@/stores/useVouchers';
import { formatNumber } from '@/lib/formatNumber';

interface Row {
  accountId: string;
  accountName: string;
  subName: string;
  masterName: string;
  nature: string;
  openingDr: number;
  openingCr: number;
  periodDr: number;
  periodCr: number;
  closingDr: number;
  closingCr: number;
}

export function TrialBalance4ColPage() {
  const { accounts, subs: accountSubs, masters: accountMasters } = useCoa();
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { expenses } = useExpenses();
  const { receipts, payments } = useVouchers();

  // Build period movements per account
  const movements: Record<string, { dr: number; cr: number }> = {};
  function addDr(id: string, amt: number) { movements[id] = { dr: (movements[id]?.dr ?? 0) + amt, cr: movements[id]?.cr ?? 0 }; }
  function addCr(id: string, amt: number) { movements[id] = { dr: movements[id]?.dr ?? 0, cr: (movements[id]?.cr ?? 0) + amt }; }

  // Sales → Credit A600 (Fabric Sales), Debit A400 (Trade Debtors) or A410 (Cash)
  invoices.forEach(inv => {
    addCr('A600', inv.grandTotal);
    if (inv.paymentMode === 'cash') addDr('A410', inv.grandTotal);
    else addDr('A400', inv.grandTotal);
  });

  // Purchases → Debit A700, Credit A200 or A410
  purchases.forEach(p => {
    addDr('A700', p.grandTotal);
    if (p.paymentMode === 'cash') addCr('A410', p.grandTotal);
    else addCr('A200', p.grandTotal);
  });

  // Expenses → Debit expense account, Credit A410 or A411
  expenses.forEach(e => {
    addDr(e.accountId, e.amount);
    if (e.paidFrom === 'cash') addCr('A410', e.amount);
    else addCr('A411', e.amount);
  });

  // Receipts → Debit cash/bank, Credit A400
  receipts.forEach(r => {
    const cashAcc = r.bankAccountId ?? 'A410';
    addDr(cashAcc, r.amount);
    addCr('A400', r.amount);
  });

  // Payments → Credit cash/bank, Debit A200
  payments.forEach(p => {
    const cashAcc = p.bankAccountId ?? 'A410';
    addCr(cashAcc, p.amount);
    addDr('A200', p.amount);
  });

  const rows: Row[] = accounts.map(acc => {
    const sub = accountSubs.find(s => s.id === acc.subId);
    const master = accountMasters.find(m => m.id === sub?.masterId);
    const nature = master?.nature ?? '';

    const openingDr = acc.openingBalance >= 0 && ['Assets', 'Expenses'].includes(nature) ? acc.openingBalance : 0;
    const openingCr = acc.openingBalance >= 0 && ['Capital', 'Liabilities', 'Incomes'].includes(nature) ? acc.openingBalance : 0;

    const periodDr = movements[acc.id]?.dr ?? 0;
    const periodCr = movements[acc.id]?.cr ?? 0;

    const netDr = openingDr + periodDr;
    const netCr = openingCr + periodCr;
    const closingDr = netDr > netCr ? netDr - netCr : 0;
    const closingCr = netCr > netDr ? netCr - netDr : 0;

    return {
      accountId: acc.id,
      accountName: acc.name,
      subName: sub?.name ?? '',
      masterName: master?.name ?? '',
      nature,
      openingDr, openingCr,
      periodDr, periodCr,
      closingDr, closingCr,
    };
  }).filter(r => r.openingDr || r.openingCr || r.periodDr || r.periodCr);

  const totals = rows.reduce((acc, r) => ({
    openingDr: acc.openingDr + r.openingDr,
    openingCr: acc.openingCr + r.openingCr,
    periodDr: acc.periodDr + r.periodDr,
    periodCr: acc.periodCr + r.periodCr,
    closingDr: acc.closingDr + r.closingDr,
    closingCr: acc.closingCr + r.closingCr,
  }), { openingDr: 0, openingCr: 0, periodDr: 0, periodCr: 0, closingDr: 0, closingCr: 0 });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-black uppercase tracking-tight">Trial Balance — 4 Column</h1>

      <div className="border-2 border-black overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-left px-4 py-2 font-bold uppercase" rowSpan={2}>Account</th>
              <th className="text-center px-4 py-2 font-bold uppercase border-l-2 border-white" colSpan={2}>Opening Balance</th>
              <th className="text-center px-4 py-2 font-bold uppercase border-l-2 border-white" colSpan={2}>Period Movement</th>
              <th className="text-center px-4 py-2 font-bold uppercase border-l-2 border-white" colSpan={2}>Closing Balance</th>
            </tr>
            <tr className="bg-gray-800 text-white text-xs">
              <th className="text-right px-4 py-1 font-bold border-l-2 border-white">Debit</th>
              <th className="text-right px-4 py-1 font-bold">Credit</th>
              <th className="text-right px-4 py-1 font-bold border-l-2 border-white">Debit</th>
              <th className="text-right px-4 py-1 font-bold">Credit</th>
              <th className="text-right px-4 py-1 font-bold border-l-2 border-white">Debit</th>
              <th className="text-right px-4 py-1 font-bold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.accountId} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2">
                  <div className="font-bold text-sm">{r.accountName}</div>
                  <div className="text-xs text-gray-500">{r.masterName} › {r.subName}</div>
                </td>
                <td className="px-4 py-2 text-right font-mono text-xs border-l border-gray-200">{r.openingDr ? formatNumber(r.openingDr) : '-'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{r.openingCr ? formatNumber(r.openingCr) : '-'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs border-l border-gray-200">{r.periodDr ? formatNumber(r.periodDr) : '-'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs">{r.periodCr ? formatNumber(r.periodCr) : '-'}</td>
                <td className="px-4 py-2 text-right font-mono font-bold text-xs border-l border-gray-200">{r.closingDr ? formatNumber(r.closingDr) : '-'}</td>
                <td className="px-4 py-2 text-right font-mono font-bold text-xs">{r.closingCr ? formatNumber(r.closingCr) : '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-black text-white font-bold">
            <tr>
              <td className="px-4 py-2 uppercase text-sm">Totals</td>
              <td className="px-4 py-2 text-right font-mono border-l border-gray-600">{formatNumber(totals.openingDr)}</td>
              <td className="px-4 py-2 text-right font-mono">{formatNumber(totals.openingCr)}</td>
              <td className="px-4 py-2 text-right font-mono border-l border-gray-600">{formatNumber(totals.periodDr)}</td>
              <td className="px-4 py-2 text-right font-mono">{formatNumber(totals.periodCr)}</td>
              <td className="px-4 py-2 text-right font-mono border-l border-gray-600">{formatNumber(totals.closingDr)}</td>
              <td className="px-4 py-2 text-right font-mono">{formatNumber(totals.closingCr)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
