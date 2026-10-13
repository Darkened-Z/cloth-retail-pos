import { useMemo } from 'react';
import { useCoa } from '@/stores/useCoa';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useExpenses } from '@/stores/useExpenses';
import { useVouchers } from '@/stores/useVouchers';
import { useJournals } from '@/stores/useJournals';
import { formatPKR } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { Printer, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TrialBalanceRow {
  accountId: string;
  accountName: string;
  subName: string;
  nature: string;
  debit: number;
  credit: number;
}

export function TrialBalancePage() {
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

  const { rows, totalDebit, totalCredit, isBalanced, difference } = useMemo(() => {
    // 1. Build period double-entry movements
    const movements: Record<string, { dr: number; cr: number }> = {};
    function addDr(id: string, amt: number) {
      if (!amt) return;
      movements[id] = { dr: (movements[id]?.dr ?? 0) + amt, cr: movements[id]?.cr ?? 0 };
    }
    function addCr(id: string, amt: number) {
      if (!amt) return;
      movements[id] = { dr: movements[id]?.dr ?? 0, cr: (movements[id]?.cr ?? 0) + amt };
    }

    // Sales: Credit Revenue (A600), Debit Cash (A410) & Debtors (A400)
    invoices.forEach(inv => {
      addCr('A600', inv.grandTotal);
      const paid = inv.paid ?? (inv.paymentMode === 'cash' ? inv.grandTotal : 0);
      const balance = inv.balance ?? (inv.paymentMode === 'credit' ? inv.grandTotal : Math.max(0, inv.grandTotal - paid));
      if (paid > 0) addDr('A410', paid);
      if (balance > 0) addDr('A400', balance);
    });

    // Purchases: Debit Purchases (A700), Credit Cash (A410) & Creditors (A200)
    purchases.forEach(p => {
      addDr('A700', p.grandTotal);
      const paid = p.paid ?? (p.paymentMode === 'cash' ? p.grandTotal : 0);
      const balance = p.balance ?? (p.paymentMode === 'credit' ? p.grandTotal : Math.max(0, p.grandTotal - paid));
      if (paid > 0) addCr('A410', paid);
      if (balance > 0) addCr('A200', balance);
    });

    // Dyeing: Debit Dyeing Charges (A710), Credit Cash (A410) & Dyers/Creditors (A200)
    dyeings.forEach(d => {
      addDr('A710', d.totalValue);
      const paid = d.paid ?? (d.paymentMode === 'cash' ? d.totalValue : 0);
      const balance = d.balance ?? (d.paymentMode === 'credit' || !d.paymentMode ? d.totalValue : Math.max(0, d.totalValue - paid));
      if (paid > 0) addCr('A410', paid);
      if (balance > 0) addCr('A200', balance);
    });

    // Expenses: Debit Expense Account, Credit Cash (A410) or Bank (A411)
    expenses.forEach(e => {
      addDr(e.accountId, e.amount);
      if (e.paidFrom === 'cash') addCr('A410', e.amount);
      else addCr('A411', e.amount);
    });

    // Receipts: Debit Cash (A410) or Bank, Credit Debtors (A400)
    receipts.forEach(r => {
      const cashAcc = r.receivedIn === 'bank' && r.bankAccountId ? r.bankAccountId : 'A410';
      addDr(cashAcc, r.amount);
      addCr('A400', r.amount);
    });

    // Payments: Debit Creditors (A200), Credit Cash (A410) or Bank
    payments.forEach(p => {
      const cashAcc = p.paidFrom === 'bank' && p.bankAccountId ? p.bankAccountId : 'A410';
      addDr('A200', p.amount);
      addCr(cashAcc, p.amount);
    });

    // Journals: Multi-line manual Debits and Credits
    journals.forEach(j => {
      j.lines.forEach(l => {
        if (l.debit > 0) addDr(l.accountId, l.debit);
        if (l.credit > 0) addCr(l.accountId, l.credit);
      });
    });

    // 2. Compute closing Debit and Credit balances per account
    const calculatedRows: TrialBalanceRow[] = accounts
      .map(acc => {
        const sub = accountSubs.find(s => s.id === acc.subId);
        const master = accountMasters.find(m => m.id === sub?.masterId);
        const nature = master?.nature ?? '';

        const openingDr = acc.openingBalance > 0 && ['Assets', 'Expenses'].includes(nature) ? acc.openingBalance : 0;
        const openingCr = acc.openingBalance > 0 && ['Capital', 'Liabilities', 'Incomes'].includes(nature) ? acc.openingBalance : 0;

        const periodDr = movements[acc.id]?.dr ?? 0;
        const periodCr = movements[acc.id]?.cr ?? 0;

        const netDr = openingDr + periodDr;
        const netCr = openingCr + periodCr;

        const closingDr = netDr > netCr ? Math.round(netDr - netCr) : 0;
        const closingCr = netCr > netDr ? Math.round(netCr - netDr) : 0;

        return {
          accountId: acc.id,
          accountName: acc.name,
          subName: sub?.name ?? '—',
          nature,
          debit: closingDr,
          credit: closingCr,
        };
      })
      .filter(r => r.debit > 0 || r.credit > 0);

    const totalDebit = calculatedRows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = calculatedRows.reduce((s, r) => s + r.credit, 0);
    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = diff < 1;

    return {
      rows: calculatedRows,
      totalDebit,
      totalCredit,
      isBalanced,
      difference: diff,
    };
  }, [accounts, accountSubs, accountMasters, invoices, purchases, dyeings, expenses, receipts, payments, journals]);

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Trial Balance (میزان پڑتال)
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isBalanced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isBalanced ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Balanced (Debit = Credit)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Difference: {formatPKR(difference)}</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Double-entry ledger audit of all accounts, opening balances, and period movements
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors print:hidden"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print (Ctrl+P)</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="border border-slate-300 rounded-xl overflow-x-auto bg-white shadow-sm">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-24">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Account Title</th>
              <th className="px-4 py-3 text-left font-semibold">Sub-Group</th>
              <th className="px-4 py-3 text-left font-semibold">Nature</th>
              <th className="px-4 py-3 text-right font-semibold w-36">Debit (PKR)</th>
              <th className="px-4 py-3 text-right font-semibold w-36">Credit (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {rows.map(r => (
              <tr key={r.accountId} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500 font-medium">
                  {r.accountId}
                </td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {r.accountName}
                </td>
                <td className="px-4 py-2.5 text-slate-600 text-xs whitespace-nowrap">
                  {r.subName}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    {r.nature}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                  {r.debit > 0 ? formatPKR(r.debit) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                  {r.credit > 0 ? formatPKR(r.credit) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
            <tr>
              <td colSpan={4} className="px-4 py-3 uppercase text-xs tracking-wider">
                Total Balance
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-blue-700 whitespace-nowrap">
                {formatPKR(totalDebit)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-blue-700 whitespace-nowrap">
                {formatPKR(totalCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
