import { useState } from 'react';
import { useEmployees } from '@/stores/useEmployees';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO } from '@/lib/formatDate';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { Employee } from '@/types';

const emptyForm = { name: '', cnic: '', phone: '', address: '', role: '', joiningDate: todayISO(), salaryType: 'monthly' as 'monthly'|'daily', salaryAmount: '', deductForAbsence: true, active: true };

export function EmployeesPage() {
  const { employees, advances, addEmployee, updateEmployee, removeEmployee, addAdvance, removeAdvance } = useEmployees();
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editing, setEditing] = useState<Employee|null>(null);
  const [form, setForm] = useState(emptyForm);

  const [advModal, setAdvModal] = useState(false);
  const [advForm, setAdvForm] = useState({ employeeId: '', date: todayISO(), amount: '', note: '' });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModal('add');
  }
  function openEdit(e: Employee) {
    setEditing(e);
    setForm({ name: e.name, cnic: e.cnic, phone: e.phone, address: e.address, role: e.role, joiningDate: e.joiningDate, salaryType: e.salaryType, salaryAmount: String(e.salaryAmount), deductForAbsence: e.deductForAbsence, active: e.active });
    setModal('edit');
  }
  function openAdvances(empId?: string) {
    setAdvForm({
      employeeId: empId || employees[0]?.id || '',
      date: todayISO(),
      amount: '',
      note: '',
    });
    setAdvModal(true);
  }
  function save() {
    if (!form.name.trim()) return;
    if (modal === 'add') {
      addEmployee({ id: `E${Date.now()}`, ...form, salaryAmount: Number(form.salaryAmount), active: form.active });
    } else if (editing) {
      updateEmployee({ ...editing, ...form, salaryAmount: Number(form.salaryAmount), active: form.active });
    }
    setModal(null);
  }
  function saveAdvance() {
    if (!advForm.employeeId || !advForm.amount || Number(advForm.amount) <= 0) return;
    addAdvance({
      id: `ADV-${Date.now()}`,
      employeeId: advForm.employeeId,
      date: advForm.date,
      amount: Number(advForm.amount),
      note: advForm.note.trim() || undefined,
    });
    setAdvForm(p => ({ ...p, amount: '', note: '' }));
  }

  useKeyboardShortcuts({
    'ctrl+n': () => openAdd(),
    f9: () => {
      if (modal) save();
      else if (advModal) saveAdvance();
    },
    escape: () => {
      setModal(null);
      setAdvModal(false);
    },
  });

  const empMap = Object.fromEntries(employees.map(e => [e.id, e.name]));

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">EMPLOYEES</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button onClick={() => openAdvances()} className="flex-1 sm:flex-none border-2 border-black bg-white px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-accent">
            ADVANCES ({advances.length})
          </button>
          <button onClick={openAdd} className="flex-1 sm:flex-none border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">+ NEW (Ctrl+N)</button>
        </div>
      </div>
      <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Name','Role','Phone','Salary Type','Salary','Joining','Status',''].map(h => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody>
            {employees.map((e, i) => (
              <tr key={e.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'bg-white':'bg-muted/50'}`}>
                <td className="px-3 py-2 font-sans font-medium whitespace-nowrap">{e.name}</td>
                <td className="px-3 py-2 whitespace-nowrap">{e.role}</td>
                <td className="px-3 py-2 whitespace-nowrap">{e.phone}</td>
                <td className="px-3 py-2 uppercase whitespace-nowrap">{e.salaryType}</td>
                <td className="px-3 py-2 font-bold whitespace-nowrap">{formatPKR(e.salaryAmount)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(e.joiningDate)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-1.5 border text-xs ${e.active ? 'border-success text-success' : 'border-danger text-danger'}`}>
                    {e.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-1">
                    <button onClick={() => openAdvances(e.id)} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs">Advances</button>
                    <button onClick={() => openEdit(e)} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                    <button onClick={() => { if(confirm('Delete?')) removeEmployee(e.id); }} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-black px-4 py-3 font-display text-lg bg-accent sticky top-0 z-10">
              {modal === 'add' ? 'NEW EMPLOYEE' : 'EDIT EMPLOYEE'}
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[{l:'Name',k:'name'},{l:'CNIC',k:'cnic'},{l:'Phone',k:'phone'},{l:'Role',k:'role'},{l:'Joining Date',k:'joiningDate',type:'date'}].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-mono uppercase mb-1">{f.l}</label>
                    <input type={f.type ?? 'text'} value={(form as any)[f.k]} onChange={e => setForm(p => ({...p, [f.k]: e.target.value}))}
                      className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Salary Type</label>
                  <select value={form.salaryType} onChange={e => setForm(p => ({...p, salaryType: e.target.value as any}))}
                    className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase mb-1">Salary Amount</label>
                  <input type="number" value={form.salaryAmount} onChange={e => setForm(p => ({...p, salaryAmount: e.target.value}))}
                    className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase mb-1">Address</label>
                <input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))}
                  className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input type="checkbox" checked={form.deductForAbsence} onChange={e => setForm(p => ({...p, deductForAbsence: e.target.checked}))} className="w-4 h-4 border-2 border-black" />
                  DEDUCT FOR ABSENCE
                </label>
                <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({...p, active: e.target.checked}))} className="w-4 h-4 border-2 border-black" />
                  ACTIVE
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press shadow-brutal hover:bg-black hover:text-white">SAVE (F9)</button>
                <button onClick={() => setModal(null)} className="flex-1 border-2 border-black bg-white py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {advModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-black px-4 py-3 font-display text-lg bg-accent flex justify-between items-center sticky top-0 z-10">
              <span>EMPLOYEE ADVANCES</span>
              <button onClick={() => setAdvModal(false)} className="text-sm font-mono font-bold border border-black px-2 py-0.5 bg-white hover:bg-black hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="border-2 border-black p-3 bg-muted/30 space-y-2">
                <div className="text-xs font-mono font-bold uppercase">Record New Advance</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Employee</label>
                    <select value={advForm.employeeId} onChange={e => setAdvForm(p => ({ ...p, employeeId: e.target.value }))}
                      className="w-full border-2 border-black px-2 py-1.5 font-mono text-xs bg-white focus:outline-none">
                      <option value="">— select —</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Date</label>
                    <input type="date" value={advForm.date} onChange={e => setAdvForm(p => ({ ...p, date: e.target.value }))}
                      className="w-full border-2 border-black bg-white px-2 py-1.5 font-mono text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Amount (PKR)</label>
                    <input type="number" value={advForm.amount} onChange={e => setAdvForm(p => ({ ...p, amount: e.target.value }))} placeholder="0"
                      className="w-full border-2 border-black bg-white px-2 py-1.5 font-mono text-xs focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase mb-1">Note</label>
                    <input value={advForm.note} onChange={e => setAdvForm(p => ({ ...p, note: e.target.value }))} placeholder="Optional note"
                      className="w-full border-2 border-black bg-white px-2 py-1.5 font-mono text-xs focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button onClick={saveAdvance} className="w-full sm:w-auto border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
                    + ADD ADVANCE (F9)
                  </button>
                </div>
              </div>

              <div className="border-2 border-black max-h-64 overflow-x-auto overflow-y-auto bg-white">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Date</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap">Employee</th>
                      <th className="px-3 py-2 text-left">Note</th>
                      <th className="px-3 py-2 text-right whitespace-nowrap">Amount</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {advances.map((a, idx) => (
                      <tr key={a.id} className={`border-b border-black/20 ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/50'}`}>
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(a.date)}</td>
                        <td className="px-3 py-2 font-sans font-medium whitespace-nowrap">{empMap[a.employeeId] ?? a.employeeId}</td>
                        <td className="px-3 py-2 text-gray-600">{a.note ?? '—'}</td>
                        <td className="px-3 py-2 text-right font-bold text-danger whitespace-nowrap">{formatPKR(a.amount)}</td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button onClick={() => removeAdvance(a.id)} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                        </td>
                      </tr>
                    ))}
                    {advances.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-6 text-gray-400 bg-white">No salary advances recorded</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
