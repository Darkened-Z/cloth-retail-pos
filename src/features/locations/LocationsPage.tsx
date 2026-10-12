import { useState, useRef } from 'react';
import { useLocations } from '@/stores/useLocations';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import type { Location } from '@/types';

const LOCATION_TYPES: Location['type'][] = ['shop', 'packing', 'dyer', 'other'];

export function LocationsPage() {
  const { locations, add, update, remove } = useLocations();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<{ name: string; type: Location['type'] }>({ name: '', type: 'shop' });
  const [isNew, setIsNew] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  function openNew() {
    setForm({ name: '', type: 'shop' });
    setEditing(null);
    setIsNew(true);
  }

  function openEdit(l: Location) {
    setForm({ name: l.name, type: l.type });
    setEditing(l);
    setIsNew(false);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editing) {
      update({ ...editing, name: form.name.trim(), type: form.type });
    } else {
      add({ name: form.name.trim(), type: form.type });
    }
    setEditing(null);
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
  }

  useKeyboardShortcuts({
    'ctrl+n': () => openNew(),
    f9: () => { if (isNew || editing) save(); },
    f3: () => searchRef.current?.focus(),
    escape: () => cancel(),
  });

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black uppercase tracking-tight">Locations / Warehouses</h1>
        <button
          onClick={openNew}
          className="w-full sm:w-auto px-4 py-2 bg-accent border-2 border-black font-bold text-sm uppercase shadow-brutal brutal-press hover:bg-black hover:text-white transition-shadow"
        >
          + ADD LOCATION (Ctrl+N)
        </button>
      </div>

      {(isNew || editing) && (
        <div className="border-2 border-black p-4 bg-white shadow-brutal space-y-3">
          <h2 className="font-bold uppercase text-sm">{editing ? 'Edit Location' : 'New Location'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Location Name</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:bg-accent/20"
                placeholder="e.g. SARWA DYING"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as Location['type'] }))}
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none uppercase bg-white"
              >
                {LOCATION_TYPES.map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={save} className="flex-1 sm:flex-none px-4 py-2 bg-black text-white font-bold text-sm uppercase hover:bg-accent hover:text-black border-2 border-black">
              SAVE (F9)
            </button>
            <button onClick={cancel} className="flex-1 sm:flex-none px-4 py-2 border-2 border-black bg-white font-bold text-sm uppercase hover:bg-gray-100">
              CANCEL
            </button>
          </div>
        </div>
      )}

      <div className="border-2 border-black shadow-brutal bg-white">
        <div className="border-b-2 border-black p-2 bg-gray-50">
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search locations (F3)..."
            className="w-full px-2 py-1 text-sm border border-black bg-white focus:outline-none"
          />
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">ID</th>
                <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">Name</th>
                <th className="text-left px-4 py-2 font-bold uppercase whitespace-nowrap">Type</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{l.id}</td>
                  <td className="px-4 py-2 font-bold whitespace-nowrap">{l.name}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-bold uppercase border border-black ${
                      l.type === 'shop' ? 'bg-accent' :
                      l.type === 'dyer' ? 'bg-blue-100' :
                      l.type === 'packing' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>{l.type}</span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap space-x-2">
                    <button onClick={() => openEdit(l)} className="text-xs font-bold underline hover:text-blue-600">Edit</button>
                    <button onClick={() => remove(l.id)} className="text-xs font-bold underline hover:text-red-600">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm bg-white">No locations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
