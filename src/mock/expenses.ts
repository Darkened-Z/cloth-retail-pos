import type { ExpenseVoucher } from '@/types';

function iso(daysAgo: number): string {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// Helper: first day of a given month offset (0 = this month, 1 = last month, etc.)
function monthStart(monthsAgo: number): number {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return Math.ceil((now.getTime() - t.getTime()) / 86400000);
}

const expenseTypes = [
  { accountId: 'A810', accountName: 'Electricity Bill', amounts: [8000, 9500, 11000, 10500] },
  { accountId: 'A811', accountName: 'Gas Bill',          amounts: [3000, 3500, 4000, 3200] },
  { accountId: 'A820', accountName: 'Shop Rent',         amounts: [35000] },
  { accountId: 'A830', accountName: 'Miscellaneous Expense', amounts: [2000, 3000, 5000, 1500, 2500, 4000] },
  { accountId: 'A800', accountName: 'Staff Salaries',    amounts: [280000] },
  { accountId: 'A831', accountName: 'Repair & Maintenance', amounts: [4500, 7000, 3000] },
  { accountId: 'A832', accountName: 'Packaging Supplies',   amounts: [6000, 8000, 5500] },
  { accountId: 'A833', accountName: 'Transport / Freight',  amounts: [2500, 3500, 4500] },
];

const entries: Array<{ daysAgo: number; typeIdx: number; amtIdx: number; paidFrom: 'cash' | 'bank' }> = [];
let seq = 0;

// Monthly fixed: Rent + Salaries for current month, last month, 2 months ago
for (let m = 0; m < 3; m++) {
  const base = monthStart(m);
  // Salaries on 1st of each month (base days approx)
  entries.push({ daysAgo: base - 1, typeIdx: 4, amtIdx: 0, paidFrom: 'bank' });
  // Rent on 5th of each month
  entries.push({ daysAgo: Math.max(base - 5, 0), typeIdx: 2, amtIdx: 0, paidFrom: 'bank' });
  // Electricity mid month
  entries.push({ daysAgo: Math.max(base - 15, 0), typeIdx: 0, amtIdx: m % 4, paidFrom: 'bank' });
  // Gas mid month
  entries.push({ daysAgo: Math.max(base - 15, 0), typeIdx: 1, amtIdx: m % 4, paidFrom: 'cash' });
}

// Weekly misc / transport / packaging this month (last 28 days)
const weeklyTypes = [3, 5, 6, 7];
for (let d = 2; d <= 28; d += 5) {
  weeklyTypes.forEach((ti, wi) => {
    const et = expenseTypes[ti];
    entries.push({ daysAgo: d + wi, typeIdx: ti, amtIdx: seq % et.amounts.length, paidFrom: (seq % 2 === 0 ? 'cash' : 'bank') });
    seq++;
  });
}

// Additional misc in last 2 months
for (let d = 29; d <= 89; d += 7) {
  entries.push({ daysAgo: d, typeIdx: 3, amtIdx: seq % expenseTypes[3].amounts.length, paidFrom: 'cash' });
  entries.push({ daysAgo: d + 2, typeIdx: 5, amtIdx: seq % expenseTypes[5].amounts.length, paidFrom: 'bank' });
  seq++;
}

export const mockExpenses: ExpenseVoucher[] = entries
  .filter(e => e.daysAgo >= 0)
  .map((e, i) => {
    const et = expenseTypes[e.typeIdx];
    const amount = et.amounts[e.amtIdx % et.amounts.length];
    return {
      id: `EXP-${String(i + 1).padStart(3, '0')}`,
      date: iso(e.daysAgo),
      accountId: et.accountId,
      accountName: et.accountName,
      amount,
      description: et.accountName,
      paidFrom: e.paidFrom,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));
