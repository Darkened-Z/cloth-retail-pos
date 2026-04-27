import { useState } from 'react';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import type { Item, ItemMaster, ItemSub } from '@/types';

export function ItemsPage() {
  const { masters, subs, items, addMaster, updateMaster, removeMaster, addSub, updateSub, removeSub, addItem, updateItem, removeItem } = useItems();
  const [tab, setTab] = useState<'items'|'subs'|'masters'>('items');
  const [modal, setModal] = useState<string|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState('');

  const f = (k: string) => form[k] ?? '';
  const set = (k: string, v: any) => setForm((p: any) => ({...p, [k]: v}));

  const filteredItems = items.filter(it => it.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-display text-2xl">ITEMS</h1>
        <div className="flex items-center gap-2">
          {tab === 'items' && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="border-2 border-black px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent w-48" />}
          <div className="flex border-2 border-black">
            {(['items','subs','masters'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-mono uppercase border-r-2 border-black last:border-0 ${tab===t?'bg-black text-white':'hover:bg-accent'}`}>
                {t === 'masters' ? 'Masters' : t === 'subs' ? 'Sub-Groups' : 'Items'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditing(null); setForm({}); setModal(`${tab}-add`); }} className="border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white">+ NEW</button>
        </div>
      </div>

      {tab === 'items' && (
        <div className="border-2 border-black shadow-brutal overflow-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white">
              <tr>{['Name','Sub-Group','Unit','Purchase','Sale','Stock','Min Stock',''].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredItems.map((it, i) => (
                <tr key={it.id} className={`border-b border-black/20 hover:bg-muted ${it.stock <= it.minStock ? 'border-l-4 border-l-danger' : ''} ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans font-medium">{it.name}</td>
                  <td className="px-3 py-2">{subs.find(s => s.id === it.subId)?.name}</td>
                  <td className="px-3 py-2">{it.unit}</td>
                  <td className="px-3 py-2">{formatPKR(it.purchasePrice)}</td>
                  <td className="px-3 py-2">{formatPKR(it.salePrice)}</td>
                  <td className={`px-3 py-2 font-bold ${it.stock <= it.minStock ? 'text-danger' : 'text-success'}`}>{it.stock}</td>
                  <td className="px-3 py-2 text-gray-500">{it.minStock}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <button onClick={() => { setEditing(it); setForm({...it}); setModal('items-edit'); }} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                    <button onClick={() => { if(confirm('Delete?')) removeItem(it.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'subs' && (
        <div className="border-2 border-black shadow-brutal">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Master</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans">{s.name}</td>
                  <td className="px-3 py-2">{masters.find(m => m.id === s.masterId)?.name}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <button onClick={() => { setEditing(s); setForm(s); setModal('subs-edit'); }} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                    <button onClick={() => { if(confirm('Delete?')) removeSub(s.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'masters' && (
        <div className="border-2 border-black shadow-brutal">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {masters.map((m, i) => (
                <tr key={m.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans font-medium">{m.name}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <button onClick={() => { setEditing(m); setForm(m); setModal('masters-edit'); }} className="border border-black px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                    <button onClick={() => { if(confirm('Delete?')) removeMaster(m.id); }} className="border border-danger text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="border-2 border-black shadow-brutal bg-white w-full max-w-md">
            <div className="border-b-2 border-black px-4 py-3 font-display bg-accent uppercase">{modal.replace('-', ' ')}</div>
            <div className="p-4 space-y-3">
              {(modal.startsWith('items')) && (
                <>
                  {[{l:'Name',k:'name'},{l:'Purchase Price',k:'purchasePrice',t:'number'},{l:'Sale Price',k:'salePrice',t:'number'},{l:'Gazana',k:'gazana',t:'number'},{l:'Stock',k:'stock',t:'number'},{l:'Min Stock',k:'minStock',t:'number'}].map(fi => (
                    <div key={fi.k}><label className="block text-xs font-mono uppercase mb-1">{fi.l}</label><input type={fi.t??'text'} value={f(fi.k)} onChange={e => set(fi.k, fi.t==='number'?Number(e.target.value):e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  ))}
                  <div><label className="block text-xs font-mono uppercase mb-1">Sub-Group</label>
                    <select value={f('subId')} onChange={e => set('subId', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">— select —</option>{subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-xs font-mono uppercase mb-1">Unit</label>
                    <select value={f('unit')} onChange={e => set('unit', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="meter">Meter</option><option value="yard">Yard</option><option value="thaan">Thaan</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => {
                      if(modal==='items-add') addItem({ id:`IT${Date.now()}`, ...form });
                      else updateItem({ ...editing, ...form });
                      setModal(null);
                    }} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </>
              )}
              {(modal.startsWith('subs')) && (
                <>
                  <div><label className="block text-xs font-mono uppercase mb-1">Name</label><input value={f('name')} onChange={e => set('name', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div><label className="block text-xs font-mono uppercase mb-1">Master</label>
                    <select value={f('masterId')} onChange={e => set('masterId', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                      <option value="">— select —</option>{masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { if(modal==='subs-add') addSub({ id:`IS${Date.now()}`, name:f('name'), masterId:f('masterId') }); else updateSub({...editing, name:f('name'), masterId:f('masterId')}); setModal(null); }} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </>
              )}
              {(modal.startsWith('masters')) && (
                <>
                  <div><label className="block text-xs font-mono uppercase mb-1">Name</label><input value={f('name')} onChange={e => set('name', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { if(modal==='masters-add') addMaster({ id:`IM${Date.now()}`, name:f('name') }); else updateMaster({...editing, name:f('name')}); setModal(null); }} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
