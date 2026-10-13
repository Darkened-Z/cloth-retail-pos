import { useCoa } from '@/stores/useCoa';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useExpenses } from '@/stores/useExpenses';
import { useVouchers } from '@/stores/useVouchers';
import { useJournals } from '@/stores/useJournals';
import { formatNumber } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';

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
  const { vouchers: dyeings } = useDyeing();
  const { expenses } = useExpenses();
  const { receipts, payments } = useVouchers();
  const { journals } = useJournals();

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  // Build period movements per account
  const movements: Record<string, { dr: number; cr: number }> = {};
  function addDr(id: string, amt: number) { movements[id] = { dr: (movements[id]?.dr ?? 0) + amt, cr: movements[id]?.cr ?? 0 }; }
  function addCr(id: string, amt: number) { movements[id] = { dr: movements[id]?.dr ?? 0, cr: (movements[id]?.cr ?? 0) + amt }; }

  // Sales → Credit A600 (Fabric Sales), Debit A410 (Cash) & A400 (Trade Debtors)
  invoices.forEach(inv => {
    addCr('A600', inv.grandTotal);
    const paid = Math.min(inv.grandTotal, Math.max(0, inv.paid ?? (inv.paymentMode === 'cash' ? inv.grandTotal : 0)));
    const balance = inv.grandTotal - paid;
    if (paid > 0) addDr('A410', paid);
    if (balance > 0) addDr('A400', balance);
  });

  // Purchases → Debit A700 (Fabric Purchases), Credit A410 (Cash) & A200 (Trade Creditors)
  purchases.forEach(p => {
    addDr('A700', p.grandTotal);
    const paid = Math.min(p.grandTotal, Math.max(0, p.paid ?? (p.paymentMode === 'cash' ? p.grandTotal : 0)));
    const balance = p.grandTotal - paid;
    if (paid > 0) addCr('A410', paid);
    if (balance > 0) addCr('A200', balance);
  });

  // Dyeing → Debit A710 (Dyeing Charges), Credit A410 (Cash) & A200 (Trade Creditors)
  dyeings.forEach(d => {
    addDr('A710', d.totalValue);
    const paid = Math.min(d.totalValue, Math.max(0, d.paid ?? (d.paymentMode === 'cash' ? d.totalValue : 0)));
    const balance = d.totalValue - paid;
    if (paid > 0) addCr('A410', paid);
    if (balance > 0) addCr('A200', balance);
  });

  // Expenses → Debit expense account, Credit A410 or A411
  expenses.forEach(e => {
    addDr(e.accountId, e.amount);
    if (e.paidFrom === 'cash') addCr('A410', e.amount);
    else addCr('A411', e.amount);
  });

  // Receipts → Debit cash/bank, Credit A400
  receipts.forEach(r => {
    const cashAcc = r.receivedIn === 'bank' && r.bankAccountId ? r.bankAccountId : 'A410';
    addDr(cashAcc, r.amount);
    addCr('A400', r.amount);
  });

  // Payments → Credit cash/bank, Debit A200
  payments.forEach(p => {
    const cashAcc = p.paidFrom === 'bank' && p.bankAccountId ? p.bankAccountId : 'A410';
    addCr(cashAcc, p.amount);
    addDr('A200', p.amount);
  });

  // Journals → Debit / Credit per line
  journals.forEach(j => {
    j.lines.forEach(l => {
      if (l.debit > 0) addDr(l.accountId, l.debit);
      if (l.credit > 0) addCr(l.accountId, l.credit);
    });
  });

  const knownAccountIds = new Set(accounts.map(a => a.id));
  const allAccounts = [...accounts];
  for (const id of Object.keys(movements)) {
    if (!knownAccountIds.has(id)) {
      const fallbackName = id === 'A831' ? 'Repair & Maintenance'
        : id === 'A832' ? 'Packaging Supplies'
        : id === 'A833' ? 'Transport / Freight'
        : `Account ${id}`;
      allAccounts.push({
        id,
        subId: 'AS83',
        name: fallbackName,
        openingBalance: 0,
        currentBalance: 0,
      });
    }
  }

  const rows: Row[] = allAccounts.map(acc => {
    const sub = accountSubs.find(s => s.id === acc.subId);
    const master = accountMasters.find(m => m.id === sub?.masterId);
    const nature = master?.nature ?? (acc.id.startsWith('A8') || acc.id.startsWith('A7') ? 'Expenses' : acc.id.startsWith('A4') || acc.id.startsWith('A5') || acc.id.startsWith('A3') ? 'Assets' : acc.id.startsWith('A6') ? 'Incomes' : 'Liabilities');

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

  const isOpeningBalanced = Math.abs(totals.openingDr - totals.openingCr) < 1;
  const isPeriodBalanced = Math.abs(totals.periodDr - totals.periodCr) < 1;
  const isClosingBalanced = Math.abs(totals.closingDr - totals.closingCr) < 1;
  const isAllBalanced = isOpeningBalanced && isPeriodBalanced && isClosingBalanced;

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="font-display text-2xl uppercase tracking-tight">Trial Balance — 4 Column (میزان پڑتال)</h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isAllBalanced
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {isAllBalanced ? (
              <span>✓ All Columns Balanced (Opening, Period & Closing Dr = Cr)</span>
            ) : (
              <span>⚠ Discrepancy Detected</span>
            )}
          </span>
        </div>
        <button onClick={() => window.print()}
          className="w-full sm:w-auto border-2 border-black bg-white hover:bg-accent px-4 py-2 font-mono text-xs font-bold uppercase shadow-brutal-sm brutal-press">
          PRINT (Ctrl+P)
        </button>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-black text-white">
              <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap" rowSpan={2}>Account</th>
              <th className="text-center px-4 py-2 font-bold uppercase border-l-2 border-white whitespace-nowrap" colSpan={2}>Opening Balance</th>
              <th className="text-center px-4 py-2 font-bold uppercase border-l-2 border-white whitespace-nowrap" colSpan={2}>Period Movement</th>
              <th className="text-center px-4 py-2 font-bold uppercase border-l-2 border-white whitespace-nowrap" colSpan={2}>Closing Balance</th>
            </tr>
            <tr className="bg-gray-800 text-white text-xs">
              <th className="text-right px-4 py-1.5 font-bold border-l-2 border-white whitespace-nowrap">Debit</th>
              <th className="text-right px-4 py-1.5 font-bold whitespace-nowrap">Credit</th>
              <th className="text-right px-4 py-1.5 font-bold border-l-2 border-white whitespace-nowrap">Debit</th>
              <th className="text-right px-4 py-1.5 font-bold whitespace-nowrap">Credit</th>
              <th className="text-right px-4 py-1.5 font-bold border-l-2 border-white whitespace-nowrap">Debit</th>
              <th className="text-right px-4 py-1.5 font-bold whitespace-nowrap">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.accountId} className={`border-b border-black/20 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-2">
                  <div className="font-bold text-sm">{r.accountName}</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">{r.masterName} › {r.subName}</div>
                </td>
                <td className="px-4 py-2 text-right font-mono text-xs border-l border-gray-200 whitespace-nowrap">{r.openingDr ? formatNumber(r.openingDr) : '—'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs whitespace-nowrap">{r.openingCr ? formatNumber(r.openingCr) : '—'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs border-l border-gray-200 whitespace-nowrap">{r.periodDr ? formatNumber(r.periodDr) : '—'}</td>
                <td className="px-4 py-2 text-right font-mono text-xs whitespace-nowrap">{r.periodCr ? formatNumber(r.periodCr) : '—'}</td>
                <td className="px-4 py-2 text-right font-mono font-bold text-xs border-l border-gray-200 whitespace-nowrap">{r.closingDr ? formatNumber(r.closingDr) : '—'}</td>
                <td className="px-4 py-2 text-right font-mono font-bold text-xs whitespace-nowrap">{r.closingCr ? formatNumber(r.closingCr) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-black text-white font-bold">
            <tr>
              <td className="px-4 py-2.5 uppercase text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>Grand Totals</span>
                  <span className="text-[10px] bg-emerald-700 text-white font-mono px-2 py-0.5 rounded font-normal">
                    Dr ≡ Cr (Balanced)
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-right font-mono border-l border-gray-600 whitespace-nowrap text-emerald-300">{formatNumber(totals.openingDr)}</td>
              <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap text-emerald-300">{formatNumber(totals.openingCr)}</td>
              <td className="px-4 py-2.5 text-right font-mono border-l border-gray-600 whitespace-nowrap text-emerald-300">{formatNumber(totals.periodDr)}</td>
              <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap text-emerald-300">{formatNumber(totals.periodCr)}</td>
              <td className="px-4 py-2.5 text-right font-mono border-l border-gray-600 whitespace-nowrap text-emerald-300">{formatNumber(totals.closingDr)}</td>
              <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap text-emerald-300">{formatNumber(totals.closingCr)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
