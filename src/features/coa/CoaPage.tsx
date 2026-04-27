import { useState } from 'react';
import { useCoa } from '@/stores/useCoa';
import type { AccountNature, AccountMaster, AccountSub, Account } from '@/types';

const NATURES: AccountNature[] = ['Capital', 'Liabilities', 'Assets', 'Incomes', 'Expenses'];

export function CoaPage() {
  const { masters, subs, accounts, addMaster, updateMaster, removeMaster, addSub, updateSub, removeSub, addAccount, updateAccount, removeAccount } = useCoa();
  const [tab, setTab] = useState<'masters'|'subs'|'accounts'>('accounts');
  const [modal, setModal] = useState<string|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  function f(key: string) { return form[key] ?? ''; }
  function set(key: string, val: any) { setForm((p: any) => ({...p, [key]: val})); }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">CHART OF ACCOUNTS</h1>
        <div className="flex border-2 border-black">
          {(['masters','subs','accounts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-xs font-mono uppercase border-r-2 border-black last:border-0 ${tab===t?'bg-black text-white':'hover:bg-accent'}`}>
              {t === 'masters' ? 'Masters' : t === 'subs' ? 'Sub-Groups' : 'Accounts'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'masters' && (
        <div>
          <button onClick={() => { setEditing(null); setForm({}); setModal('master-add'); }} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold mb-3 shadow-brutal brutal-press hover:bg-black hover:text-white">+ NEW MASTER</button>
          <div className="border-2 border-black shadow-brutal">
            <table className="w-full text-xs font-mono">
              <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Nature</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {masters.map((m, i) => (
                  <tr key={m.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                    <td className="px-3 py-2 font-sans font-medium">{m.name}</td>
                    <td className="px-3 py-2">{m.nature}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => { setEditing(m); setForm(m); setModal('master-edit'); }} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) removeMaster(m.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(modal === 'master-add' || modal === 'master-edit') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="border-2 border-black shadow-brutal bg-white w-80">
                <div className="border-b-2 border-black px-4 py-3 font-display bg-accent">{modal==='master-add'?'NEW':'EDIT'} MASTER</div>
                <div className="p-4 space-y-3">
                  <div><label className="block text-xs font-mono uppercase mb-1">Name</label><input value={f('name')} onChange={e => set('name', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div><label className="block text-xs font-mono uppercase mb-1">Nature</label>
                    <select value={f('nature')} onChange={e => set('nature', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">— select —</option>
                      {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if(modal==='master-add') addMaster({ id:`AM${Date.now()}`, name:f('name'), nature:f('nature') as AccountNature }); else updateMaster({...editing, name:f('name'), nature:f('nature') as AccountNature}); setModal(null); }} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'subs' && (
        <div>
          <button onClick={() => { setEditing(null); setForm({}); setModal('sub-add'); }} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold mb-3 shadow-brutal brutal-press hover:bg-black hover:text-white">+ NEW SUB-GROUP</button>
          <div className="border-2 border-black shadow-brutal">
            <table className="w-full text-xs font-mono">
              <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Master</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {subs.map((s, i) => (
                  <tr key={s.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                    <td className="px-3 py-2 font-sans font-medium">{s.name}</td>
                    <td className="px-3 py-2">{masters.find(m => m.id === s.masterId)?.name}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => { setEditing(s); setForm(s); setModal('sub-edit'); }} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) removeSub(s.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(modal === 'sub-add' || modal === 'sub-edit') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="border-2 border-black shadow-brutal bg-white w-80">
                <div className="border-b-2 border-black px-4 py-3 font-display bg-accent">{modal==='sub-add'?'NEW':'EDIT'} SUB-GROUP</div>
                <div className="p-4 space-y-3">
                  <div><label className="block text-xs font-mono uppercase mb-1">Name</label><input value={f('name')} onChange={e => set('name', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div><label className="block text-xs font-mono uppercase mb-1">Master Group</label>
                    <select value={f('masterId')} onChange={e => set('masterId', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">— select —</option>
                      {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { if(modal==='sub-add') addSub({ id:`AS${Date.now()}`, name:f('name'), masterId:f('masterId') }); else updateSub({...editing, name:f('name'), masterId:f('masterId')}); setModal(null); }} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'accounts' && (
        <div>
          <button onClick={() => { setEditing(null); setForm({}); setModal('acc-add'); }} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold mb-3 shadow-brutal brutal-press hover:bg-black hover:text-white">+ NEW ACCOUNT</button>
          <div className="border-2 border-black shadow-brutal">
            <table className="w-full text-xs font-mono">
              <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Sub-Group</th><th className="px-3 py-2 text-right">Opening Bal.</th><th className="px-3 py-2 text-right">Current Bal.</th><th className="px-3 py-2"></th></tr></thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={a.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                    <td className="px-3 py-2 font-sans font-medium">{a.name}</td>
                    <td className="px-3 py-2">{subs.find(s => s.id === a.subId)?.name}</td>
                    <td className="px-3 py-2 text-right">{a.openingBalance.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-bold">{a.currentBalance.toLocaleString()}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => { setEditing(a); setForm(a); setModal('acc-edit'); }} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) removeAccount(a.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(modal === 'acc-add' || modal === 'acc-edit') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="border-2 border-black shadow-brutal bg-white w-80">
                <div className="border-b-2 border-black px-4 py-3 font-display bg-accent">{modal==='acc-add'?'NEW':'EDIT'} ACCOUNT</div>
                <div className="p-4 space-y-3">
                  <div><label className="block text-xs font-mono uppercase mb-1">Name</label><input value={f('name')} onChange={e => set('name', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div><label className="block text-xs font-mono uppercase mb-1">Sub-Group</label>
                    <select value={f('subId')} onChange={e => set('subId', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">— select —</option>
                      {subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-mono uppercase mb-1">Opening Balance</label><input type="number" value={f('openingBalance')} onChange={e => set('openingBalance', Number(e.target.value))} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div className="flex gap-2">
                    <button onClick={() => { const ob = Number(f('openingBalance')); if(modal==='acc-add') addAccount({ id:`AC${Date.now()}`, name:f('name'), subId:f('subId'), openingBalance:ob, currentBalance:ob }); else updateAccount({...editing, name:f('name'), subId:f('subId'), openingBalance:ob}); setModal(null); }} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
