import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { StockTransfer } from '@/types';

interface StockTransferState {
  transfers: StockTransfer[];
  add: (t: Omit<StockTransfer, 'id' | 'serial'>) => void;
  update: (t: StockTransfer) => void;
  remove: (id: string) => void;
}

export const useStockTransfers = create<StockTransferState>((set, get) => ({
  transfers: storage.get<StockTransfer[]>('stockTransfers') ?? [],
  add: (t) => {
    const transfers = get().transfers;
    const serial = `ST-${String(transfers.length + 1).padStart(3, '0')}`;
    const next: StockTransfer = { ...t, id: `ST${Date.now()}`, serial };
    const updated = [...transfers, next];
    storage.set('stockTransfers', updated);
    set({ transfers: updated });
  },
  update: (t) => {
    const updated = get().transfers.map(x => x.id === t.id ? t : x);
    storage.set('stockTransfers', updated);
    set({ transfers: updated });
  },
  remove: (id) => {
    const updated = get().transfers.filter(x => x.id !== id);
    storage.set('stockTransfers', updated);
    set({ transfers: updated });
  },
}));
