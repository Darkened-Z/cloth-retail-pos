import { useState, useEffect } from 'react';
import { useEmployees } from '@/stores/useEmployees';
import { formatPKR } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { PayrollRun } from '@/types';

export function PayrollPage() {
  const { employees, attendance, advances, payrollRuns, savePayrollRun } = useEmployees();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [generated, setGenerated] = useState(false);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [previewSlips, setPreviewSlips] = useState<PayrollRun[] | null>(null);

  function buildRuns(targetMonth: string, currentRuns: PayrollRun[], markSlipGenerated: boolean): PayrollRun[] {
    return employees.filter(e => e.active).map(emp => {
      const monthAtt = attendance.filter(a => a.employeeId === emp.id && a.date.startsWith(targetMonth));
      const presentDays = monthAtt.filter(a => a.status === 'P').length + monthAtt.filter(a => a.status === 'H').length * 0.5;
      const absentDays = monthAtt.filter(a => a.status === 'A').length;
      const daysInMonth = new Date(Number(targetMonth.slice(0, 4)), Number(targetMonth.slice(5, 7)), 0).getDate();
      let basicSalary = emp.salaryAmount;
      let absenceDeduction = 0;
      if (emp.salaryType === 'daily') {
        basicSalary = emp.salaryAmount * presentDays;
      } else if (emp.deductForAbsence && absentDays > 0) {
        absenceDeduction = (emp.salaryAmount / daysInMonth) * absentDays;
      }
      const empAdvances = advances.filter(a => a.employeeId === emp.id && a.date.startsWith(targetMonth)).reduce((s, a) => s + a.amount, 0);

      const currentRun = currentRuns.find(r => r.employeeId === emp.id && r.month === targetMonth);
      const savedRun = payrollRuns.find(r => r.employeeId === emp.id && r.month === targetMonth);
      const bonus = currentRun?.bonus ?? savedRun?.bonus ?? 0;
      const deduction = currentRun?.deduction ?? savedRun?.deduction ?? 0;

      const netPay = Math.max(0, basicSalary - absenceDeduction - empAdvances + bonus - deduction);
      return {
        month: targetMonth,
        employeeId: emp.id,
        basicSalary,
        presentDays,
        absenceDeduction,
        advances: empAdvances,
        bonus,
        deduction,
        netPay,
        slipGenerated: markSlipGenerated ? true : (savedRun?.slipGenerated ?? false),
      };
    });
  }

  useEffect(() => {
    const initial = buildRuns(month, [], false);
    setRuns(initial);
    setGenerated(initial.length > 0);
  }, [month, employees.length]);

  function generate() {
    const result = buildRuns(month, runs, true);
    result.forEach(r => savePayrollRun(r));
    setRuns(result);
    setGenerated(true);
  }

  function updateRunField(employeeId: string, field: 'bonus' | 'deduction', value: number) {
    setRuns(prev =>
      prev.map(r => {
        if (r.employeeId !== employeeId) return r;
        const bonus = field === 'bonus' ? value : r.bonus;
        const deduction = field === 'deduction' ? value : r.deduction;
        const netPay = Math.max(0, r.basicSalary - r.absenceDeduction - r.advances + bonus - deduction);
        const updated: PayrollRun = { ...r, bonus, deduction, netPay, slipGenerated: true };
        savePayrollRun(updated);
        return updated;
      })
    );
  }

  function saveAll() {
    runs.forEach(r => savePayrollRun({ ...r, slipGenerated: true }));
    alert('Payroll saved!');
  }

  useKeyboardShortcuts({
    f9: () => generate(),
    'ctrl+p': () => window.print(),
    escape: () => setPreviewSlips(null),
  });

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">PAYROLL</h1>
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="flex-1 sm:flex-none border-2 border-black bg-white px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button onClick={generate} className="flex-1 sm:flex-none border-2 border-black bg-accent px-4 py-2 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white whitespace-nowrap">
            GENERATE (F9)
          </button>
          {generated && runs.length > 0 && (
            <button onClick={() => setPreviewSlips(runs)} className="w-full sm:w-auto border-2 border-black bg-white px-4 py-2 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white whitespace-nowrap">
              PRINT ALL SLIPS
            </button>
          )}
        </div>
      </div>

      {generated && (
        <>
          <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white mb-4">
            <table className="w-full text-xs font-mono">
              <thead className="bg-black text-white">
                <tr>
                  {['Employee','Role','Basic','Present','Absence Ded.','Advance','Bonus','Deduction','Net Pay',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => {
                  const emp = employees.find(e => e.id === r.employeeId);
                  return (
                    <tr key={r.employeeId} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'bg-white':'bg-muted/50'}`}>
                      <td className="px-3 py-2 font-sans font-medium whitespace-nowrap">{emp?.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{emp?.role}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatPKR(r.basicSalary)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.presentDays}</td>
                      <td className="px-3 py-2 text-danger whitespace-nowrap">{formatPKR(r.absenceDeduction)}</td>
                      <td className="px-3 py-2 text-danger whitespace-nowrap">{formatPKR(r.advances)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          value={r.bonus || ''}
                          placeholder="0"
                          onChange={e => updateRunField(r.employeeId, 'bonus', Number(e.target.value) || 0)}
                          className="w-20 border border-black px-2 py-1 font-mono text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <input
                          type="number"
                          value={r.deduction || ''}
                          placeholder="0"
                          onChange={e => updateRunField(r.employeeId, 'deduction', Number(e.target.value) || 0)}
                          className="w-20 border border-black px-2 py-1 font-mono text-xs bg-white focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </td>
                      <td className="px-3 py-2 font-bold text-success whitespace-nowrap">{formatPKR(r.netPay)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => setPreviewSlips([r])}
                          className="border border-black bg-white px-2 py-1 text-xs font-mono font-bold hover:bg-accent whitespace-nowrap"
                        >
                          Slip / Print
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-black text-white">
                  <td colSpan={8} className="px-3 py-2 font-bold whitespace-nowrap">TOTAL NET PAY</td>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">{formatPKR(runs.reduce((s, r) => s + r.netPay, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveAll} className="flex-1 sm:flex-none border-2 border-black bg-accent px-6 py-2.5 text-sm font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
              SAVE PAYROLL
            </button>
            <button onClick={() => setPreviewSlips(runs)} className="flex-1 sm:flex-none border-2 border-black bg-white px-6 py-2.5 text-sm font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
              PRINT ALL SLIPS
            </button>
          </div>
        </>
      )}

      {previewSlips && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="border-b-2 border-black px-4 py-3 font-display text-lg bg-accent flex flex-wrap justify-between items-center gap-2 print:hidden sticky top-0 z-10">
              <span>SALARY SLIP PREVIEW ({month})</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="border-2 border-black bg-black text-white px-3 py-1 text-xs font-mono font-bold hover:bg-white hover:text-black"
                >
                  PRINT (Ctrl+P)
                </button>
                <button
                  onClick={() => setPreviewSlips(null)}
                  className="border-2 border-black bg-white px-2 py-1 text-xs font-mono font-bold hover:bg-black hover:text-white"
                >
                  CLOSE (Esc)
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              {previewSlips.map(slip => {
                const emp = employees.find(e => e.id === slip.employeeId);
                return (
                  <div key={slip.employeeId} className="border-2 border-black p-4 bg-white shadow-brutal space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b-2 border-black pb-2">
                      <div>
                        <div className="font-display text-lg uppercase">SALARY SLIP</div>
                        <div className="font-sans font-bold text-base">{emp?.name ?? slip.employeeId}</div>
                        <div className="font-mono text-xs text-gray-600">
                          Role: {emp?.role ?? '—'} | Phone: {emp?.phone ?? '—'}
                        </div>
                      </div>
                      <div className="sm:text-right font-mono text-xs">
                        <div className="font-bold uppercase bg-accent px-2 py-1 border border-black inline-block">
                          MONTH: {slip.month}
                        </div>
                        <div className="mt-1">Type: {emp?.salaryType?.toUpperCase() ?? 'MONTHLY'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                      <div className="flex justify-between border-b border-black/20 py-1">
                        <span>Basic Salary:</span>
                        <span className="font-bold whitespace-nowrap">{formatPKR(slip.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 py-1">
                        <span>Present Days:</span>
                        <span className="font-bold whitespace-nowrap">{slip.presentDays}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 py-1 text-danger">
                        <span>Absence Deduction:</span>
                        <span className="font-bold whitespace-nowrap">-{formatPKR(slip.absenceDeduction)}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 py-1 text-danger">
                        <span>Advance Deduction:</span>
                        <span className="font-bold whitespace-nowrap">-{formatPKR(slip.advances)}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 py-1 text-success">
                        <span>Bonus:</span>
                        <span className="font-bold whitespace-nowrap">+{formatPKR(slip.bonus)}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/20 py-1 text-danger">
                        <span>Other Deduction:</span>
                        <span className="font-bold whitespace-nowrap">-{formatPKR(slip.deduction)}</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-black pt-2 flex justify-between items-center font-mono">
                      <span className="text-sm font-bold uppercase">NET PAYABLE</span>
                      <span className="text-lg font-black bg-accent px-3 py-1 border-2 border-black whitespace-nowrap">
                        {formatPKR(slip.netPay)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
