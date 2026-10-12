export const DEFAULT_SUPABASE_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_NMhJyVPotWBRvNJwwfPgDw_ScivEuvp';

export const DEFAULT_SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://zgtdjwjscffsipknmtua.supabase.co';

export const SYNCED_KEYS = [
  'shop',
  'users',
  'accountMasters',
  'accountSubs',
  'accounts',
  'itemMasters',
  'itemSubs',
  'items',
  'parties',
  'invoices',
  'purchaseVouchers',
  'dyeingVouchers',
  'expenses',
  'employees',
  'attendance',
  'advances',
  'payrollRuns',
  'locations',
  'stockTransfers',
  'receiptVouchers',
  'paymentVouchers',
  'journalVouchers',
  'seeded_v5',
] as const;

export interface SupabaseConfig {
  url: string;
  apiKey: string;
  autoSync: boolean;
}

const CONFIG_STORAGE_KEY = 'supabase_config_v1';
const LAST_SYNC_KEY = 'supabase_last_sync';

export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: (parsed.url || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, ''),
        apiKey: (parsed.apiKey || DEFAULT_SUPABASE_KEY).trim(),
        autoSync: parsed.autoSync !== false,
      };
    }
  } catch {
    // ignore
  }
  return {
    url: DEFAULT_SUPABASE_URL.trim().replace(/\/+$/, ''),
    apiKey: DEFAULT_SUPABASE_KEY.trim(),
    autoSync: true,
  };
}

export function saveSupabaseConfig(cfg: Partial<SupabaseConfig>): SupabaseConfig {
  const current = getSupabaseConfig();
  const next: SupabaseConfig = {
    url: (cfg.url ?? current.url).trim().replace(/\/+$/, ''),
    apiKey: (cfg.apiKey ?? current.apiKey).trim() || DEFAULT_SUPABASE_KEY,
    autoSync: cfg.autoSync ?? current.autoSync,
  };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

function setLastSyncTime(iso: string) {
  localStorage.setItem(LAST_SYNC_KEY, iso);
  window.dispatchEvent(new CustomEvent('supabase-sync-status', { detail: { lastSync: iso } }));
}

function buildHeaders(apiKey: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: apiKey,
    'Content-Type': 'application/json',
    ...extra,
  };
  // Legacy JWT anon keys start with 'eyJ'; opaque sb_publishable_ keys must only use `apikey` header
  if (apiKey.startsWith('eyJ')) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return headers;
}

export function isSupabaseConfigured(): boolean {
  const { url, apiKey } = getSupabaseConfig();
  return Boolean(url && url.startsWith('http') && apiKey);
}

/**
 * Upsert a single key-value pair to Supabase `app_data` table
 */
export async function pushKeyToSupabase(key: string, value: unknown): Promise<boolean> {
  const { url, apiKey, autoSync } = getSupabaseConfig();
  if (!autoSync || !url || !apiKey) return false;
  if (!(SYNCED_KEYS as readonly string[]).includes(key)) return false;

  try {
    const res = await fetch(`${url}/rest/v1/app_data?on_conflict=key`, {
      method: 'POST',
      headers: buildHeaders(apiKey, {
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify({
        key,
        value,
        updated_at: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      setLastSyncTime(new Date().toISOString());
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Push all local ERP keys to Supabase `app_data` in a single batch upsert
 */
export async function pushAllToSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  const { url, apiKey } = getSupabaseConfig();
  if (!url || !url.startsWith('http')) {
    return { ok: false, count: 0, error: 'Supabase Project URL (https://<project-ref>.supabase.co) is required.' };
  }
  if (!apiKey) {
    return { ok: false, count: 0, error: 'Supabase API Key is required.' };
  }

  const now = new Date().toISOString();
  const rows: Array<{ key: string; value: unknown; updated_at: string }> = [];

  for (const key of SYNCED_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        rows.push({ key, value: JSON.parse(raw), updated_at: now });
      } catch {
        // skip malformed
      }
    }
  }

  try {
    const res = await fetch(`${url}/rest/v1/app_data?on_conflict=key`, {
      method: 'POST',
      headers: buildHeaders(apiKey, {
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        count: 0,
        error: `HTTP ${res.status}: ${errText || res.statusText}. Make sure you ran supabase_schema.sql in Supabase SQL Editor.`,
      };
    }

    setLastSyncTime(now);
    return { ok: true, count: rows.length };
  } catch (err: any) {
    return { ok: false, count: 0, error: err?.message || 'Network error connecting to Supabase' };
  }
}

/**
 * Pull all rows from Supabase `app_data` into localStorage
 */
export async function pullAllFromSupabase(): Promise<{ ok: boolean; count: number; error?: string }> {
  const { url, apiKey } = getSupabaseConfig();
  if (!url || !url.startsWith('http')) {
    return { ok: false, count: 0, error: 'Supabase Project URL (https://<project-ref>.supabase.co) is required.' };
  }
  if (!apiKey) {
    return { ok: false, count: 0, error: 'Supabase API Key is required.' };
  }

  try {
    const res = await fetch(`${url}/rest/v1/app_data?select=key,value,updated_at`, {
      method: 'GET',
      headers: buildHeaders(apiKey),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        count: 0,
        error: `HTTP ${res.status}: ${errText || res.statusText}. Make sure you ran supabase_schema.sql in Supabase SQL Editor.`,
      };
    }

    const rows: Array<{ key: string; value: unknown; updated_at?: string }> = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: true, count: 0 };
    }

    for (const row of rows) {
      if (row && typeof row.key === 'string' && row.value !== undefined) {
        localStorage.setItem(row.key, JSON.stringify(row.value));
      }
    }

    setLastSyncTime(new Date().toISOString());
    return { ok: true, count: rows.length };
  } catch (err: any) {
    return { ok: false, count: 0, error: err?.message || 'Network error connecting to Supabase' };
  }
}

/**
 * Export all ERP data as a downloadable JSON backup file
 */
export function exportBackupJson(): void {
  const backup: Record<string, unknown> = {
    _meta: {
      app: 'Hafiz Fabrics POS/ERP',
      exportedAt: new Date().toISOString(),
      version: 5,
    },
  };
  for (const key of SYNCED_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        backup[key] = JSON.parse(raw);
      } catch {
        // skip
      }
    }
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hafiz-fabrics-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import ERP data from a parsed JSON backup object
 */
export async function importBackupJson(data: Record<string, unknown>): Promise<{ count: number; syncedToCloud: boolean }> {
  let count = 0;
  for (const key of SYNCED_KEYS) {
    if (key in data && data[key] !== undefined) {
      localStorage.setItem(key, JSON.stringify(data[key]));
      count++;
    }
  }
  let syncedToCloud = false;
  if (isSupabaseConfigured()) {
    const res = await pushAllToSupabase();
    syncedToCloud = res.ok;
  }
  return { count, syncedToCloud };
}

/**
 * Bootstrap sync on app startup:
 * - If cloud table has data and this device hasn't synced yet, pull from cloud and reload.
 * - If cloud table exists and is empty, push local seeded data up to cloud.
 */
export async function initSupabaseSync(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const alreadySynced = Boolean(getLastSyncTime());
    const pulled = await pullAllFromSupabase();
    if (!pulled.ok) return;
    if (pulled.count === 0) {
      await pushAllToSupabase();
    } else if (!alreadySynced) {
      window.location.reload();
    }
  } catch {
    // ignore background bootstrap errors
  }
}
