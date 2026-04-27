import { useState } from 'react';
import { useShop } from '@/stores/useShop';
import { resetAll } from '@/mock';

export function SettingsPage() {
  const { shop, update } = useShop();
  const [form, setForm] = useState({ ...shop });
  const [saved, setSaved] = useState(false);

  function save() {
    update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (confirm('This will clear all data and re-seed demo data. Continue?')) {
      resetAll();
    }
  }

  const fields: { label: string; key: keyof typeof form; type?: string }[] = [
    { label: 'Shop Name', key: 'name' },
    { label: 'Address', key: 'address' },
    { label: 'Phone', key: 'phone' },
    { label: 'NTN', key: 'ntn' },
    { label: 'Invoice Prefix', key: 'invoicePrefix' },
    { label: 'Invoice Terms', key: 'terms' },
  ];

  return (
    <div className="p-4 max-w-xl">
      <h1 className="font-display text-2xl mb-4">SETTINGS</h1>

      <div className="border-2 border-black shadow-brutal mb-6">
        <div className="border-b-2 border-black px-4 py-3 font-display bg-accent">SHOP INFORMATION</div>
        <div className="p-4 space-y-3">
          {fields.map(fi => (
            <div key={fi.key}>
              <label className="block text-xs font-mono uppercase mb-1">{fi.label}</label>
              <input type={fi.type ?? 'text'} value={(form as any)[fi.key] ?? ''} onChange={e => setForm(p => ({...p, [fi.key]: e.target.value}))}
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-mono uppercase mb-1">Language</label>
            <select value={form.language} onChange={e => setForm(p => ({...p, language: e.target.value as any}))}
              className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="en">English</option>
              <option value="ur">Urdu</option>
              <option value="dual">Dual (EN + UR)</option>
            </select>
          </div>
          <button onClick={save} className={`w-full border-2 border-black py-2.5 font-bold brutal-press shadow-brutal ${saved ? 'bg-success text-white' : 'bg-accent hover:bg-black hover:text-white'}`}>
            {saved ? '✓ SAVED' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>

      <div className="border-2 border-danger shadow-brutal">
        <div className="border-b-2 border-danger px-4 py-3 font-display text-danger">DANGER ZONE</div>
        <div className="p-4">
          <p className="text-xs font-mono text-gray-600 mb-3">This will delete all transactions and restore the original demo data. Use with caution.</p>
          <button onClick={handleReset} className="border-2 border-danger bg-white text-danger px-6 py-2.5 font-bold brutal-press shadow-brutal-danger hover:bg-danger hover:text-white">
            RESET TO DEMO DATA
          </button>
        </div>
      </div>
    </div>
  );
}
