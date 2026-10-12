import { useState, useRef } from 'react';
import { useItems } from '@/stores/useItems';
import { formatPKR } from '@/lib/formatNumber';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { Item, ItemMaster, ItemSub } from '@/types';

export function ItemsPage() {
  const { masters, subs, items, addMaster, updateMaster, removeMaster, addSub, updateSub, removeSub, addItem, updateItem, removeItem } = useItems();
  const [tab, setTab] = useState<'items'|'subs'|'masters'>('items');
  const [modal, setModal] = useState<string|null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const f = (k: string) => form[k] ?? '';
  const set = (k: string, v: any) => setForm((p: any) => ({...p, [k]: v}));

  const filteredItems = items.filter(it => it.name.toLowerCase().includes(search.toLowerCase()));

  function openNew() {
    setEditing(null);
    if (tab === 'items') {
      setForm({ unit: 'meter', gazana: 0, purchasePrice: 0, salePrice: 0, stock: 0, minStock: 0, subId: subs[0]?.id ?? '' });
    } else {
      setForm({});
    }
    setModal(`${tab}-add`);
  }

  function saveModal() {
    if (!modal) return;
    if (modal.startsWith('items')) {
      const payload = { ...form, unit: form.unit || 'meter' };
      if (modal === 'items-add') addItem({ id: `IT${Date.now()}`, ...payload });
      else updateItem({ ...editing, ...payload });
      setModal(null);
    } else if (modal.startsWith('subs')) {
      if (modal === 'subs-add') addSub({ id: `IS${Date.now()}`, name: f('name'), masterId: f('masterId') });
      else updateSub({ ...editing, name: f('name'), masterId: f('masterId') });
      setModal(null);
    } else if (modal.startsWith('masters')) {
      if (modal === 'masters-add') addMaster({ id: `IM${Date.now()}`, name: f('name') });
      else updateMaster({ ...editing, name: f('name') });
      setModal(null);
    }
  }

  useKeyboardShortcuts({
    'ctrl+n': () => openNew(),
    f9: () => saveModal(),
    f3: () => searchRef.current?.focus(),
    escape: () => setModal(null),
  });

  return (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="font-display text-2xl">ITEMS</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {tab === 'items' && (
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search (F3)…"
              className="w-full sm:w-48 border-2 border-black bg-white px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}
          <div className="flex flex-wrap border-2 border-black bg-white w-full sm:w-auto">
            {(['items','subs','masters'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-mono uppercase border-r-2 border-black last:border-0 whitespace-nowrap ${tab===t?'bg-black text-white':'bg-white hover:bg-accent'}`}>
                {t === 'masters' ? 'Masters' : t === 'subs' ? 'Sub-Groups' : 'Items'}
              </button>
            ))}
          </div>
          <button onClick={openNew} className="w-full sm:w-auto border-2 border-black bg-accent px-4 py-1.5 text-xs font-mono font-bold shadow-brutal brutal-press hover:bg-black hover:text-white whitespace-nowrap">+ NEW (Ctrl+N)</button>
        </div>
      </div>

      {tab === 'items' && (
        <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white">
              <tr>{['Name','Sub-Group','Unit','Purchase','Sale','Stock','Min Stock',''].map(h => <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filteredItems.map((it, i) => (
                <tr key={it.id} className={`border-b border-black/20 hover:bg-muted ${it.stock <= it.minStock ? 'border-l-4 border-l-danger' : ''} ${i%2===0?'bg-white':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans font-medium whitespace-nowrap">{it.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{subs.find(s => s.id === it.subId)?.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.unit}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPKR(it.purchasePrice)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPKR(it.salePrice)}</td>
                  <td className={`px-3 py-2 font-bold whitespace-nowrap ${it.stock <= it.minStock ? 'text-danger' : 'text-success'}`}>{it.stock}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{it.minStock}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(it); setForm({...it}); setModal('items-edit'); }} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) removeItem(it.id); }} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'subs' && (
        <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left whitespace-nowrap">Name</th><th className="px-3 py-2 text-left whitespace-nowrap">Master</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {subs.map((s, i) => (
                <tr key={s.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'bg-white':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans whitespace-nowrap">{s.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{masters.find(m => m.id === s.masterId)?.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(s); setForm(s); setModal('subs-edit'); }} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) removeSub(s.id); }} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'masters' && (
        <div className="border-2 border-black shadow-brutal overflow-x-auto bg-white">
          <table className="w-full text-xs font-mono">
            <thead className="bg-black text-white"><tr><th className="px-3 py-2 text-left whitespace-nowrap">Name</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {masters.map((m, i) => (
                <tr key={m.id} className={`border-b border-black/20 hover:bg-muted ${i%2===0?'bg-white':'bg-muted/50'}`}>
                  <td className="px-3 py-2 font-sans font-medium whitespace-nowrap">{m.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(m); setForm(m); setModal('masters-edit'); }} className="border border-black bg-white px-2 py-0.5 hover:bg-accent text-xs">Edit</button>
                      <button onClick={() => { if(confirm('Delete?')) removeMaster(m.id); }} className="border border-danger bg-white text-danger px-2 py-0.5 hover:bg-danger hover:text-white text-xs">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="border-2 border-black shadow-brutal bg-white w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-black px-4 py-3 font-display bg-accent uppercase sticky top-0 z-10">{modal.replace('-', ' ')}</div>
            <div className="p-4 space-y-3">
              {(modal.startsWith('items')) && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[{l:'Name',k:'name',span:true},{l:'Purchase Price',k:'purchasePrice',t:'number'},{l:'Sale Price',k:'salePrice',t:'number'},{l:'Gazana',k:'gazana',t:'number'},{l:'Stock',k:'stock',t:'number'},{l:'Min Stock',k:'minStock',t:'number'}].map(fi => (
                      <div key={fi.k} className={fi.span ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-mono uppercase mb-1">{fi.l}</label>
                        <input type={fi.t??'text'} value={f(fi.k)} onChange={e => set(fi.k, fi.t==='number'?Number(e.target.value):e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                      </div>
                    ))}
                    <div><label className="block text-xs font-mono uppercase mb-1">Sub-Group</label>
                      <select value={f('subId')} onChange={e => set('subId', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                        <option value="">— select —</option>{subs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-2"><label className="block text-xs font-mono uppercase mb-1">Unit</label>
                      <select value={f('unit') || 'meter'} onChange={e => set('unit', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
                        <option value="meter">Meter</option><option value="yard">Yard</option><option value="thaan">Thaan</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveModal} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press shadow-brutal hover:bg-black hover:text-white">SAVE (F9)</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black bg-white py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
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
                    <button onClick={saveModal} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE (F9)</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black bg-white py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
                  </div>
                </>
              )}
              {(modal.startsWith('masters')) && (
                <>
                  <div><label className="block text-xs font-mono uppercase mb-1">Name</label><input value={f('name')} onChange={e => set('name', e.target.value)} className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={saveModal} className="flex-1 border-2 border-black bg-accent py-2 font-bold brutal-press hover:bg-black hover:text-white">SAVE (F9)</button>
                    <button onClick={() => setModal(null)} className="flex-1 border-2 border-black bg-white py-2 font-bold brutal-press hover:bg-black hover:text-white">CANCEL</button>
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
