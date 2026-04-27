import { useState } from 'react';
import { useEmployees } from '@/stores/useEmployees';
import { formatPKR } from '@/lib/formatNumber';
import { formatDate, todayISO } from '@/lib/formatDate';
import type { Employee } from '@/types';

const emptyForm = { name: '', cnic: '', phone: '', address: '', role: '', joiningDate: todayISO(), salaryType: 'monthly' as 'monthly'|'daily', salaryAmount: '', deductForAbsence: true };

export function EmployeesPage() {
  const { employees, addEmployee, updateEmployee, removeEmployee } = useEmployees();
  const [modal, setModal] = useState<'add'|'edit'|null>(null);
  const [editing, setEditing] = useState<Employee|null>(null);
  const [form, setForm] = useState(emptyForm);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModal('add');
  }
  function openEdit(e: Employee) {
    setEditing(e);
    setForm({ name: e.name, cnic: e.cnic, phone: e.phone, address: e.address, role: e.role, joiningDate: e.joiningDate, salaryType: e.salaryType, salaryAmount: String(e.salaryAmount), deductForAbsence: e.deductForAbsence });
    setModal('edit');
  }
  function save() {
    if (modal === 'add') {
      addEmployee({ id: `E${Date.now()}`, ...form, salaryAmount: Number(form.salaryAmount), active: true });
    } else if (editing) {
      updateEmployee({ ...editing, ...form, salaryAmount: Number(form.salaryAmount) });
    }
    setModal(null);
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">EMPLOYEES</h1>
        <button onClick={openAdd} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">+ NEW</button>
      </div>
      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Name','Role','Phone','Salary Type','Salary','Joining','Status',''].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {employees.map((e, i) => (
              <tr key={e.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                <td className="px-3 py-2 font-sans font-medium">{e.name}</td>
                <td className="px-3 py-2">{e.role}</td>
                <td className="px-3 py-2">{e.phone}</td>
                <td className="px-3 py-2 uppercase">{e.salaryType}</td>
                <td className="px-3 py-2 font-bold">{formatPKR(e.salaryAmount)}</td>
                <td className="px-3 py-2">{formatDate(e.joiningDate)}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 border text-xs ${e.active ? 'border-success text-success' : 'border-danger text-danger'}`}>
                    {e.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-3 py-2 flex gap-1">
                  <button onClick={() => openEdit(e)} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                  <button onClick={() => { if(confirm('Delete?')) removeEmployee(e.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-lg">
            <div className="border-b-2 border-black px-4 py-3 font-display text-lg bg-accent">
              {modal === 'add' ? 'NEW EMPLOYEE' : 'EDIT EMPLOYEE'}
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
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
              <label className="flex items-center gap-2 text-xs font-mono cursor-pointer">
                <input type="checkbox" checked={form.deductForAbsence} onChange={e => setForm(p => ({...p, deductForAbsence: e.target.checked}))} className="w-4 h-4 border-2 border-black" />
                DEDUCT FOR ABSENCE
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press shadow-brutal hover:bg-black hover:text-white">SAVE</button>
                <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
