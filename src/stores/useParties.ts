import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { mockParties } from '@/mock/parties';
import type { Party } from '@/types';

interface PartiesState {
  parties: Party[];
  add: (p: Party) => void;
  update: (p: Party) => void;
  remove: (id: string) => void;
}

function save(parties: Party[]) { storage.set('parties', parties); }

export const useParties = create<PartiesState>((set) => ({
  parties: (() => {
    if (storage.get('empty_mode')) {
      return storage.get<Party[]>('parties') ?? [];
    }
    const saved = storage.get<Party[]>('parties');
    if (!saved || saved.length === 0 || saved[0]?.openingBalance !== 150000 || saved.find(p => p.id === 'P201')?.currentBalance !== 10835) {
      storage.set('parties', mockParties);
      return mockParties;
    }
    return saved;
  })(),
  add: (p) => set(s => { const updated = [...s.parties, p]; save(updated); return { parties: updated }; }),
  update: (p) => set(s => { const updated = s.parties.map(x => x.id === p.id ? p : x); save(updated); return { parties: updated }; }),
  remove: (id) => set(s => { const updated = s.parties.filter(x => x.id !== id); save(updated); return { parties: updated }; }),
}));
