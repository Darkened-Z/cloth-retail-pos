import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { JournalVoucher } from '@/types';

interface JournalsState {
  journals: JournalVoucher[];
  add: (j: Omit<JournalVoucher, 'id' | 'serial'>) => void;
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
}));
