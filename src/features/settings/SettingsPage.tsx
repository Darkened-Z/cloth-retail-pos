import { useState, useRef } from 'react';
import { useShop } from '@/stores/useShop';
import { setLang } from '@/lib/i18n';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { resetAll, startEmptyShop } from '@/mock';
import { exportBackupJson, importBackupJson } from '@/lib/supabase';
import { Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export function SettingsPage() {
  const { shop, update } = useShop();
  const [form, setForm] = useState({ ...shop });
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function save() {
    update(form);
    setLang(form.language);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  useKeyboardShortcuts({
    f9: () => save(),
  });

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await importBackupJson(parsed);
      setBackupMsg({
        type: 'success',
        text: `Restored ${res.count} records from backup file! Reloading...`,
      });
      setTimeout(() => window.location.reload(), 900);
    } catch (err: any) {
      setBackupMsg({ type: 'error', text: `Invalid backup file: ${err?.message || 'Could not read file'}` });
    } finally {
      e.target.value = '';
    }
  }

  function handleReset() {
    if (confirm('This will clear all data and re-seed demo data. Continue?')) {
      resetAll();
    }
  }

  function handleStartEmpty() {
    if (
      confirm(
        'Start Fresh Shop? This keeps Chart of Accounts, Locations, Users & Shop Info, and clears all demo invoices, vouchers, items, and parties.'
      )
    ) {
      startEmptyShop();
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
    <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-display text-2xl">SHOP SETTINGS</h1>
      </div>

      {/* SHOP INFORMATION */}
      <div className="bg-white border-2 border-black shadow-brutal">
        <div className="border-b-2 border-black px-4 py-3 font-display text-base bg-accent">
          SHOP INFORMATION & INVOICE BRANDING
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(fi => (
              <div key={fi.key} className={fi.key === 'address' || fi.key === 'terms' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-mono font-bold uppercase mb-1.5 text-gray-800">{fi.label}</label>
                <input
                  type={fi.type ?? 'text'}
                  value={(form as any)[fi.key] ?? ''}
                  onChange={e => setForm(p => ({ ...p, [fi.key]: e.target.value }))}
                  className="w-full border-2 border-black px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase mb-1.5 text-gray-800">Display Language</label>
              <select
                value={form.language}
                onChange={e => setForm(p => ({ ...p, language: e.target.value as any }))}
                className="w-full border-2 border-black px-3.5 py-2.5 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="en">English</option>
                <option value="ur">Urdu (اردو)</option>
                <option value="dual">Dual (English + اردو)</option>
              </select>
            </div>
          </div>
          <button
            onClick={save}
            className={`w-full border-2 border-black py-3 text-sm font-bold brutal-press shadow-brutal ${
              saved ? 'bg-success text-white' : 'bg-accent hover:bg-black hover:text-white'
            }`}
          >
            {saved ? '✓ SETTINGS SAVED!' : 'SAVE SETTINGS (F9)'}
          </button>
        </div>
      </div>

      {/* DATA BACKUP & RESTORE */}
      <div className="bg-white border-2 border-black shadow-brutal">
        <div className="border-b-2 border-black px-4 py-3 font-display text-base bg-muted">
          DATA BACKUP & RESTORE
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-gray-700">
            Your shop data is automatically backed up to the cloud. You can also download a local backup file to your computer or restore from a saved backup file at any time.
          </p>
          {backupMsg && (
            <div
              className={`border-2 p-3 text-sm font-mono flex items-center gap-2 ${
                backupMsg.type === 'error'
                  ? 'border-danger bg-danger/10 text-danger'
                  : 'border-success bg-success/10 text-success'
              }`}
            >
              {backupMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{backupMsg.text}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={exportBackupJson}
              className="border-2 border-black bg-white py-2.5 px-4 font-mono text-sm font-bold uppercase brutal-press shadow-brutal-sm hover:bg-accent flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> DOWNLOAD BACKUP (.JSON)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-black bg-white py-2.5 px-4 font-mono text-sm font-bold uppercase brutal-press shadow-brutal-sm hover:bg-accent flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> RESTORE FROM FILE (.JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-white border-2 border-danger shadow-brutal">
        <div className="border-b-2 border-danger px-4 py-3 font-display text-base text-danger bg-danger/5">
          SYSTEM RESET
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-gray-700">
            <strong>Reset to Demo Data</strong> restores the sample dataset. <strong>Start Empty Shop</strong> clears all demo invoices, vouchers, items, and parties while keeping your Chart of Accounts and Shop Info ready for live business entry.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto border-2 border-danger bg-white text-danger px-5 py-2.5 font-bold text-sm font-mono uppercase brutal-press hover:bg-danger hover:text-white"
            >
              RESET TO DEMO DATA
            </button>
            <button
              onClick={handleStartEmpty}
              className="w-full sm:w-auto border-2 border-black bg-white text-black px-5 py-2.5 font-bold text-sm font-mono uppercase brutal-press hover:bg-black hover:text-white"
            >
              START EMPTY SHOP (CLEAR DEMO DATA)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
