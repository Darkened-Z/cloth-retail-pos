import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { JournalVoucher } from '@/types';

interface JournalsState {
  journals: JournalVoucher[];
  add: (j: Omit<JournalVoucher, 'id' | 'serial'>) => void;
  update: (j: JournalVoucher) => void;
  remove: (id: string) => void;
}

export const useJournals = create<JournalsState>((set, get) => ({
  journals: storage.get<JournalVoucher[]>('journalVouchers') ?? [],
  add: (j) => {
    const journals = get().journals;
    const serial = `JV-${String(journals.length + 1).padStart(3, '0')}`;
    const next: JournalVoucher = { ...j, id: `JV${Date.now()}`, serial };
    const updated = [...journals, next];
    storage.set('journalVouchers', updated);
    set({ journals: updated });
  },
  update: (j) => {
    const updated = get().journals.map(x => x.id === j.id ? j : x);
    storage.set('journalVouchers', updated);
    set({ journals: updated });
  },
  remove: (id) => {
    const updated = get().journals.filter(x => x.id !== id);
    storage.set('journalVouchers', updated);
    set({ journals: updated });
  },
}));
