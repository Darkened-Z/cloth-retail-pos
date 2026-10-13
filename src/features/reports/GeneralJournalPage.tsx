import { useState, useMemo } from 'react';
import { useInvoices } from '@/stores/useInvoices';
import { usePurchase } from '@/stores/usePurchase';
import { useDyeing } from '@/stores/useDyeing';
import { useExpenses } from '@/stores/useExpenses';
import { useVouchers } from '@/stores/useVouchers';
import { useJournals } from '@/stores/useJournals';
import { useParties } from '@/stores/useParties';
import { useCoa } from '@/stores/useCoa';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { Printer, Search, CheckCircle2, BookOpen, Filter } from 'lucide-react';

type VoucherType = 'all' | 'sale' | 'purchase' | 'dyeing' | 'receipt' | 'payment' | 'expense' | 'journal';

interface JournalEntryLine {
  accountId: string;
  accountName: string;
  subName?: string;
  debit: number;
  credit: number;
  isCredit: boolean;
}

interface JournalEntry {
  id: string;
  date: string;
  serial: string;
  type: VoucherType;
  typeLabel: string;
  badgeClass: string;
  narration: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
}

export function GeneralJournalPage() {
  const { invoices } = useInvoices();
  const { vouchers: purchases } = usePurchase();
  const { vouchers: dyeings } = useDyeing();
  const { expenses } = useExpenses();
  const { receipts, payments } = useVouchers();
  const { journals } = useJournals();
  const { parties } = useParties();
  const { accounts, subs } = useCoa();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<VoucherType>('all');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => todayISO());

  useKeyboardShortcuts({
    'ctrl+p': () => window.print(),
  });

  const accountMap = useMemo(() => {
    const map = new Map<string, { name: string; subName: string }>();
    accounts.forEach(a => {
      const s = subs.find(sub => sub.id === a.subId);
      map.set(a.id, { name: a.name, subName: s?.name ?? '' });
    });
    return map;
  }, [accounts, subs]);

  const partyMap = useMemo(() => {
    return new Map<string, string>(parties.map(p => [p.id, p.name]));
  }, [parties]);

  // Aggregate and format all system transactions into double-entry journal entries
  const allEntries: JournalEntry[] = useMemo(() => {
    const list: JournalEntry[] = [];

    // 1. Sales Invoices
    invoices.forEach(inv => {
      const custName = partyMap.get(inv.customerId) ?? inv.customerId;
      const paid = inv.paid ?? (inv.paymentMode === 'cash' ? inv.grandTotal : 0);
      const balance = inv.balance ?? (inv.paymentMode === 'credit' ? inv.grandTotal : Math.max(0, inv.grandTotal - paid));

      const lines: JournalEntryLine[] = [];
      if (paid > 0) {
        lines.push({
          accountId: 'A410',
          accountName: accountMap.get('A410')?.name ?? 'Cash in Hand',
          subName: 'Cash & Bank',
          debit: paid,
          credit: 0,
          isCredit: false,
        });
      }
      if (balance > 0) {
        lines.push({
          accountId: 'A400',
          accountName: `Trade Debtors — ${custName}`,
          subName: 'Accounts Receivable',
          debit: balance,
          credit: 0,
          isCredit: false,
        });
      }
      lines.push({
        accountId: 'A600',
        accountName: accountMap.get('A600')?.name ?? 'Fabric Sales Revenue',
        subName: 'Operating Revenue',
        debit: 0,
        credit: inv.grandTotal,
        isCredit: true,
      });

      list.push({
        id: `sale-${inv.id}`,
        date: inv.date,
        serial: inv.serial,
        type: 'sale',
        typeLabel: 'Sales Invoice',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        narration: `Being sales invoice billed to ${custName} (${inv.lines.length} fabric items, ${inv.paymentMode} mode).`,
        lines,
        totalDebit: paid + balance,
        totalCredit: inv.grandTotal,
      });
    });

    // 2. Purchase Vouchers
    purchases.forEach(p => {
      const suppName = partyMap.get(p.supplierId) ?? p.supplierId;
      const paid = p.paid ?? (p.paymentMode === 'cash' ? p.grandTotal : 0);
      const balance = p.balance ?? (p.paymentMode === 'credit' ? p.grandTotal : Math.max(0, p.grandTotal - paid));

      const lines: JournalEntryLine[] = [
        {
          accountId: 'A700',
          accountName: accountMap.get('A700')?.name ?? 'Fabric Purchases',
          subName: 'Cost of Sales',
          debit: p.grandTotal,
          credit: 0,
          isCredit: false,
        },
      ];
      if (paid > 0) {
        lines.push({
          accountId: 'A410',
          accountName: accountMap.get('A410')?.name ?? 'Cash in Hand',
          subName: 'Cash & Bank',
          debit: 0,
          credit: paid,
          isCredit: true,
        });
      }
      if (balance > 0) {
        lines.push({
          accountId: 'A200',
          accountName: `Trade Creditors — ${suppName}`,
          subName: 'Accounts Payable',
          debit: 0,
          credit: balance,
          isCredit: true,
        });
      }

      list.push({
        id: `purchase-${p.id}`,
        date: p.date,
        serial: p.serial,
        type: 'purchase',
        typeLabel: 'Purchase Voucher',
        badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        narration: `Being grey/fabric goods purchased from ${suppName} (${p.lines.length} items).`,
        lines,
        totalDebit: p.grandTotal,
        totalCredit: paid + balance,
      });
    });

    // 3. Dyeing Vouchers
    dyeings.forEach(d => {
      const dyerName = partyMap.get(d.dyerId) ?? d.dyerId;
      const paid = d.paid ?? (d.paymentMode === 'cash' ? d.totalValue : 0);
      const balance = d.balance ?? (d.paymentMode === 'credit' || !d.paymentMode ? d.totalValue : Math.max(0, d.totalValue - paid));

      const lines: JournalEntryLine[] = [
        {
          accountId: 'A710',
          accountName: accountMap.get('A710')?.name ?? 'Dyeing Charges',
          subName: 'Direct Processing Cost',
          debit: d.totalValue,
          credit: 0,
          isCredit: false,
        },
      ];
      if (paid > 0) {
        lines.push({
          accountId: 'A410',
          accountName: accountMap.get('A410')?.name ?? 'Cash in Hand',
          subName: 'Cash & Bank',
          debit: 0,
          credit: paid,
          isCredit: true,
        });
      }
      if (balance > 0) {
        lines.push({
          accountId: 'A200',
          accountName: `Trade Creditors / Dyers — ${dyerName}`,
          subName: 'Accounts Payable',
          debit: 0,
          credit: balance,
          isCredit: true,
        });
      }

      list.push({
        id: `dyeing-${d.id}`,
        date: d.date,
        serial: d.serial,
        type: 'dyeing',
        typeLabel: 'Dyeing Voucher',
        badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
        narration: `Being fabric dyeing charges posted for ${dyerName} (${d.qtyIn}m processed @ ${formatPKR(d.ratePerMeter)}/m).`,
        lines,
        totalDebit: d.totalValue,
        totalCredit: paid + balance,
      });
    });

    // 4. Receipt Vouchers
    receipts.forEach(r => {
      const custName = partyMap.get(r.partyId) ?? r.partyId;
      const isBank = r.receivedIn === 'bank';
      const cashAccId = isBank && r.bankAccountId ? r.bankAccountId : 'A410';
      const cashAccName = accountMap.get(cashAccId)?.name ?? (isBank ? 'Bank Account' : 'Cash in Hand');

      list.push({
        id: `rcp-${r.id}`,
        date: r.date,
        serial: r.serial,
        type: 'receipt',
        typeLabel: 'Cash Receipt',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        narration: `Being cash received from customer ${custName}${r.description ? ` (${r.description})` : ''}.`,
        lines: [
          {
            accountId: cashAccId,
            accountName: cashAccName,
            subName: 'Cash & Bank',
            debit: r.amount,
            credit: 0,
            isCredit: false,
          },
          {
            accountId: 'A400',
            accountName: `Trade Debtors — ${custName}`,
            subName: 'Accounts Receivable',
            debit: 0,
            credit: r.amount,
            isCredit: true,
          },
        ],
        totalDebit: r.amount,
        totalCredit: r.amount,
      });
    });

    // 5. Payment Vouchers
    payments.forEach(p => {
      const partyName = partyMap.get(p.partyId) ?? p.partyId;
      const isBank = p.paidFrom === 'bank';
      const cashAccId = isBank && p.bankAccountId ? p.bankAccountId : 'A410';
      const cashAccName = accountMap.get(cashAccId)?.name ?? (isBank ? 'Bank Account' : 'Cash in Hand');

      list.push({
        id: `pay-${p.id}`,
        date: p.date,
        serial: p.serial,
        type: 'payment',
        typeLabel: 'Payment Voucher',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        narration: `Being payment issued to supplier/dyer ${partyName}${p.description ? ` (${p.description})` : ''}.`,
        lines: [
          {
            accountId: 'A200',
            accountName: `Trade Creditors — ${partyName}`,
            subName: 'Accounts Payable',
            debit: p.amount,
            credit: 0,
            isCredit: false,
          },
          {
            accountId: cashAccId,
            accountName: cashAccName,
            subName: 'Cash & Bank',
            debit: 0,
            credit: p.amount,
            isCredit: true,
          },
        ],
        totalDebit: p.amount,
        totalCredit: p.amount,
      });
    });

    // 6. Expense Vouchers
    expenses.forEach(e => {
      const expAcc = accountMap.get(e.accountId)?.name ?? e.accountId;
      const isBank = e.paidFrom === 'bank';
      const cashAccId = isBank ? 'A411' : 'A410';
      const cashAccName = isBank ? 'Bank — HBL' : 'Cash in Hand';

      list.push({
        id: `exp-${e.id}`,
        date: e.date,
        serial: `EXP-${e.id.slice(0, 6).toUpperCase()}`,
        type: 'expense',
        typeLabel: 'Expense Voucher',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        narration: `Being operating expense paid: ${e.description || expAcc}.`,
        lines: [
          {
            accountId: e.accountId,
            accountName: expAcc,
            subName: 'Operating Expense',
            debit: e.amount,
            credit: 0,
            isCredit: false,
          },
          {
            accountId: cashAccId,
            accountName: cashAccName,
            subName: 'Cash & Bank',
            debit: 0,
            credit: e.amount,
            isCredit: true,
          },
        ],
        totalDebit: e.amount,
        totalCredit: e.amount,
      });
    });

    // 7. Manual Journal Vouchers
    journals.forEach(j => {
      const entryLines: JournalEntryLine[] = j.lines.map(l => {
        const accInfo = accountMap.get(l.accountId);
        return {
          accountId: l.accountId,
          accountName: accInfo?.name ?? l.accountId,
          subName: accInfo?.subName,
          debit: l.debit || 0,
          credit: l.credit || 0,
          isCredit: (l.credit || 0) > 0,
        };
      });

      const totalDr = entryLines.reduce((s, l) => s + l.debit, 0);
      const totalCr = entryLines.reduce((s, l) => s + l.credit, 0);

      list.push({
        id: `jv-${j.id}`,
        date: j.date,
        serial: j.serial,
        type: 'journal',
        typeLabel: 'Journal Voucher',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        narration: j.narration ? `Being manual journal adjustment: ${j.narration}` : 'Being manual journal voucher.',
        lines: entryLines,
        totalDebit: totalDr,
        totalCredit: totalCr,
      });
    });

    // Sort chronologically (most recent first)
    return list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [invoices, purchases, dyeings, expenses, receipts, payments, journals, accountMap, partyMap]);

  // Filter entries based on search, date range, and voucher type
  const filteredEntries = useMemo(() => {
    return allEntries.filter(entry => {
      if (entry.date < fromDate || entry.date > toDate) return false;
      if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchSerial = entry.serial.toLowerCase().includes(q);
        const matchNarration = entry.narration.toLowerCase().includes(q);
        const matchAccount = entry.lines.some(l => l.accountName.toLowerCase().includes(q) || l.accountId.toLowerCase().includes(q));
        if (!matchSerial && !matchNarration && !matchAccount) return false;
      }
      return true;
    });
  }, [allEntries, fromDate, toDate, typeFilter, search]);

  const grandDebit = useMemo(() => filteredEntries.reduce((s, e) => s + e.totalDebit, 0), [filteredEntries]);
  const grandCredit = useMemo(() => filteredEntries.reduce((s, e) => s + e.totalCredit, 0), [filteredEntries]);
  const isBalanced = Math.abs(grandDebit - grandCredit) < 1;

  function setPreset(days: number) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setFromDate(d.toISOString().slice(0, 10));
    setToDate(todayISO());
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>General Journal (جنرل جرنل / روزنامچہ)</span>
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isBalanced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Balanced (Dr = Cr)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Book of original entry showing the exact Debit and Credit account breakdown for every voucher
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors print:hidden"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print Journal (Ctrl+P)</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="border border-slate-300 bg-white rounded-xl p-4 shadow-sm space-y-3.5 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by serial #, account title, party name, or narration..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-sans placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {/* Date Range Inputs & Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-xs font-medium text-slate-500">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-transparent border-0 text-xs font-mono font-semibold text-slate-800 p-0 focus:ring-0"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-transparent border-0 text-xs font-mono font-semibold text-slate-800 p-0 focus:ring-0"
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreset(0)}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPreset(7)}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium"
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setPreset(30)}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium"
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setFromDate('2020-01-01');
                  setToDate(todayISO());
                }}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 font-medium"
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* Voucher Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {[
            { id: 'all', label: `All Entries (${allEntries.length})` },
            { id: 'sale', label: 'Sales Invoices' },
            { id: 'purchase', label: 'Purchases' },
            { id: 'dyeing', label: 'Dyeing' },
            { id: 'receipt', label: 'Cash Receipts' },
            { id: 'payment', label: 'Payments' },
            { id: 'expense', label: 'Expenses' },
            { id: 'journal', label: 'Manual JVs' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTypeFilter(tab.id as VoucherType)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                typeFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main General Journal Table */}
      <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100/90 text-slate-700 border-b border-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-28">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Voucher Particulars & Accounts</th>
              <th className="px-4 py-3 text-left font-semibold w-28">L.F. / Code</th>
              <th className="px-4 py-3 text-right font-semibold w-36">Debit (PKR)</th>
              <th className="px-4 py-3 text-right font-semibold w-36">Credit (PKR)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  No journal entries found matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredEntries.map(entry => (
                <tr key={entry.id} className="align-top hover:bg-slate-50/50 transition-colors">
                  {/* Date Column */}
                  <td className="px-4 py-3 text-xs font-mono font-medium text-slate-600 whitespace-nowrap">
                    <div>{formatDate(entry.date)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{entry.date}</div>
                  </td>

                  {/* Particulars & Accounts Column */}
                  <td className="px-4 py-3">
                    {/* Header Strip with Voucher Reference & Type */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${entry.badgeClass}`}>
                        {entry.typeLabel}
                      </span>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {entry.serial}
                      </span>
                    </div>

                    {/* Debit and Credit Account Rows (Standard Accounting Indentation) */}
                    <div className="space-y-1 font-sans">
                      {entry.lines.map((line, idx) => (
                        <div
                          key={idx}
                          className={`flex items-baseline justify-between text-xs ${
                            line.isCredit ? 'pl-6 text-slate-700' : 'text-slate-900 font-semibold'
                          }`}
                        >
                          <div className="flex items-baseline gap-1.5">
                            {line.isCredit && <span className="text-slate-400 font-normal italic">To</span>}
                            <span>{line.accountName}</span>
                            {line.subName && (
                              <span className="text-[10.5px] text-slate-400 font-normal">
                                ({line.subName})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Narration */}
                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[11.5px] text-slate-500 italic">
                      ({entry.narration})
                    </div>
                  </td>

                  {/* L.F. / Account Codes Column */}
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    <div className="space-y-1">
                      {entry.lines.map((line, idx) => (
                        <div key={idx} className="h-4 leading-4">
                          {line.accountId}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Debit Column */}
                  <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                    <div className="space-y-1">
                      {entry.lines.map((line, idx) => (
                        <div key={idx} className="h-4 leading-4 font-semibold text-slate-900">
                          {line.debit > 0 ? formatPKR(line.debit) : '—'}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Credit Column */}
                  <td className="px-4 py-3 text-right font-mono text-xs whitespace-nowrap">
                    <div className="space-y-1">
                      {entry.lines.map((line, idx) => (
                        <div key={idx} className="h-4 leading-4 font-semibold text-slate-900">
                          {line.credit > 0 ? formatPKR(line.credit) : '—'}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Grand Totals */}
          <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-bold text-slate-900">
            <tr>
              <td colSpan={3} className="px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="uppercase text-xs tracking-wider">
                    Total Journal Entries: {filteredEntries.length} Vouchers
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold bg-emerald-100/70 border border-emerald-300 rounded px-2.5 py-0.5">
                    ✓ Total Dr = Total Cr
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm text-blue-700 whitespace-nowrap">
                {formatPKR(grandDebit)}
              </td>
              <td className="px-4 py-3.5 text-right font-mono text-sm text-blue-700 whitespace-nowrap">
                {formatPKR(grandCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
