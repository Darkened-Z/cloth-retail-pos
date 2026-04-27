import { useState } from 'react';
import { useParties } from '@/stores/useParties';
import { formatPKR } from '@/lib/formatNumber';

export function SuppliersPage() {
  const { parties, add, update, remove } = useParties();
  const [tab, setTab] = useState<'supplier' | 'dyer'>('supplier');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name:'', phone:'', address:'', creditDays:'15', openingBalance:'0' });

  const list = parties.filter(p => p.type === tab && p.name.toLowerCase().includes(search.toLowerCase()));

  function openAdd() {
    setEditing(null);
    setForm({ name:'', phone:'', address:'', creditDays: tab === 'supplier' ? '30' : '15', openingBalance:'0' });
    setModal('add');
  }
  function openEdit(p: any) {
    setEditing(p);
    setForm({ name: p.name, phone: p.phone, address: p.address, creditDays: String(p.creditDays), openingBalance: String(p.openingBalance) });
    setModal('edit');
  }
  function save() {
    const ob = Number(form.openingBalance);
    if (modal === 'add') {
      add({ id: `P${Date.now()}`, type: tab, name: form.name, phone: form.phone, address: form.address, openingBalance: ob, currentBalance: ob, creditDays: Number(form.creditDays) });
    } else {
      update({ ...editing, name: form.name, phone: form.phone, address: form.address, creditDays: Number(form.creditDays) });
    }
    setModal(null);
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-2xl">SUPPLIERS & DYERS</h1>
          <div className="flex border-2 border-black">
            {(['supplier','dyer'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-xs font-mono uppercase border-r-2 border-black last:border-0 ${tab === t ? 'bg-black text-white' : 'hover:bg-accent'}`}>
                {t === 'supplier' ? 'Suppliers' : 'Dyers'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-48" />
          <button onClick={openAdd} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">
            + NEW
          </button>
        </div>
      </div>

      <div className="border-2 border-black shadow-brutal overflow-auto">
        <table className="w-full text-xs font-mono">
          <thead className="bg-black text-white">
            <tr>{['Name','Phone','Address','Balance','Credit Days',''].map(h => (
              <th key={h} className="px-3 py-2 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.id} className={`border-b border-black/20 hover:bg-muted ${i % 2 === 0 ? '' : 'bg-muted/50'}`}>
                <td className="px-3 py-2 font-sans font-medium">{p.name}</td>
                <td className="px-3 py-2">{p.phone}</td>
                <td className="px-3 py-2 text-gray-600">{p.address}</td>
                <td className={`px-3 py-2 font-bold ${p.currentBalance > 0 ? 'text-danger' : 'text-success'}`}>{formatPKR(p.currentBalance)}</td>
                <td className="px-3 py-2">{p.creditDays} days</td>
                <td className="px-3 py-2">
                  <button onClick={() => openEdit(p)} className="border border-black px-2 py-0.5 hover:bg-accent text-xs mr-1">Edit</button>
                  <button onClick={() => { if(confirm('Delete?')) remove(p.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border-2 border-black shadow-brutal-lg bg-white w-full max-w-md">
            <div className="border-b-2 border-black px-4 py-3 font-display text-lg bg-accent">
              {modal === 'add' ? `NEW ${tab.toUpperCase()}` : `EDIT ${tab.toUpperCase()}`}
            </div>
            <div className="p-4 space-y-3">
              {[{ label:'Name',key:'name'},{label:'Phone',key:'phone'},{label:'Address',key:'address'},{label:'Credit Days',key:'creditDays'},{label:'Opening Balance',key:'openingBalance'}].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-mono uppercase mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                    className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 border-2 border-black bg-accent py-2 font-bold text-sm brutal-press shadow-brutal hover:bg-black hover:text-white">SAVE</button>
                <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold text-sm brutal-press hover:bg-black hover:text-white">CANCEL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
