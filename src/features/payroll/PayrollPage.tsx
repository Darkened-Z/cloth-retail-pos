import { useState } from 'react';
import { useEmployees } from '@/stores/useEmployees';
import { formatPKR } from '@/lib/formatNumber';
import type { PayrollRun } from '@/types';

export function PayrollPage() {
  const { employees, attendance, advances, payrollRuns, savePayrollRun } = useEmployees();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [generated, setGenerated] = useState(false);
  const [runs, setRuns] = useState<PayrollRun[]>([]);

  function generate() {
    const result: PayrollRun[] = employees.filter(e => e.active).map(emp => {
      const monthAtt = attendance.filter(a => a.employeeId === emp.id && a.date.startsWith(month));
      const presentDays = monthAtt.filter(a => a.status === 'P').length + monthAtt.filter(a => a.status === 'H').length * 0.5;
      const absentDays = monthAtt.filter(a => a.status === 'A').length;
      const daysInMonth = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate();
      let basicSalary = emp.salaryAmount;
      let absenceDeduction = 0;
      if (emp.salaryType === 'daily') {
        basicSalary = emp.salaryAmount * presentDays;
      } else if (emp.deductForAbsence && absentDays > 0) {
        absenceDeduction = (emp.salaryAmount / daysInMonth) * absentDays;
      }
      const empAdvances = advances.filter(a => a.employeeId === emp.id && a.date.startsWith(month)).reduce((s, a) => s + a.amount, 0);
      const netPay = basicSalary - absenceDeduction - empAdvances;
      return { month, employeeId: emp.id, basicSalary, presentDays, absenceDeduction, advances: empAdvances, bonus: 0, deduction: 0, netPay: Math.max(0, netPay), slipGenerated: false };
    });
    setRuns(result);
    setGenerated(true);
  }

  function saveAll() {
    runs.forEach(r => savePayrollRun(r));
    alert('Payroll saved!');
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">PAYROLL</h1>
        <div className="flex gap-2 items-center">
          <input type="month" value={month} onChange={e => { setMonth(e.target.value); setGenerated(false); }}
            className="border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          <button onClick={generate} className="border-2 border-black bg-accent px-4 py-2 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
            GENERATE
          </button>
        </div>
      </div>

      {generated && (
        <>
          <div className="border-2 border-black shadow-brutal overflow-auto mb-4">
            <table className="w-full text-xs font-mono">
              <thead className="bg-black text-white">
                <tr>{['Employee','Role','Basic','Present','Absence Ded.','Advance','Net Pay'].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
              </thead>
              <tbody>
                {runs.map((r, i) => {
                  const emp = employees.find(e => e.id === r.employeeId);
                  return (
                    <tr key={r.employeeId} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                      <td className="px-3 py-2 font-sans font-medium">{emp?.name}</td>
                      <td className="px-3 py-2">{emp?.role}</td>
                      <td className="px-3 py-2">{formatPKR(r.basicSalary)}</td>
                      <td className="px-3 py-2">{r.presentDays}</td>
                      <td className="px-3 py-2 text-danger">{formatPKR(r.absenceDeduction)}</td>
                      <td className="px-3 py-2 text-danger">{formatPKR(r.advances)}</td>
                      <td className="px-3 py-2 font-bold text-success">{formatPKR(r.netPay)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-black text-white">
                  <td colSpan={6} className="px-3 py-2 font-bold">TOTAL NET PAY</td>
                  <td className="px-3 py-2 font-bold">{formatPKR(runs.reduce((s,r) => s + r.netPay, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <button onClick={saveAll} className="border-2 border-black bg-accent px-6 py-2.5 text-sm font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
            SAVE PAYROLL
          </button>
        </>
      )}
    </div>
  );
}
