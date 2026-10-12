import { useState, useRef } from 'react';
import { useShop } from '@/stores/useShop';
import { setLang } from '@/lib/i18n';
import { useKeyboardShortcuts } from '@/lib/shortcuts';
import { resetAll, startEmptyShop } from '@/mock';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  pushAllToSupabase,
  pullAllFromSupabase,
  exportBackupJson,
  importBackupJson,
  getLastSyncTime,
  DEFAULT_SUPABASE_KEY,
} from '@/lib/supabase';
import { Cloud, Upload, Download, CheckCircle2, AlertCircle, Copy, Database } from 'lucide-react';

const SUPABASE_SQL_SCHEMA = `CREATE TABLE IF NOT EXISTS public.app_data (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON TABLE public.app_data TO anon, authenticated, service_role;
DROP POLICY IF EXISTS "Allow all access to app_data" ON public.app_data;
CREATE POLICY "Allow all access to app_data" ON public.app_data FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.app_data DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_app_data_updated ON public.app_data (updated_at DESC);`;

export function SettingsPage() {
  const { shop, update } = useShop();
  const [form, setForm] = useState({ ...shop });
  const [saved, setSaved] = useState(false);

  const initialSb = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialSb.url);
  const [sbKey, setSbKey] = useState(initialSb.apiKey || DEFAULT_SUPABASE_KEY);
  const [autoSync, setAutoSync] = useState(initialSb.autoSync);
  const [syncStatus, setSyncStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; msg: string }>({
    type: 'idle',
    msg: getLastSyncTime() ? `Last synced: ${new Date(getLastSyncTime()!).toLocaleString()}` : 'Ready to connect',
  });
  const [copiedSql, setCopiedSql] = useState(false);
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

  function handleSaveSupabaseConfig() {
    saveSupabaseConfig({ url: sbUrl, apiKey: sbKey, autoSync });
    setSyncStatus({ type: 'success', msg: 'Supabase configuration saved locally.' });
  }

  async function handlePushToCloud() {
    saveSupabaseConfig({ url: sbUrl, apiKey: sbKey, autoSync });
    setSyncStatus({ type: 'loading', msg: 'Pushing all ERP data to Supabase Cloud...' });
    const res = await pushAllToSupabase();
    if (res.ok) {
      setSyncStatus({
        type: 'success',
        msg: `Successfully backed up ${res.count} ERP tables to Supabase Cloud (${new Date().toLocaleTimeString()}).`,
      });
    } else {
      setSyncStatus({ type: 'error', msg: res.error || 'Failed to push to Supabase.' });
    }
  }

  async function handlePullFromCloud() {
    saveSupabaseConfig({ url: sbUrl, apiKey: sbKey, autoSync });
    setSyncStatus({ type: 'loading', msg: 'Pulling data from Supabase Cloud...' });
    const res = await pullAllFromSupabase();
    if (res.ok) {
      if (res.count === 0) {
        setSyncStatus({ type: 'error', msg: 'Supabase app_data table is currently empty. Click "PUSH TO CLOUD" first!' });
      } else {
        setSyncStatus({
          type: 'success',
          msg: `Restored ${res.count} ERP tables from Supabase Cloud! Reloading...`,
        });
        setTimeout(() => window.location.reload(), 900);
      }
    } else {
      setSyncStatus({ type: 'error', msg: res.error || 'Failed to pull from Supabase.' });
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await importBackupJson(parsed);
      setSyncStatus({
        type: 'success',
        msg: `Restored ${res.count} tables from JSON backup${res.syncedToCloud ? ' & synced to Supabase' : ''}! Reloading...`,
      });
      setTimeout(() => window.location.reload(), 900);
    } catch (err: any) {
      setSyncStatus({ type: 'error', msg: `Invalid backup file: ${err?.message || 'Parse error'}` });
    } finally {
      e.target.value = '';
    }
  }

  function handleCopySql() {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  }

  function handleReset() {
    if (confirm('This will clear all data and re-seed demo data. Continue?')) {
      resetAll();
    }
  }

  function handleStartEmpty() {
    if (confirm('Start Fresh Shop? This keeps Chart of Accounts, Locations, Users & Shop Info, and clears all demo invoices, vouchers, items, and parties.')) {
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
        <h1 className="font-display text-2xl">SETTINGS & CLOUD BACKUP</h1>
      </div>

      {/* SUPABASE CLOUD SYNC & LOCAL BACKUP */}
      <div className="bg-white border-2 border-black shadow-brutal">
        <div className="border-b-2 border-black px-4 py-3 font-display bg-accent flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Cloud className="w-5 h-5" /> SUPABASE CLOUD SYNC & BACKUP
          </span>
          <span className="text-[11px] font-mono bg-black text-accent px-2 py-0.5 uppercase">
            Key Pre-Configured
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase mb-1">
                Supabase Project URL <span className="text-danger">*</span>
              </label>
              <input
                type="url"
                value={sbUrl}
                onChange={e => setSbUrl(e.target.value)}
                placeholder="https://your-project-ref.supabase.co"
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-[11px] font-mono text-gray-500 mt-1">
                Find this in Supabase Dashboard → Project Settings → Data API → Project URL
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase mb-1">
                Supabase Publishable API Key
              </label>
              <input
                type="text"
                value={sbKey}
                onChange={e => setSbKey(e.target.value)}
                placeholder="sb_publishable_..."
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between border-2 border-black bg-muted px-3 py-2">
              <div>
                <div className="text-xs font-mono font-bold uppercase">Real-Time Auto-Sync on Every Save</div>
                <div className="text-[11px] font-mono text-gray-600">
                  Automatically syncs every new invoice, voucher, or party change to Supabase
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={e => {
                  setAutoSync(e.target.checked);
                  saveSupabaseConfig({ url: sbUrl, apiKey: sbKey, autoSync: e.target.checked });
                }}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>
          </div>

          {/* Status Banner */}
          <div
            className={`border-2 p-3 text-xs font-mono flex items-start gap-2 ${
              syncStatus.type === 'error'
                ? 'border-danger bg-danger/10 text-danger'
                : syncStatus.type === 'success'
                ? 'border-success bg-success/10 text-success'
                : 'border-black bg-muted text-black'
            }`}
          >
            {syncStatus.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 break-words">{syncStatus.msg}</div>
          </div>

          {/* Cloud Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={handleSaveSupabaseConfig}
              className="border-2 border-black bg-white py-2.5 px-3 font-mono text-xs font-bold uppercase brutal-press shadow-brutal-sm hover:bg-black hover:text-white"
            >
              SAVE CONFIG
            </button>
            <button
              type="button"
              onClick={handlePushToCloud}
              disabled={syncStatus.type === 'loading'}
              className="border-2 border-black bg-accent py-2.5 px-3 font-mono text-xs font-bold uppercase brutal-press shadow-brutal-sm hover:bg-black hover:text-white flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> PUSH LOCAL → CLOUD
            </button>
            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={syncStatus.type === 'loading'}
              className="border-2 border-black bg-white py-2.5 px-3 font-mono text-xs font-bold uppercase brutal-press shadow-brutal-sm hover:bg-black hover:text-white flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> PULL CLOUD → LOCAL
            </button>
          </div>

          {/* One-Time SQL Setup Helper */}
          <div className="border-t-2 border-black/20 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] font-mono text-gray-600 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>First time setup: run the <code>app_data</code> table SQL once in Supabase SQL Editor.</span>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="border border-black bg-muted px-3 py-1 text-[11px] font-mono font-bold hover:bg-accent flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              <Copy className="w-3 h-3" />
              {copiedSql ? '✓ SQL COPIED!' : 'COPY SUPABASE SQL'}
            </button>
          </div>

          {/* Offline JSON File Backup / Restore */}
          <div className="border-t-2 border-black pt-4">
            <div className="text-xs font-mono font-bold uppercase mb-2">OFFLINE FILE BACKUP (.JSON)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={exportBackupJson}
                className="border-2 border-black bg-white py-2.5 px-3 font-mono text-xs font-bold uppercase brutal-press shadow-brutal-sm hover:bg-accent flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> EXPORT BACKUP (.JSON)
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-black bg-white py-2.5 px-3 font-mono text-xs font-bold uppercase brutal-press shadow-brutal-sm hover:bg-accent flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> IMPORT / RESTORE (.JSON)
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
      </div>

      {/* SHOP INFORMATION */}
      <div className="bg-white border-2 border-black shadow-brutal">
        <div className="border-b-2 border-black px-4 py-3 font-display bg-accent">SHOP INFORMATION</div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {fields.map(fi => (
              <div key={fi.key} className={fi.key === 'address' || fi.key === 'terms' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-mono font-bold uppercase mb-1">{fi.label}</label>
                <input
                  type={fi.type ?? 'text'}
                  value={(form as any)[fi.key] ?? ''}
                  onChange={e => setForm(p => ({ ...p, [fi.key]: e.target.value }))}
                  className="w-full border-2 border-black px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono font-bold uppercase mb-1">Language</label>
              <select
                value={form.language}
                onChange={e => setForm(p => ({ ...p, language: e.target.value as any }))}
                className="w-full border-2 border-black px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="dual">Dual (EN + UR)</option>
              </select>
            </div>
          </div>
          <button
            onClick={save}
            className={`w-full border-2 border-black py-2.5 font-bold brutal-press shadow-brutal ${
              saved ? 'bg-success text-white' : 'bg-accent hover:bg-black hover:text-white'
            }`}
          >
            {saved ? '✓ SAVED!' : 'SAVE SETTINGS — F9'}
          </button>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-white border-2 border-danger shadow-brutal">
        <div className="border-b-2 border-danger px-4 py-3 font-display text-danger bg-danger/5">DANGER ZONE</div>
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-xs font-mono text-gray-600 mb-3">
              Reset to Demo Data restores the Hafiz Fabrics sample dataset. Start Empty Shop clears all demo invoices, vouchers, items, and parties while keeping your Chart of Accounts and Shop Info ready for real business entry.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto border-2 border-danger bg-white text-danger px-5 py-2.5 font-bold text-xs font-mono uppercase brutal-press hover:bg-danger hover:text-white"
              >
                RESET TO DEMO DATA
              </button>
              <button
                onClick={handleStartEmpty}
                className="w-full sm:w-auto border-2 border-black bg-white text-black px-5 py-2.5 font-bold text-xs font-mono uppercase brutal-press hover:bg-black hover:text-white"
              >
                START EMPTY SHOP (CLEAR DEMO DATA)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
